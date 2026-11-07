import { mkdir } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import { telephone, voyagerVers } from './aide-carte';

// Ticket R : chez maman, chez Blue et le labo remplissent la largeur de l'écran de jeu, sans bord de couleur autour.
for (const largeur of [360, 390, 430]) {
  test(`Lieux de départ pleine largeur à ${largeur} px`, async ({ page }) => {
    await page.setViewportSize({ width: largeur, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.clock.install();
    await page.clock.pauseAt(new Date());
    await page.goto('/');
    test.skip(!telephone(page), 'Téléphone seulement');
    await page.getByRole('button', { name: 'Carte', exact: true }).click();
    await voyagerVers(page, 'Bourg Palette');
    await page.clock.runFor(400);
    await mkdir('design/captures', { recursive: true });
    const jeu = page.locator('.combat-grille');
    for (const [bouton, nom, slug] of [
      ['Chez Maman', 'Chez Maman', 'chez-maman'],
      ['Chez Blue', 'Chez Blue', 'chez-blue'],
      ['Labo Pokémon du Prof. Chen', 'Labo Pokémon du Prof. Chen', 'labo'],
    ] as const) {
      await page.getByRole('button', { name: bouton, exact: true }).focus();
      await page.keyboard.press('Enter');
      await page.clock.runFor(1500);
      const scene = page.getByRole('region', { name: nom, exact: true });
      await expect(scene).toBeVisible();
      await page.evaluate(() => Promise.all([...document.images].map(image => image.decode())));
      const zone = (await jeu.boundingBox())!;
      const image = (await scene.locator('img').boundingBox())!;
      const cadre = (await scene.locator('> div').boundingBox())!;
      // Le cadre de l'image a la largeur de l'écran de jeu : aucun bord autour.
      expect(Math.abs(cadre.x - zone.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(cadre.width - zone.width)).toBeLessThanOrEqual(1);
      // Le cadre est plus petit que l'image entière : la partie vide est rognée, l'image n'est pas étirée.
      expect(image.width).toBeGreaterThanOrEqual(cadre.width - 1);
      expect(image.height).toBeGreaterThanOrEqual(cadre.height - 1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      const sortie = (await scene.getByRole('button', { name: 'Sortie', exact: true }).boundingBox())!;
      expect(sortie.width).toBeGreaterThanOrEqual(44);
      expect(sortie.height).toBeGreaterThanOrEqual(44);
      expect(sortie.x).toBeGreaterThanOrEqual(zone.x - 1);
      expect(sortie.x + sortie.width).toBeLessThanOrEqual(zone.x + zone.width + 1);
      await page.screenshot({ path: `design/captures/lieu-${slug}-${largeur}.png`, fullPage: true });
      await scene.getByRole('button', { name: 'Sortie', exact: true }).click();
      await page.clock.runFor(1500);
      await expect(page.getByRole('region', { name: 'Bourg Palette', exact: true })).toBeVisible();
    }
  });
}
