import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';

test.beforeEach(async ({ page, baseURL }) => {
  if (baseURL !== 'http://localhost:4179') return;
  const racine = resolve('dist');
  const types: Record<string, string> = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
    '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
  await page.route('http://localhost:4179/**', async route => {
    const chemin = resolve(racine, '.' + decodeURIComponent(new URL(route.request().url()).pathname));
    if (!chemin.startsWith(racine + sep) && chemin !== racine) return route.abort();
    const fichier = chemin === racine ? resolve(racine, 'index.html') : chemin;
    try {
      await route.fulfill({ body: await readFile(fichier), contentType: types[extname(fichier)] ?? 'application/octet-stream' });
    } catch { await route.fulfill({ status: 404, body: '' }); }
  });
});

const instant = new Date('2026-10-26T12:00:00Z');
async function regionSauvee(page: Page) {
  return page.evaluate(() => {
    const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'))!;
    return JSON.parse(localStorage.getItem(cle)!).donnees;
  });
}
async function ouvrirPension(page: Page) {
  await page.getByRole('button', { name: 'Carte', exact: true }).click();
  await page.locator('[data-forme="Bourg Palette"]').first().focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Y aller' }).click();
  await page.clock.runFor(400);
  await page.getByRole('button', { name: 'Pension Pokémon', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'La pension', exact: true })).toBeVisible();
}

for (const largeur of [390, 1440]) {
  test(`Pension : ponte, retrait et rechargement à ${largeur} px`, async ({ page }) => {
    await page.setViewportSize({ width: largeur, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.clock.install({ time: instant });
    await page.clock.pauseAt(instant);
    await page.addInitScript(() => { Math.random = () => 0; });
    await page.goto('/');
    if (await page.getByRole('button', { name: 'JOUER' }).isVisible()) {
      await page.getByRole('button', { name: 'JOUER' }).click();
      await page.clock.runFor(400);
    }
    await page.addInitScript(() => {
      if (sessionStorage.getItem('pension-prepare')) return;
      sessionStorage.setItem('pension-prepare', '1');
      const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'))!;
      const enveloppe = JSON.parse(localStorage.getItem(cle)!);
      const pokemon = (uid: string, sexe: string) => ({ uid, numero: 1, sexe, niveau: 100, xp: 0,
        shiny: false, bonheur: 0, pierreEternelle: false, calcium: 0, favori: false });
      Object.assign(enveloppe.donnees, {
        zoneId: 'kanto.route-1', etape: 1, starterId: 1, argent: 12500,
        drapeaux: [], evenementsJoues: ['kanto.intro'],
        bossVaincus: ['kanto.tour-pokemon'],
        equipe: [{ ...pokemon('actif', 'male'), numero: 6 }], pc: [],
        pension: { parents: [pokemon('mere', 'femelle'), { ...pokemon('pere', 'male'), shiny: true }], oeufs: [], emplacementsOeuf: 2 },
      });
      delete enveloppe.donnees.evenementEnCours;
      enveloppe.revision += 1;
      localStorage.setItem(cle, JSON.stringify(enveloppe));
    });
    await page.reload();
    await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
    const auto = page.getByRole('button', { name: 'Auto-attaque', exact: true });
    if (await auto.getAttribute('aria-pressed') === 'true') await auto.click();
    for (let i = 0; i < 30 && (await regionSauvee(page)).pension.oeufs.length === 0; i++) {
      await page.getByRole('button', { name: /^Attaquer / }).click();
      await page.clock.runFor(100);
    }
    const ponte = (await regionSauvee(page)).pension;
    expect(ponte.oeufs).toHaveLength(1);
    await ouvrirPension(page);
    await expect(page.getByText('4 % par élimination')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Les œufs · 1 / 2' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `design/captures/t-page-pension-${largeur}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Prendre l’œuf' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'L’œuf rejoint ton équipe.' })).toBeVisible();
    await page.getByRole('button', { name: 'Ouvrir · 10 000 pièces' }).click();
    const apres = await regionSauvee(page);
    expect(apres.equipe.find((p: { uid: string }) => p.uid === ponte.oeufs[0].uid).oeuf).toEqual({ pasRestants: 25, pasMax: 25 });
    expect(apres.pension.emplacementsOeuf).toBe(3);
    await page.getByRole('button', { name: 'Sortir de la pension' }).click();
    await expect(page.getByRole('button', { name: 'Pension Pokémon', exact: true })).toBeFocused();
    await page.reload();
    expect((await regionSauvee(page)).pension).toEqual(apres.pension);
    expect((await regionSauvee(page)).equipe).toEqual(apres.equipe);
    await page.getByRole('button', { name: 'Pension Pokémon', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Les œufs · 0 / 3' })).toBeVisible();
  });
}
