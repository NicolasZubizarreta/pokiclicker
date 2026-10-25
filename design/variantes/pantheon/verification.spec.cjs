const { test, expect } = require('@playwright/test');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

for (const largeur of [390, 1440]) for (const variante of ['a-fidele', 'b-honneur', 'c-chen']) {
  test(`${variante} à ${largeur}`, async ({ page }) => {
    await page.setViewportSize({ width: largeur, height: 900 });
    await page.goto(pathToFileURL(path.join(__dirname, `${variante}.html`)).href);
    for (const etat of ['dialogue', 'chute', 'final']) {
      await page.locator(`button[data-etat="${etat}"]`).click();
      await expect(page.locator('body')).toHaveAttribute('data-etat', etat);
      await expect(page.locator('.action:visible')).toHaveCount(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
      expect(await page.locator('img').evaluateAll(images => images.every(i => i.complete && i.naturalWidth > 0))).toBe(true);
      await page.screenshot({ path: `design/captures/r-${variante}-${etat}-${largeur}.png` });
    }
    await page.locator('button[data-etat="dialogue"]').click();
    for (let ligne = 0; ligne < 3; ligne++) {
      expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true);
      await page.locator('#suite').click();
    }
    await page.locator('#reduit').focus();
    await page.keyboard.press('Space');
    await expect(page.locator('#reduit')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('button[data-etat="chute"]').click();
    expect(await page.locator('.pokemon').evaluateAll(items => items.every(i => getComputedStyle(i).animationName === 'none'))).toBe(true);
    expect(await page.locator('.pokemon img').evaluateAll(items => items.every(i => getComputedStyle(i).animationName === 'none'))).toBe(true);
    await page.locator('#sortir').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[role="status"]')).toContainText('Bourg Palette');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    await expect(page.locator('#reduit')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('.variantes a').last().focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/c-chen.html/);
  });
}
