import { mkdir } from 'node:fs/promises';
import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Le Sac est une fenêtre sur tous les écrans.
const test = base.extend<{ surveillance: void }>({
  surveillance: [async ({ page }, utiliser) => {
    const erreurs: string[] = [];
    page.on('console', message => { if (message.type() === 'error') erreurs.push(message.text()); });
    page.on('pageerror', erreur => erreurs.push(erreur.message));
    await utiliser();
    expect.soft(erreurs, 'Erreurs de console ou de page').toEqual([]);
  }, { auto: true }],
});

async function demarrer(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.addInitScript(() => {
    const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'));
    if (!cle || sessionStorage.getItem('sac-prepare')) return;
    sessionStorage.setItem('sac-prepare', '1');
    const enveloppe = JSON.parse(localStorage.getItem(cle)!);
    enveloppe.donnees.equipe = [{ uid: 'sac-bulbizarre', numero: 1, niveau: 16, xp: 0,
      shiny: false, bonheur: 0, pierreEternelle: false, calcium: 0, sexe: 'male', favori: false }];
    enveloppe.donnees.inventaire = { everstone: 1, repel: 1 };
    enveloppe.donnees.bossVaincus = ['kanto.route-1', 'kanto.foret-de-jade'];
    enveloppe.revision += 1;
    localStorage.setItem(cle, JSON.stringify(enveloppe));
  });
  await page.reload();
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  // Bulbizarre niveau 16 peut évoluer : la proposition d'évolution (automatique) s'ouvre au chargement, on la remet à plus tard.
  const evolution = page.locator('dialog.fenetre-evolution[open]');
  if (await evolution.count()) await evolution.getByRole('button', { name: 'Plus tard', exact: true }).click();
}

const fenetreSac = (page: Page) => page.locator('dialog[open]').getByRole('region', { name: 'Sac', exact: true });

async function capturer(page: Page, nom: string) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await mkdir('design/captures', { recursive: true });
  await page.evaluate(() => Promise.all([...document.images].map(image => image.decode().catch(() => undefined))));
  await page.screenshot({ path: `design/captures/lot4-${nom}-390.png`, animations: 'disabled' });
}

test('Sac : fenêtre depuis le Combat, objet vers un Pokémon, annulation et retour', async ({ page }) => {
  await demarrer(page);
  await page.getByRole('button', { name: 'Sac', exact: true }).click();
  await expect(fenetreSac(page)).toBeVisible();
  await capturer(page, 'sac');
  // Choisir un objet ouvre le PC.
  await fenetreSac(page).getByRole('button', { name: 'Pierre Stase ×1', exact: true }).click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'PC de Léo', level: 1 })).toBeVisible();
  const bandeau = page.getByRole('status').filter({ hasText: /Pierre Stase ×\d+ : touche un Pokémon/ });
  await expect(bandeau).toBeVisible();
  await expect(page.getByRole('region', { name: 'Sac', exact: true })).toHaveCount(0);
  await capturer(page, 'choix');
  // Fermer ramène à la page d'où le Sac a été ouvert (le Combat) et rouvre le Sac.
  await page.getByRole('button', { name: 'Fermer', exact: true }).click();
  await expect(fenetreSac(page)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'PC de Léo', level: 1 })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  // Choisir de nouveau l'objet rouvre le PC ; appliquer l'objet pose la Pierre Stase et ramène à la page d'où le Sac a été ouvert.
  await fenetreSac(page).getByRole('button', { name: 'Pierre Stase ×1', exact: true }).click();
  await page.getByRole('button', { name: 'Bulbizarre, niveau 16', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'PC de Léo', level: 1 })).toHaveCount(0);
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await page.reload();
  const equipe = await page.evaluate(() => {
    const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'))!;
    return JSON.parse(localStorage.getItem(cle)!).donnees;
  });
  expect(equipe.equipe[0]).toMatchObject({ uid: 'sac-bulbizarre', pierreEternelle: true });
  expect(equipe.inventaire.everstone ?? 0).toBe(0);
});

test('PC : onglet direct et accès depuis le Menu', async ({ page }) => {
  await demarrer(page);
  await page.getByRole('button', { name: 'PC', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'PC de Léo' })).toBeVisible();
  await expect(page.getByRole('navigation').getByRole('button', { name: 'PC', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('[aria-label="Équipe mobile"], .pc-places')).toBeVisible();
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('button', { name: 'PC de Léo', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'PC de Léo' })).toBeVisible();
});
