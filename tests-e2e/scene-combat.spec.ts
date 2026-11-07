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
    // Retour du 07/11 (2e test) : centre du cercle un peu sous le milieu de la scène, loin du bas du cadre.
    const centreY = (m.socle.top + m.socle.height / 2 - m.cadre.top) / m.cadre.height;
    expect(centreY).toBeGreaterThan(0.5);
    expect(centreY).toBeLessThanOrEqual(0.7);
    expect(m.cadre.bottom - m.socle.bottom).toBeGreaterThanOrEqual(m.cadre.height * 0.25);
    // Retour du 07/11 (3e test) : cercle et sprite décalés à droite, à quelques pixels du cadre sans le toucher.
    expect(m.cadre.right - m.socle.right).toBeGreaterThanOrEqual(4);
    expect(m.cadre.right - m.socle.right).toBeLessThanOrEqual(20);
    expect(m.cadre.right - m.image.right).toBeGreaterThanOrEqual(0);
    expect(m.cadre.right - m.image.right).toBeLessThanOrEqual(12);
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
    // Le chiffre du niveau d'un Pokémon d'équipe ne touche pas le cadre de sa carte (décalé de 4 px).
    const niveau = await page.evaluate(() => {
      const carte = document.querySelector('.cadre[aria-label$=" DPS"]')!;
      const chiffre = [...carte.querySelectorAll('span')].find(s => /^\d+$/.test(s.textContent ?? ''))!;
      return { carte: carte.getBoundingClientRect().left, chiffre: chiffre.getBoundingClientRect().left };
    });
    expect(niveau.chiffre - niveau.carte).toBeGreaterThanOrEqual(5);
    await mkdir('design/captures', { recursive: true });
    await scene.screenshot({ path: `design/captures/scene-combat-${largeur}.png` });
  });

  test(`outils à ${largeur} px : Poké-Radar dans la scène, Fauchage à droite de Capturer, rien ne bouge au déblocage`, async ({ page }) => {
    test.skip(!telephone(page), 'Mise en page téléphone');
    await page.setViewportSize({ width: largeur, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const attaque = page.getByRole('button', { name: 'Attaque auto' });
    await expect(attaque).toBeVisible();
    await expect(page.getByRole('button', { name: 'Poké-Radar' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Fauchage' })).toHaveCount(0);
    const avant = (await attaque.boundingBox())!.y;
    await page.addInitScript(() => {
      const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'));
      if (!cle) return;
      const enveloppe = JSON.parse(localStorage.getItem(cle)!);
      enveloppe.donnees.ameliorations = ['pokeradar', 'falseSwipe'];
      enveloppe.revision += 1;
      localStorage.setItem(cle, JSON.stringify(enveloppe));
    });
    await page.reload();
    const radar = page.getByRole('button', { name: 'Poké-Radar' });
    const fauchage = page.getByRole('button', { name: 'Fauchage' });
    await expect(radar).toBeVisible();
    await expect(fauchage).toBeVisible();
    expect((await attaque.boundingBox())!.y).toBe(avant);
    const m = await page.evaluate(() => {
      const rect = (selecteur: string) => document.querySelector(selecteur)!.getBoundingClientRect();
      return {
        cadre: rect('section[aria-label^="Combat contre"]'), socle: rect('.socle'),
        image: rect('section[aria-label^="Combat contre"] img[alt]:not([alt=""])'),
        radar: rect('button[aria-label="Poké-Radar"]'), fauchage: rect('button[aria-label="Fauchage"]'),
        capturer: [...document.querySelectorAll('section[aria-label="Capture"] button')].find(b => b.textContent === 'Capturer')!.getBoundingClientRect(),
        ancienneLigne: document.querySelector('.actions-debloques') !== null,
      };
    });
    const chevauche = (a: DOMRect, b: DOMRect) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    expect(m.radar.width).toBeGreaterThanOrEqual(48);
    expect(m.radar.height).toBeGreaterThanOrEqual(48);
    expect(m.radar.left).toBeGreaterThanOrEqual(m.cadre.left);
    expect(m.radar.right).toBeLessThanOrEqual(m.cadre.right);
    expect(m.radar.bottom).toBeLessThanOrEqual(m.cadre.bottom);
    expect(chevauche(m.radar, m.socle)).toBe(false);
    expect(chevauche(m.radar, m.image)).toBe(false);
    expect(m.fauchage.width).toBeGreaterThanOrEqual(48);
    expect(m.fauchage.height).toBeGreaterThanOrEqual(48);
    expect(m.fauchage.left).toBeGreaterThanOrEqual(m.capturer.right);
    expect(Math.abs(m.fauchage.top - m.capturer.top)).toBeLessThanOrEqual(4);
    expect(m.capturer.width).toBeGreaterThanOrEqual(96);
    expect(m.ancienneLigne).toBe(false);
    await mkdir('design/captures', { recursive: true });
    await page.locator('section[aria-label^="Combat contre"]').screenshot({ path: `design/captures/scene-outils-${largeur}.png` });
    await page.screenshot({ path: `design/captures/combat-outils-${largeur}.png` });
  });
}
