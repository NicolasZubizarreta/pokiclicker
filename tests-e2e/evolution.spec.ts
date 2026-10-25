import { mkdir } from 'node:fs/promises';
import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

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

async function demarrer(page: Page, numero: number, niveau = 16) {
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await page.addInitScript(() => { Math.random = () => 0.1; });
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.addInitScript(({ numero, niveau }) => {
    const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'));
    if (!cle || sessionStorage.getItem('evolution-prepare')) return;
    sessionStorage.setItem('evolution-prepare', '1');
    const enveloppe = JSON.parse(localStorage.getItem(cle)!);
    enveloppe.donnees.equipe = [{ uid: 'evolution-test', numero, niveau, xp: 0,
      shiny: false, bonheur: 0, pierreEternelle: false, calcium: 0, sexe: 'male', favori: false }];
    enveloppe.donnees.inventaire = { thunderStone: 1, waterStone: 1 };
    enveloppe.donnees.bossVaincus = ['kanto.route-1'];
    enveloppe.revision += 1;
    localStorage.setItem(cle, JSON.stringify(enveloppe));
  }, { numero, niveau });
  await page.reload();
  await page.getByRole('button', { name: 'Équipe', exact: true }).click();
}

async function choisirPierre(page: Page, pierre: string) {
  const sac = page.getByRole('region', { name: 'Sac', exact: true });
  await sac.getByRole('button', { name: `${pierre} ×1`, exact: true }).click();
  await sac.getByRole('button', { name: 'Utiliser', exact: true }).click();
  await expect(page.getByText('Sélectionne un Pokémon.', { exact: true })).toBeVisible();
}

test('Bulbizarre niveau 15 : évolution absente', async ({ page }) => {
  await demarrer(page, 1, 15);
  await expect(page.getByRole('button', { name: 'Bulbizarre, niveau 15', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Faire évoluer Bulbizarre' })).toHaveCount(0);
});

test('Bulbizarre : animation, largeur, sauvegarde et Pokédex', async ({ page }, informations) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await demarrer(page, 1);
  const evoluer = page.getByRole('button', { name: 'Faire évoluer Bulbizarre', exact: true });
  await expect(evoluer).toBeVisible();
  // Le liseré d'alerte doit réellement s'appliquer (une classe utilitaire perd contre .cadre, hors couche).
  const couleurs = await evoluer.evaluate(element => {
    const sonde = document.createElement('div');
    sonde.style.borderColor = 'var(--alerte-base)';
    sonde.style.borderStyle = 'solid';
    document.body.append(sonde);
    const attendue = getComputedStyle(sonde).borderTopColor;
    sonde.remove();
    return { reelle: getComputedStyle(element).borderTopColor, attendue };
  });
  expect(couleurs.reelle).toBe(couleurs.attendue);
  await evoluer.click();
  await page.clock.runFor(1000);
  const ligne = page.getByRole('button', { name: 'Herbizarre, niveau 16', exact: true });
  await expect(ligne.locator('[class*="evolution-flash"]')).toBeVisible();
  await expect(evoluer).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await mkdir('design/captures', { recursive: true });
  await page.evaluate(() => Promise.all([...document.images].map(i => i.decode().catch(() => undefined))));
  await page.screenshot({ path: `design/captures/k-evolution-${informations.project.name === 'mobile' ? 390 : 1440}.png` });
  await page.clock.runFor(2000);
  await expect(ligne).toBeVisible();
  await expect(page.locator('[class*="evolution-flash"]')).toHaveCount(0);
  await page.reload();
  await page.getByRole('button', { name: 'Équipe', exact: true }).click();
  await expect(ligne).toBeVisible();
  await page.getByRole('button', { name: 'Plus', exact: true }).click();
  await page.getByRole('button', { name: /^Pokédex/ }).click();
  await expect(page.getByRole('listitem')).toHaveCount(151);
  await expect(page.getByRole('listitem').filter({ hasText: 'Herbizarre' })).toHaveCount(1);
});

for (const [numero, nom, pierre, cible] of [
  [25, 'Pikachu', 'Pierre Foudre', 'Raichu'],
  [133, 'Évoli', 'Pierre Eau', 'Aquali'],
] as const) {
  test(`${nom} : confirmation ${pierre}, ${cible} et stock épuisé`, async ({ page }) => {
    await demarrer(page, numero);
    await choisirPierre(page, pierre);
    await page.getByRole('button', { name: `${nom}, niveau 16`, exact: true }).click();
    const confirmation = page.getByRole('group', { name: `Utiliser ${pierre} sur ${nom} ?`, exact: true });
    await expect(confirmation).toBeVisible();
    await confirmation.getByRole('button', { name: 'Valider', exact: true }).click();
    await page.clock.runFor(3000);
    await expect(page.getByRole('button', { name: `${cible}, niveau 16`, exact: true })).toBeVisible();
    const stock = page.getByRole('region', { name: 'Sac', exact: true }).getByRole('button', { name: new RegExp(`^${pierre} ×`) });
    if (await stock.count()) await expect(stock).toHaveAccessibleName(`${pierre} ×0`);
    else await expect(stock).toHaveCount(0);
  });
}

test('Rattata : refus de Pierre Eau et stock intact', async ({ page }) => {
  await demarrer(page, 19);
  await choisirPierre(page, 'Pierre Eau');
  await page.getByRole('button', { name: 'Rattata, niveau 16', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Pokémon incompatible !');
  await expect(page.getByRole('button', { name: 'Pierre Eau ×1', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Valider', exact: true })).toHaveCount(0);
});

test('Animations réduites : remplacement immédiat sans animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await demarrer(page, 1);
  await page.getByRole('button', { name: 'Faire évoluer Bulbizarre', exact: true }).click();
  const ligne = page.getByRole('button', { name: 'Herbizarre, niveau 16', exact: true });
  await expect(ligne).toBeVisible();
  expect(await ligne.evaluate(element => [...element.querySelectorAll('*')]
    .every(enfant => getComputedStyle(enfant).animationName === 'none'))).toBe(true);
});
