import { mkdir } from 'node:fs/promises';
import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const instant = new Date('2026-10-25T12:00:00Z');
const test = base.extend<{ surveillance: void }>({
  surveillance: [async ({ page }, utiliser) => {
    const erreurs: string[] = [];
    const externes: string[] = [];
    page.on('console', message => { if (message.type() === 'error') erreurs.push(message.text()); });
    page.on('pageerror', erreur => erreurs.push(erreur.message));
    page.on('request', requete => {
      if (new URL(requete.url()).hostname !== 'localhost') externes.push(requete.url());
    });
    await utiliser();
    expect.soft(erreurs, 'Erreurs de console ou de page').toEqual([]);
    expect.soft(externes, 'Requêtes hors de localhost').toEqual([]);
  }, { auto: true }],
});

async function demarrer(page: Page) {
  await page.clock.install({ time: instant });
  await page.clock.pauseAt(instant);
  await page.addInitScript(() => { Math.random = () => 0.1; });
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.addInitScript(() => {
    const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'));
    if (!cle || sessionStorage.getItem('objets-actifs-prepare')) return;
    sessionStorage.setItem('objets-actifs-prepare', '1');
    const enveloppe = JSON.parse(localStorage.getItem(cle)!);
    enveloppe.donnees.equipe = [{ uid: 'objets-actifs-bulbizarre', numero: 1, niveau: 16, xp: 0,
      shiny: false, bonheur: 0, pierreEternelle: false, calcium: 0, sexe: 'male', favori: false }];
    enveloppe.donnees.inventaire = { repel: 2, xAttack: 1, pokeDoll: 1, everstone: 1, shinyToken: 1 };
    enveloppe.donnees.ameliorations = ['pokeradar', 'falseSwipe'];
    enveloppe.donnees.bossVaincus = ['kanto.route-1'];
    enveloppe.revision += 1;
    localStorage.setItem(cle, JSON.stringify(enveloppe));
  });
  await page.reload();
}

async function utiliser(page: Page, nom: string, stock = 1) {
  await page.getByRole('button', { name: 'Équipe', exact: true }).click();
  const sac = page.getByRole('region', { name: 'Sac', exact: true });
  await sac.getByRole('button', { name: `${nom} ×${stock}`, exact: true }).click();
}

async function combat(page: Page) {
  await page.getByRole('button', { name: 'Combat', exact: true }).click();
}

async function capturer(page: Page, nom: string) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await mkdir('design/captures', { recursive: true });
  await page.evaluate(() => Promise.all([...document.images].map(image => image.decode())));
  await page.screenshot({ path: `design/captures/m-${nom}-${page.viewportSize()!.width}.png`, animations: 'disabled' });
}

test('Repousse : stock, durée sauvegardée et expiration ; Attaque + et radar', async ({ page }) => {
  await demarrer(page);
  await utiliser(page, 'Repousse', 2);
  await expect(page.getByRole('status').filter({ hasText: 'Repousse active !' })).toHaveText('Repousse active !');
  await expect(page.getByRole('button', { name: 'Repousse ×1', exact: true })).toBeVisible();
  await combat(page);
  const effets = page.getByRole('list', { name: 'Effets actifs' });
  await expect(effets).toContainText('Repousse : 30 s');
  await page.clock.fastForward(10000);
  await expect(effets).toContainText('Repousse : 20 s');
  await page.clock.install({ time: new Date(instant.getTime() + 15000) });
  await page.clock.pauseAt(new Date(instant.getTime() + 15000));
  await page.goto('/');
  await expect(effets).toContainText('Repousse : 15 s');
  await utiliser(page, 'Attaque +');
  await combat(page);
  await expect(effets).toContainText('Attaque + ×1,5 : 30 s');
  await capturer(page, 'combat');
  const radar = page.getByRole('button', { name: 'Poké-Radar', exact: true });
  await radar.click();
  const fenetre = page.getByRole('dialog', { name: 'Route 1', exact: true });
  await expect(fenetre).toBeVisible();
  await expect(fenetre.getByRole('listitem')).not.toHaveCount(0);
  await expect(fenetre.getByText('Commun', { exact: true }).first()).toBeVisible();
  await capturer(page, 'radar');
  await fenetre.getByRole('button', { name: 'Fermer', exact: true }).click();
  await expect(fenetre).not.toBeVisible();
  await expect(radar).toBeFocused();
  await radar.click();
  await page.keyboard.press('Escape');
  await expect(fenetre).not.toBeVisible();
  await expect(radar).toBeFocused();
  await page.clock.fastForward(15000);
  await expect(effets).not.toContainText('Repousse');
  await expect(effets).toContainText('Attaque + ×1,5 : 15 s');
  await page.clock.fastForward(15000);
  await expect(effets.getByRole('listitem')).toHaveCount(0);
});

test('Fauchage : un PV, recharge ; Poupée : boss invoqué', async ({ page }) => {
  await demarrer(page);
  const fauchage = page.getByRole('button', { name: 'Fauchage', exact: true });
  await fauchage.click();
  await expect(fauchage).toHaveAttribute('aria-pressed', 'true');
  await expect(fauchage).toBeDisabled();
  await expect(page.getByText('Recharge : 30 s', { exact: true })).toBeVisible();
  const pv = page.getByRole('progressbar', { name: /^PV/ });
  for (let appui = 0; appui < 100 && await pv.getAttribute('aria-valuenow') !== '1'; appui++) {
    await page.clock.runFor(90);
    await page.getByRole('button', { name: /^Attaquer / }).click();
  }
  await expect(pv).toHaveAttribute('aria-valuenow', '1');
  await page.clock.runFor(90);
  await page.getByRole('button', { name: /^Attaquer / }).click();
  await expect(pv).toHaveAttribute('aria-valuenow', '1');
  await page.clock.fastForward(30000);
  await expect(fauchage).toBeEnabled();
  await utiliser(page, 'Poké Poupée');
  await expect(page.getByRole('status').filter({ hasText: 'Boss invoqué !' })).toHaveText('Boss invoqué !');
  await combat(page);
  await expect(page.getByText('Étape 10 sur 10', { exact: true })).toBeVisible();
  await expect(page.getByRole('progressbar', { name: 'Temps restant' })).toBeVisible();
  await expect(fauchage).toBeDisabled();
  await expect(page.getByText('Inutile sur un boss !', { exact: true })).toBeVisible();
});

test('Pierre Stase : pose et retrait ; Jeton : confirmation et chromatique sauvegardé', async ({ page }) => {
  await demarrer(page);
  await utiliser(page, 'Pierre Stase');
  const bulbizarre = page.getByRole('button', { name: 'Bulbizarre, niveau 16', exact: true });
  await bulbizarre.click();
  await expect(page.getByRole('img', { name: 'Pierre Stase', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Faire évoluer Bulbizarre' })).toHaveCount(0);
  await bulbizarre.click({ button: 'right' });
  await page.getByRole('menuitem', { name: "Retirer l'objet", exact: true }).click();
  await expect(page.getByRole('img', { name: 'Pierre Stase', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Pierre Stase ×1', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Faire évoluer Bulbizarre' })).toBeVisible();
  await utiliser(page, 'Jeton Shiny');
  await bulbizarre.click();
  const confirmation = page.getByRole('group', { name: 'Utiliser Jeton Shiny sur Bulbizarre ?', exact: true });
  await confirmation.getByRole('button', { name: 'Annuler', exact: true }).click();
  await expect(bulbizarre).toBeFocused();
  await utiliser(page, 'Jeton Shiny');
  await bulbizarre.click();
  await confirmation.getByRole('button', { name: 'Valider', exact: true }).click();
  await page.reload();
  const pokemon = await page.evaluate(() => {
    const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'))!;
    return JSON.parse(localStorage.getItem(cle)!).donnees;
  });
  expect(pokemon.equipe[0]).toMatchObject({ uid: 'objets-actifs-bulbizarre', shiny: true, pierreEternelle: false });
  expect(pokemon.inventaire.shinyToken ?? 0).toBe(0);
  expect(pokemon.inventaire.everstone).toBe(1);
});
