const { test, expect } = require('@playwright/test');

for (const largeur of [390, 1440]) for (const variante of ['a-fidele', 'b-honneur', 'c-chen']) {
  test(`${variante} à ${largeur}`, async ({ page }) => {
    await page.setViewportSize({ width: largeur, height: 900 });
    await page.goto(`http://localhost:5174/design/variantes/pantheon/${variante}.html`);
    for (const etat of ['dialogue', 'chute', 'final']) {
      await page.locator(`button[data-etat="${etat}"]`).click();
      await expect(page.locator('body')).toHaveAttribute('data-etat', etat);
      if (etat === 'final') await expect(page.locator('#sortir')).toBeVisible();
      if (etat === 'dialogue') await expect(page.locator('#suite')).toBeEnabled();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (largeur === 1440) expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true);
      await expect(page.locator('.decor')).toHaveAttribute('src', '/img/scenes/pantheon.webp');
      expect(await page.locator('img').evaluateAll(images => images.every(i => i.complete && i.naturalWidth > 0))).toBe(true);
    }
    await page.locator('button[data-etat="dialogue"]').click();
    for (let ligne = 0; ligne < 3; ligne++) {
      if (largeur === 1440) expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true);
      await page.locator('#suite').click();
    }
    await page.locator('#reduit').focus();
    await page.keyboard.press('Space');
    await expect(page.locator('#reduit')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('button[data-etat="chute"]').click();
    expect(await page.locator('.pokemon').evaluateAll(items => items.every(i => getComputedStyle(i).animationName === 'none'))).toBe(true);
    await expect(page.locator('.place.visible')).toHaveCount(6);
    await expect(page.locator('.confetti')).toHaveCount(0);
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
