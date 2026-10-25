const { test, expect } = require('@playwright/test');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

for (const variant of ['a-parents', 'b-nurserie', 'c-gestion']) {
  for (const width of [390, 1440]) {
    test(`${variant} · ${width}`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(pathToFileURL(path.join(__dirname, `${variant}.html`)).href);
      await expect(page.getByRole('heading', { name: 'La pension', exact: true })).toBeVisible();
      await expect(page.locator('.principal:visible')).toHaveCount(1);
      await expect(page.locator('.place')).toHaveCount(5);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await page.locator('img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
      await page.screenshot({ path: `design/captures/pension-${variant}-${width}.png`, fullPage: true });
      await page.getByRole('button', { name: 'Prendre l’œuf' }).focus();
      await page.keyboard.press('Enter');
      await expect(page.getByRole('status')).toContainText('rejoint ton équipe');
      if (variant === 'c-gestion') await page.getByRole('button', { name: 'Parents', exact: true }).click();
      await page.getByRole('button', { name: 'Retirer Bulbizarre' }).first().click();
      await expect(page.getByText('0 % par élimination', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Déposer Bulbizarre' }).click();
      await expect(page.getByText('4 % par élimination', { exact: true })).toBeVisible();
      if (variant === 'c-gestion') await page.getByRole('button', { name: 'Œufs', exact: true }).click();
      await page.getByRole('button', { name: 'Ouvrir · 10 000 pièces' }).click();
      await expect(page.getByRole('status')).toContainText('Emplacement ouvert');
      await expect(page.getByRole('button', { name: 'Ouvrir · 15 000 pièces' })).toBeDisabled();
      await page.reload();
      await expect(page.getByRole('button', { name: 'Prendre l’œuf' })).toBeVisible();
      await page.emulateMedia({ reducedMotion: 'reduce' });
      expect(await page.locator('.coeur').evaluate(node => getComputedStyle(node).animationName)).toBe('none');
      expect(errors).toEqual([]);
    });
  }
}
