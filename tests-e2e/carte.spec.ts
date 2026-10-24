import { mkdir } from 'node:fs/promises';
import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Mêmes observateurs que le combat : aucune erreur de console, aucune requête hors de localhost.
const test = base.extend<{ surveillance: void }>({
  surveillance: [async ({ page }, utiliser) => {
    const erreurs: string[] = [];
    const requetesExternes: string[] = [];
    page.on('console', message => { if (message.type() === 'error') erreurs.push(message.text()); });
    page.on('pageerror', erreur => erreurs.push(erreur.message));
    page.on('request', requete => {
      if (new URL(requete.url()).hostname !== 'localhost') requetesExternes.push(requete.url());
    });
    await utiliser();
    expect.soft(erreurs, 'Erreurs de console ou de page').toEqual([]);
    expect.soft(requetesExternes, 'Requêtes hors de localhost').toEqual([]);
  }, { auto: true }],
});

async function ouvrirCarte(page: Page, adresse = '/') {
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await page.goto(adresse);
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.getByRole('button', { name: 'Carte', exact: true }).click();
  await expect(page.getByRole('img', { name: 'Carte de Kanto' }).or(page.locator('svg[aria-label="Carte de Kanto"]'))).toBeVisible();
  await page.evaluate(() => Promise.all([...document.images].map(image => image.decode().catch(() => undefined))));
}

test('Carte : image sans bande, cibles tactiles, zone fermée et captures', async ({ page }, informations) => {
  await ouvrirCarte(page);
  const carte = page.locator('svg[aria-label="Carte de Kanto"]');
  const boite = (await carte.boundingBox())!;
  expect(boite.width / boite.height).toBeCloseTo(16 / 9, 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await expect(page.getByRole('progressbar', { name: 'Badges obtenus' })).toBeVisible();
  // Zones ouvertes : Bourg Palette et Route 1 (actuelle) ; la fiche réserve sa place sans bouger la carte.
  const zoneOuverte = page.getByRole('button', { name: 'Bourg Palette', exact: true });
  await expect(zoneOuverte).toBeVisible();
  const avant = (await carte.boundingBox())!;
  await zoneOuverte.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('region', { name: 'Zone sélectionnée' })).toContainText('Bourg Palette');
  await expect(page.getByRole('button', { name: 'Y aller' })).toBeVisible();
  const apres = (await carte.boundingBox())!;
  expect(Math.abs(apres.y - avant.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(apres.height - avant.height)).toBeLessThanOrEqual(1);
  // Cible ≥ 44 px : le halo de toucher de chaque zone ouverte.
  const halos = await page.locator('[data-halos] circle').evaluateAll(cercles => cercles.map(cercle => {
    const rectangle = cercle.getBoundingClientRect();
    return Math.min(rectangle.width, rectangle.height);
  }));
  expect(halos.length).toBeGreaterThan(0);
  for (const taille of halos) expect(taille).toBeGreaterThanOrEqual(43.5);
  // Zone fermée : « Bloquée » et la raison en français, sans bouton d'action.
  await page.locator('[data-forme="Forêt de Jade"]').first().focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('region', { name: 'Zone sélectionnée' })).toContainText('Bloquée');
  await expect(page.getByRole('region', { name: 'Zone sélectionnée' })).toContainText('Bats le boss de Route 1.');
  await expect(page.getByRole('button', { name: 'Y aller' })).toHaveCount(0);
  await mkdir('design/captures', { recursive: true });
  const largeur = informations.project.name === 'mobile' ? 390 : 1440;
  await page.screenshot({ path: `design/captures/g-carte-${largeur}.png`, animations: 'disabled' });
});

test('Carte : vol vers une zone, second clic ignoré, puis retour au combat', async ({ page }) => {
  await ouvrirCarte(page);
  await page.getByRole('button', { name: 'Bourg Palette', exact: true }).focus();
  await page.keyboard.press('Enter');
  const allerVers = page.getByRole('button', { name: 'Y aller' });
  await allerVers.click();
  await page.clock.runFor(900);
  await expect(page.locator('[data-vol-overlay]')).toBeAttached();
  await allerVers.click({ force: true }).catch(() => undefined);
  await page.clock.runFor(2300);
  await expect(page.getByRole('button', { name: 'Carte', exact: true })).toHaveAttribute('aria-current', 'page');
  await page.clock.runFor(700);
  await expect(page.getByRole('heading', { name: 'Bourg Palette', exact: true })).toBeVisible();
  await expect(page.getByText('Pas de Pokémon sauvage ici. Va sur la Route 1 pour combattre.')).toBeVisible();
});

test('Carte : mouvement réduit, changement de zone sans overlay', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ouvrirCarte(page);
  await page.getByRole('button', { name: 'Bourg Palette', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Y aller' }).click();
  await expect(page.locator('[data-vol-overlay]')).toHaveCount(0);
  await page.clock.runFor(400);
  await expect(page.getByRole('heading', { name: 'Bourg Palette', exact: true })).toBeVisible();
});

test('Carte : zoom à la molette et déplacement sans faire défiler la page, mode debug', async ({ page }, informations) => {
  test.skip(informations.project.name === 'mobile', 'Molette et glisser à la souris : profil PC.');
  await ouvrirCarte(page, '/?debug=carte');
  const carte = page.locator('svg[aria-label="Carte de Kanto"]');
  const viewBox = () => carte.getAttribute('viewBox');
  const initial = await viewBox();
  const boite = (await carte.boundingBox())!;
  await page.mouse.move(boite.x + boite.width / 2, boite.y + boite.height / 2);
  await page.mouse.wheel(0, -400);
  await expect.poll(viewBox).not.toBe(initial);
  const zoome = await viewBox();
  const defilement = await page.evaluate(() => window.scrollY);
  await page.mouse.down();
  await page.mouse.move(boite.x + boite.width / 2 + 120, boite.y + boite.height / 2 + 60, { steps: 6 });
  await page.mouse.up();
  await expect.poll(viewBox).not.toBe(zoome);
  expect(await page.evaluate(() => window.scrollY)).toBe(defilement);
  // Mode debug : les 24 noms de formes sont écrits sur la carte.
  const noms = await page.locator('svg[aria-label="Carte de Kanto"] text').allTextContents();
  expect(noms.length).toBeGreaterThanOrEqual(24);
});
