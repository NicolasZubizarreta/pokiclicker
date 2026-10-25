import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const series = { diplome: ['a-fenetre', 'b-kanto', 'c-impression'], credits: ['a-noir', 'b-labo', 'c-pages'] };
for (const [serie, variantes] of Object.entries(series)) {
  for (const variante of variantes) for (const largeur of [390, 1440]) {
    test(`${serie} ${variante} ${largeur}`, async ({ page }) => {
      const erreurs: string[] = [];
      page.on('pageerror', e => erreurs.push(e.message));
      await page.setViewportSize({ width: largeur, height: 900 });
      await page.goto(pathToFileURL(resolve(`design/variantes/${serie}/${variante}.html`)).href);
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('.action:visible')).toHaveCount(1);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await page.locator('img').evaluateAll(images => (images as HTMLImageElement[]).every(i => i.complete && i.naturalWidth > 0))).toBe(true);
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
      await mkdir('design/captures', { recursive: true });
      await page.screenshot({ path: `design/captures/x-${serie}-${variante}-${largeur}.png`, fullPage: true });
      await page.getByRole('link', { name: 'C ·', exact: false }).click();
      await expect(page.locator('body')).toHaveAttribute('data-variante', 'c');
      if (serie === 'credits') {
        await expect(page.getByText('Mouvement réduit', { exact: true })).toBeVisible();
        await page.getByRole('button', { name: 'Suivant' }).focus();
        await page.keyboard.press('Enter');
        await expect(page.getByRole('heading', { name: 'CRÉATION & RÉALISATION ;' })).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(page.getByRole('heading', { name: 'Retour à Kanto' })).toBeVisible();
      } else {
        await page.emulateMedia({ media: 'print' });
        await expect(page.locator('.feuille')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Imprimer' })).toBeHidden();
      }
      expect(erreurs).toEqual([]);
    });
  }
}

test('Le réglage système réduit aussi les crédits A', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(pathToFileURL(resolve('design/variantes/credits/a-noir.html')).href);
  await expect(page.getByRole('button', { name: 'Suivant' })).toBeVisible();
  expect(await page.locator('.flottants').count()).toBe(0);
});
