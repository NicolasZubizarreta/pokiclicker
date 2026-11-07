import { mkdir } from 'node:fs/promises';
import { test, expect, type Locator, type Page } from '@playwright/test';
import { telephone } from './aide-carte';

test.use({ storageState: { cookies: [], origins: [] } });

const chen = (page: Page) => page.getByRole('button', { name: /^Prof\. Chen : / });

type Boite = { x: number; y: number; width: number; height: number };
const boite = async (cible: Locator) => (await cible.boundingBox()) as Boite;
const sechevauchent = (a: Boite, b: Boite) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

// PC : rien ne change, le dialogue reste dans la scène du labo (pas d'ancrage à la fenêtre).
test('PC : le dialogue de Chen reste dans la scène du labo à 1440 px', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  test.skip(telephone(page), 'PC seulement');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'JOUER' }).click();
  await page.getByRole('button', { name: 'Sortie', exact: true }).click();
  await page.getByRole('button', { name: 'Labo Pokémon du Prof. Chen', exact: true }).click();
  await expect(chen(page)).toContainText('Salutations');
  const scene = await boite(page.getByRole('region', { name: 'Labo Pokémon du Prof. Chen', exact: true }));
  const dialogue = await boite(chen(page));
  expect(dialogue.y).toBeGreaterThanOrEqual(scene.y);
  expect(dialogue.y + dialogue.height).toBeLessThanOrEqual(scene.y + scene.height + 1);
  await page.screenshot({ path: 'design/captures/intro-dialogue-1440.png' });
});

// Ticket R : le dialogue du Prof. Chen et le choix du starter sont ancrés juste au-dessus de la barre des cinq boutons.
for (const largeur of [360, 390, 430]) {
  test(`Dialogue de Chen et choix du starter au-dessus de la navigation à ${largeur} px`, async ({ page }) => {
    await page.setViewportSize({ width: largeur, height: 844 });
    test.skip(!telephone(page), 'Téléphone seulement');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.getByRole('button', { name: 'JOUER' }).click();
    await page.getByRole('button', { name: 'Sortie', exact: true }).click();
    await page.getByRole('button', { name: 'Labo Pokémon du Prof. Chen', exact: true }).click();
    await expect(chen(page)).toContainText('Salutations');
    await mkdir('design/captures', { recursive: true });
    const nav = await boite(page.getByRole('navigation', { name: 'Navigation principale' }));
    const sprite = page.locator('img[src*="sprites/chen"]');

    async function verifier(zone: Locator, nom: string) {
      await page.evaluate(() => Promise.all([...document.images].map(image => image.decode())));
      const b = await boite(zone);
      // Juste au-dessus de la barre des cinq boutons : jamais dessous, jamais loin.
      expect(b.y + b.height).toBeLessThanOrEqual(nav.y + 1);
      expect(nav.y - (b.y + b.height)).toBeLessThanOrEqual(16);
      // Le sprite du prof reste entier et dégagé.
      expect(sechevauchent(b, await boite(sprite))).toBe(false);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      await page.screenshot({ path: `design/captures/intro-${nom}-${largeur}.png` });
    }

    await verifier(chen(page), 'dialogue');
    for (let ligne = 0; ligne < 3; ligne++) await chen(page).click();
    await expect(chen(page)).toContainText('Pour les apprivoiser');
    await verifier(chen(page), 'dialogue-suite');
    for (let ligne = 0; ligne < 3; ligne++) await chen(page).click();
    await expect(chen(page)).toContainText('Choisis-en un');
    await chen(page).click();

    const choix = page.getByRole('region', { name: 'CHOISIS TON PARTENAIRE' });
    await expect(choix).toBeVisible();
    await page.getByRole('button', { name: /^Salamèche/ }).click();
    await verifier(choix, 'choix');
    await expect(page.getByRole('button', { name: 'CHOISIR SALAMÈCHE' })).toBeVisible();
    // Titre, boules et bouton « Choisir » : tout est dans l'écran, au-dessus de la barre.
    for (const element of [page.getByRole('heading', { name: 'CHOISIS TON PARTENAIRE' }), page.getByRole('button', { name: 'CHOISIR SALAMÈCHE' })]) {
      const b = await boite(element);
      expect(b.y + b.height).toBeLessThanOrEqual(nav.y + 1);
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width).toBeLessThanOrEqual(largeur);
    }
  });
}
