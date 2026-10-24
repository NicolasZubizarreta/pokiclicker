import { mkdir } from 'node:fs/promises';
import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Installer les observateurs avant toute navigation, y compris les rechargements.
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

async function ouvrir(page: Page) {
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Route 1', exact: true })).toBeVisible();
  await expect(page.getByText('Étape 1 sur 10', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.evaluate(() => Promise.all([...document.images].map(image => image.decode())));
}

async function atteindre(page: Page, etape: number) {
  for (let appui = 0; appui < 1500; appui++) {
    if (await page.getByText(`Étape ${etape} sur 10`, { exact: true }).isVisible()) return;
    await page.getByRole('button', { name: /^Attaquer / }).click({ force: true });
    await page.clock.runFor(90);
  }
  throw new Error(`Étape ${etape} non atteinte après 1500 appuis espacés de 90 ms`);
}

async function stockage(page: Page) {
  return page.evaluate(() => Object.fromEntries(Object.keys(localStorage).sort()
    .filter(cle => cle.startsWith('pokiclicker:')).map(cle => [cle, localStorage.getItem(cle)])));
}

async function verifierFenetre(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBeLessThanOrEqual(1);
  const dialogue = (await page.getByRole('complementary', { name: 'Dialogue' }).boundingBox())!;
  const taille = page.viewportSize()!;
  const limite = taille.width < 1024 ? (await page.getByRole('navigation').boundingBox())!.y : taille.height;
  expect(dialogue.y + dialogue.height).toBeLessThanOrEqual(limite);
  const scene = (await page.getByRole('region', { name: /^Combat contre/ }).boundingBox())!;
  expect(scene.y).toBeGreaterThanOrEqual(0);
  expect(scene.y + scene.height).toBeLessThanOrEqual(limite);
}

test('Parcours : dix étapes, boss, fin de route et captures', async ({ page }, informations) => {
  await ouvrir(page);
  await mkdir('design/captures', { recursive: true });
  const largeur = informations.project.name === 'mobile' ? 390 : 1440;
  await page.screenshot({ path: `design/captures/h-combat-${largeur}.png`, animations: 'disabled' });
  await verifierFenetre(page);
  if (informations.project.name === 'pc') {
    await page.setViewportSize({ width: 1915, height: 1007 });
    await verifierFenetre(page);
    await page.screenshot({ path: 'design/captures/h-combat-1915.png', animations: 'disabled' });
    await page.setViewportSize({ width: 1440, height: 900 });
  }
  await atteindre(page, 10);
  await expect(page.getByRole('heading', { name: 'Rattata (Géant)', exact: true })).toBeVisible();
  await page.evaluate(() => Promise.all([...document.images].map(image => image.decode())));
  await page.screenshot({ path: `design/captures/h-combat-${largeur}-boss.png`, animations: 'disabled' });
  await atteindre(page, 1);
  await expect(page.getByRole('status')).toHaveText('Route 1 terminée !');
  await expect(page.getByText('La suite arrive bientôt.', { exact: true })).toBeVisible();
  await verifierFenetre(page);
  if (informations.project.name === 'pc') {
    await page.setViewportSize({ width: 1915, height: 1007 });
    await verifierFenetre(page);
  }
});

test('Contexte non sécurisé : combat disponible sans randomUUID', async ({ page }, informations) => {
  test.skip(informations.project.name !== 'mobile', 'Régression téléphone.');
  await page.addInitScript(() => { Object.defineProperty(crypto, 'randomUUID', { value: undefined }); });
  await ouvrir(page);
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByRole('button', { name: /^Attaquer / }).click();
  await page.clock.runFor(100);
  await expect(page.locator('.degat-flottant')).toHaveCount(1);
});

test('Reprise : même étape, même équipe et sauvegarde stable', async ({ page }, informations) => {
  await ouvrir(page);
  await atteindre(page, 5);
  const equipe = page.getByRole('region', { name: 'Ton équipe' });
  // Les DPS dépendent du type du nouvel ennemi ; comparer l’identité et le niveau.
  const avant = await equipe.locator('[aria-label]').evaluateAll(cartes => cartes.map(carte => carte.getAttribute('aria-label')?.replace(/, [\d.]+ DPS$/, '')));
  await page.reload();
  await expect(page.getByText('Étape 5 sur 10', { exact: true })).toBeVisible();
  expect(await equipe.locator('[aria-label]').evaluateAll(cartes => cartes.map(carte => carte.getAttribute('aria-label')?.replace(/, [\d.]+ DPS$/, '')))).toEqual(avant);
  for (const nom of ['Bulbizarre', 'Salamèche', 'Carapuce']) {
    const carte = equipe.locator(`[aria-label^="${nom},"]`);
    await expect(carte).toHaveCount(1);
    await expect(carte).toHaveAttribute('aria-label', new RegExp(`${nom}, niveau 5, \\d+(?:\\.\\d+)? DPS`));
    // Sur mobile, les cases font 56 px (DESIGN.md) : le DPS n'y est donné qu'au total et dans le nom accessible.
    if (informations.project.name === 'pc') await expect(carte.getByText(/DPS/), `DPS visible de ${nom}`).toBeVisible();
  }
  await expect(equipe.locator('[aria-label]:not([aria-label="Case libre"])')).toHaveCount(3);
  const premiere = await stockage(page);
  await page.clock.runFor(100);
  expect(await stockage(page)).toEqual(premiere);
  expect(Object.keys(premiere).filter(cle => cle.startsWith('pokiclicker:partie:'))).toHaveLength(1);
});

test('Erreur de données : message français et données intactes', async ({ page }) => {
  const invalide = '{ JSON invalide : éè\\u0000';
  await page.addInitScript(valeur => localStorage.setItem('pokiclicker:partie:abc', valeur), invalide);
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('Une erreur est survenue. Recharge la page ; ta partie est gardée.');
  expect(await page.evaluate(() => localStorage.getItem('pokiclicker:partie:abc'))).toBe(invalide);
});

test('Mise en page : scène, navigation, équipe et langue', async ({ page }, informations) => {
  await ouvrir(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  expect(await page.locator('body').innerText()).not.toMatch(/\b(Attack|Team|Level|Loading|Error)\b/);
  const scene = page.getByRole('region', { name: /^Combat contre/ });
  const boiteScene = (await scene.boundingBox())!;
  const decor = scene.locator('img').first();
  await expect(decor).toHaveJSProperty('complete', true);
  expect(await decor.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  const boiteDecor = (await decor.boundingBox())!;
  // Le décor remplit l'intérieur du cadre de la scène : on retire l'épaisseur de la bordure.
  const bordure = await scene.evaluate(element => {
    const style = getComputedStyle(element);
    return { gauche: parseFloat(style.borderLeftWidth), haut: parseFloat(style.borderTopWidth),
      droite: parseFloat(style.borderRightWidth), bas: parseFloat(style.borderBottomWidth) };
  });
  const attendu = { x: boiteScene.x + bordure.gauche, y: boiteScene.y + bordure.haut,
    width: boiteScene.width - bordure.gauche - bordure.droite, height: boiteScene.height - bordure.haut - bordure.bas };
  for (const dimension of ['x', 'y', 'width', 'height'] as const) {
    expect(boiteDecor[dimension], `Décor et scène : ${dimension}`).toBeCloseTo(attendu[dimension], 0);
  }
  await expect(decor).toHaveCSS('object-fit', 'cover');
  const bouton = (await page.getByRole('button', { name: /^Attaquer / }).boundingBox())!;
  expect(bouton).toEqual(boiteScene);
  await expect(page.getByRole('button', { name: 'Attaque', exact: true })).toHaveCount(0);
  await expect(page.locator('button.bg-action')).toHaveCount(0);
  if (informations.project.name !== 'mobile') {
    expect(boiteScene.width / boiteScene.height).toBeCloseTo(16 / 9, 2);
    const navigation = page.getByRole('navigation');
    const boiteNavigation = (await navigation.boundingBox())!;
    expect(boiteNavigation.x + boiteNavigation.width).toBeLessThanOrEqual(boiteScene.x);
    const liens = await navigation.locator('a, button').evaluateAll(elements => elements.map(element => {
      const boite = element.getBoundingClientRect();
      return { x: boite.x, y: boite.y };
    }));
    expect(liens.length).toBeGreaterThan(1);
    for (let index = 1; index < liens.length; index++) {
      expect(liens[index]!.x).toBeCloseTo(liens[0]!.x, 0);
      expect(liens[index]!.y).toBeGreaterThan(liens[index - 1]!.y);
    }
    const equipe = (await page.getByRole('region', { name: 'Ton équipe' }).boundingBox())!;
    expect(equipe.x).toBeGreaterThanOrEqual(boiteScene.x + boiteScene.width);
  }
});
