import { mkdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { telephone } from './aide-carte';

// Retour du test iPhone du 07/11 : l'ennemi sauvage doit se tenir sur le cercle vert, cercle réduit d'environ 20 %,
// sprite agrandi d'environ 33 % (96 → 128 px), le tout dans le cadre de la scène, nom et barre de PV visibles.
const LARGEURS = [360, 390, 430];
const SOCLE_AVANT = 144; // largeur du cercle avant correction (w-3/4 d'un conteneur de 192 px)

for (const largeur of LARGEURS) {
  test(`scène de combat à ${largeur} px : ennemi sur le cercle, tout dans le cadre`, async ({ page }) => {
    test.skip(!telephone(page), 'Mise en page téléphone');
    await page.setViewportSize({ width: largeur, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
    const scene = page.locator('section[aria-label^="Combat contre"]');
    const sprite = scene.locator('img:not(.eclat-touche)[alt]:not([alt=""])').first();
    await expect(sprite).toBeVisible();
    const m = await page.evaluate(() => {
      const cadre = document.querySelector('section[aria-label^="Combat contre"]')!.getBoundingClientRect();
      const socle = document.querySelector('.socle')!.getBoundingClientRect();
      const image = document.querySelector<HTMLImageElement>('section[aria-label^="Combat contre"] img[alt]:not([alt=""])')!.getBoundingClientRect();
      const panneau = document.querySelector('section[aria-label^="Combat contre"] .cadre.absolute')!.getBoundingClientRect();
      return { cadre, socle, image, panneau };
    });
    // Cercle réduit de 15 à 25 % et entièrement dans la scène.
    expect(m.socle.width).toBeLessThanOrEqual(SOCLE_AVANT * 0.85);
    expect(m.socle.width).toBeGreaterThanOrEqual(SOCLE_AVANT * 0.75);
    expect(m.socle.left).toBeGreaterThanOrEqual(m.cadre.left);
    expect(m.socle.right).toBeLessThanOrEqual(m.cadre.right);
    expect(m.socle.top).toBeGreaterThanOrEqual(m.cadre.top);
    expect(m.socle.bottom).toBeLessThanOrEqual(m.cadre.bottom);
    // Sprite agrandi d'environ un tiers (96 px d'origine) et centré sur le cercle.
    expect(m.image.width / 96).toBeGreaterThanOrEqual(1.3);
    expect(m.image.width / 96).toBeLessThanOrEqual(1.4);
    expect(Math.abs(m.image.left + m.image.width / 2 - (m.socle.left + m.socle.width / 2))).toBeLessThanOrEqual(2);
    // Le sprite et le cercle restent dans la scène à l'horizontale ; les pieds sont à la hauteur du cercle.
    expect(m.image.left).toBeGreaterThanOrEqual(m.cadre.left);
    expect(m.image.right).toBeLessThanOrEqual(m.cadre.right);
    expect(m.image.top).toBeGreaterThanOrEqual(m.cadre.top);
    // Le panneau nom / PV reste entièrement visible dans la scène.
    expect(m.panneau.top).toBeGreaterThanOrEqual(m.cadre.top);
    expect(m.panneau.bottom).toBeLessThanOrEqual(m.cadre.bottom);
    await mkdir('design/captures', { recursive: true });
    await scene.screenshot({ path: `design/captures/scene-combat-${largeur}.png` });
  });
}
