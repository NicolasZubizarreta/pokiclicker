import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

for (const fichier of ['a-cartes', 'b-lignes', 'c-decor']) {
  for (const largeur of [390, 1440]) {
    test(`${fichier} à ${largeur}px : catalogue, clavier, achat et capture`, async ({ page }) => {
      const erreurs: string[] = [];
      page.on('pageerror', erreur => erreurs.push(erreur.message));
      page.on('console', message => { if (message.type() === 'error') erreurs.push(message.text()); });
      await page.setViewportSize({ width: largeur, height: 900 });
      await page.goto(pathToFileURL(resolve(`design/variantes/centre/${fichier}.html`)).href);
      await expect(page.locator('[data-objet]')).toHaveCount(11);
      await expect(page.locator('.principal')).toHaveCount(1);
      await expect(page.locator('#acheter')).toContainText('8 625');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await page.locator('img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
      await page.locator('[data-objet="xSpecial"]').focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('#choix')).toHaveText('Attaque Spé +');
      await page.locator('[data-objet="xAttack"]').focus();
      await page.keyboard.press('Space');
      await page.locator('#quantite').fill('2');
      await page.locator('#acheter').click();
      await expect(page.locator('[data-objet="xAttack"] .stock')).toHaveText('×2');
      await expect(page.locator('#argent')).toContainText('32 750');
      await page.locator('[data-objet="shinyToken"]').click();
      await expect(page.locator('#acheter')).toBeDisabled();
      await expect(page.locator('#raison')).toContainText("Pas assez d'argent");
      await page.reload();
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `design/captures/u-${fichier}-${largeur}.png`, fullPage: true });
      expect(erreurs).toEqual([]);
      if (fichier === 'c-decor' && largeur === 390) {
        expect(await page.locator('.retour').evaluate(element => getComputedStyle(element).position)).toBe('fixed');
      }
      await page.getByRole('link', { name: 'B · Lignes', exact: true }).click();
      await expect(page).toHaveURL(/b-lignes.html$/);
      await page.getByRole('link', { name: 'Retour à la carte', exact: true }).click();
      await expect(page).toHaveURL(/carte\/a-plein-cadre.html$/);
    });
  }
}
