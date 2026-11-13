import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { telephone } from './aide-carte';

// Ticket I, lot I1 : coquille PC (barre latérale, bandeau, légende, clavier, fenêtres, notifications).
const ONGLETS = ['Combat', 'Équipe', 'PC', 'Shop', 'Carte', 'Menu'];
const nav = (page: Page) => page.getByRole('navigation', { name: 'Navigation principale' });
const bouton = (page: Page, nom: string) => nav(page).getByRole('button', { name: nom, exact: true });

async function demarrer(page: Page, largeur = 1440, hauteur = 900) {
  await page.setViewportSize({ width: largeur, height: hauteur });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.locator('body').click({ position: { x: 5, y: 5 } });
}

test.beforeEach(({ page }) => { test.skip(telephone(page), 'Coquille PC : 1024 px et plus'); });

test('1440 px : barre latérale de 15 rem, six entrées, bandeau, pas de légende en bas', async ({ page }) => {
  await demarrer(page);
  const barre = await page.locator('aside.barre-laterale').boundingBox();
  expect(barre?.width).toBeCloseTo(240, 0);
  expect(await nav(page).getByRole('button').count()).toBe(6);
  for (const [i, nom] of ONGLETS.entries()) await expect(nav(page).getByRole('button').nth(i)).toContainText(nom);
  await expect(page.getByRole('banner', { name: 'Chiffres clés' })).toContainText('Pokédollars');
  await expect(page.getByRole('banner', { name: 'Chiffres clés' })).toContainText('DPS');
  await expect(page.getByRole('contentinfo')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Raccourcis ?' })).toBeVisible();
});

test('1 à 6 changent d\'onglet au clavier, la page ne défile jamais (1280, 1440, 1920, 2560)', async ({ page }) => {
  await demarrer(page);
  const tailles: [number, number][] = [[1280, 800], [1440, 900], [1920, 1080], [2560, 1440]];
  for (const [largeur, hauteur] of tailles) {
    await page.setViewportSize({ width: largeur, height: hauteur });
    for (const [i, nom] of ONGLETS.entries()) {
      await page.keyboard.press(String(i + 1));
      await expect(bouton(page, nom)).toHaveAttribute('aria-current', 'page');
      const mesure = await page.evaluate(() => ({ h: document.documentElement.scrollHeight, vh: innerHeight, w: document.documentElement.scrollWidth, vw: innerWidth }));
      expect(mesure.h, `${nom} à ${largeur} : défilement de la page`).toBeLessThanOrEqual(mesure.vh);
      expect(mesure.w).toBeLessThanOrEqual(mesure.vw);
    }
  }
});

test('Espace attaque et 3 ouvre le PC', async ({ page }) => {
  await demarrer(page);
  const barre = page.getByRole('progressbar', { name: /^PV de / });
  const avant = [await barre.getAttribute('aria-label'), await barre.getAttribute('aria-valuenow')];
  await page.keyboard.press('Space');
  await expect.poll(async () => [await barre.getAttribute('aria-label'), await barre.getAttribute('aria-valuenow')]).not.toEqual(avant);
  await page.keyboard.press('3');
  await expect(bouton(page, 'PC')).toHaveAttribute('aria-current', 'page');
});

test('Fenêtre des raccourcis : Tab reste dedans, Échap ferme et rend le focus au bouton', async ({ page }) => {
  await demarrer(page);
  const ouvrir = page.getByRole('button', { name: 'Raccourcis ?' });
  await ouvrir.focus();
  await page.keyboard.press('Enter');
  const fenetre = page.getByRole('dialog', { name: 'Raccourcis clavier' });
  await expect(fenetre).toBeVisible();
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('dialog[open]'))).toBe(true);
  }
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Shift+Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('dialog[open]'))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(fenetre).toHaveCount(0);
  await expect(ouvrir).toBeFocused();
  await page.keyboard.press('?');
  await expect(fenetre).toBeVisible();
  await page.keyboard.press('?');
  await expect(fenetre).toHaveCount(0);
});

test('Focus visible (cadre jaune) et survol sur la barre latérale', async ({ page }) => {
  await demarrer(page);
  await bouton(page, 'Shop').focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  const contour = await bouton(page, 'Shop').evaluate(e => { const s = getComputedStyle(e); return { largeur: s.outlineWidth, style: s.outlineStyle, couleur: s.outlineColor }; });
  expect(contour.style).toBe('solid');
  expect(parseFloat(contour.largeur)).toBeGreaterThanOrEqual(3);
  const jaune = await page.evaluate(() => { const e = document.createElement('i'); e.style.color = 'var(--focus)'; document.querySelector('[data-region]')!.append(e); const c = getComputedStyle(e).color; e.remove(); return c; });
  expect(contour.couleur).toBe(jaune);
  const fondAvant = await bouton(page, 'Carte').evaluate(e => getComputedStyle(e).backgroundColor);
  await bouton(page, 'Carte').hover();
  const fondApres = await bouton(page, 'Carte').evaluate(e => getComputedStyle(e).backgroundColor);
  expect(fondApres).not.toBe(fondAvant);
});
