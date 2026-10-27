import { mkdir } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

test('Chez Maman : la télé cachée joue la vidéo sur un clic, l’éteint au second', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await page.goto('/');
  await page.getByRole('button', { name: 'Carte', exact: true }).click();
  await page.getByRole('button', { name: 'Bourg Palette', exact: true }).click();
  await page.getByRole('button', { name: 'Y aller' }).click();
  await page.clock.runFor(400);
  await page.getByRole('button', { name: 'Chez Maman', exact: true }).focus();
  await page.keyboard.press('Enter');
  const video = page.locator('video');
  const etat = () => video.evaluate((v: HTMLVideoElement) => ({ cachee: v.hidden, enPause: v.paused, muette: v.muted }));
  expect(await etat()).toEqual({ cachee: true, enPause: true, muette: true });
  const tele = page.getByRole('button', { name: 'Télé' });
  const cible = (await tele.boundingBox())!;
  expect(cible.width).toBeGreaterThanOrEqual(44);
  expect(cible.height).toBeGreaterThanOrEqual(44);
  await tele.click();
  await expect.poll(etat).toEqual({ cachee: false, enPause: false, muette: true });
  await tele.click();
  expect(await etat()).toEqual({ cachee: true, enPause: true, muette: true });
});

for (const largeur of [390, 1440]) {
  test(`Bourg Palette : visites sans défilement à ${largeur} px`, async ({ page }) => {
    await page.setViewportSize({ width: largeur, height: largeur === 390 ? 844 : 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.clock.install();
    await page.clock.pauseAt(new Date());
    await page.goto('/');
    await page.getByRole('button', { name: 'Carte', exact: true }).click();
    await page.getByRole('button', { name: 'Bourg Palette', exact: true }).click();
    await page.getByRole('button', { name: 'Y aller' }).click();
    await page.clock.runFor(400);
    await expect(page.getByRole('img', { name: 'Bourg Palette' })).toBeVisible();
    await mkdir('design/captures', { recursive: true });

    async function capturer(nom: string) {
      await page.evaluate(() => Promise.all([...document.images].map(image => image.decode())));
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      expect(await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)).toBeLessThanOrEqual(1);
      const chen = page.getByRole('complementary', { name: 'Dialogue', exact: true })
        .filter({ has: page.getByRole('heading', { name: 'Prof. Chen', exact: true }) });
      await expect(chen).toBeVisible();
      const boite = (await chen.boundingBox())!;
      const limite = largeur === 390 ? (await page.getByRole('navigation').boundingBox())!.y : 900;
      expect(boite.y + boite.height).toBeLessThanOrEqual(limite);
      await expect(page.getByRole('status')).toHaveCount(1);
      expect(await page.locator('button.bg-action:visible').count()).toBeLessThanOrEqual(1);
      for (const bouton of await page.getByRole('region', { name: nom, exact: true }).getByRole('button').all()) {
        const cible = (await bouton.boundingBox())!;
        expect(cible.width).toBeGreaterThanOrEqual(44);
        expect(cible.height).toBeGreaterThanOrEqual(44);
      }
      await page.screenshot({ path: `design/captures/p1-${nom === 'Bourg Palette' ? 'bourg-palette' : nom === 'Chez Maman' ? 'chez-maman' : nom === 'Chez Blue' ? 'chez-blue' : 'labo'}-${largeur}.png`, fullPage: true });
    }

    await capturer('Bourg Palette');
    await page.getByRole('button', { name: 'Pension Pokémon' }).focus();
    await expect(page.getByRole('status')).toContainText('Tour Pokémon');
    await expect(page.getByRole('button', { name: 'Pension Pokémon' })).toHaveAttribute('aria-disabled', 'true');
    await expect(page.getByRole('button', { name: 'Bateau en direction de Johto' })).toHaveAttribute('aria-disabled', 'true');
    for (const nom of ['Chez Maman', 'Chez Blue', 'Labo Pokémon du Prof. Chen']) {
      await page.getByRole('button', { name: nom, exact: true }).focus();
      await page.keyboard.press('Enter');
      if (nom === 'Chez Maman') await expect(page.getByText("Il n'y a rien à faire ici, sortons.")).toBeVisible();
      if (nom === 'Chez Blue') await expect(page.getByText('Eh pourquoi il a le droit à une maison en 3D lui ?')).toBeVisible();
      await capturer(nom);
      await page.getByRole('button', { name: 'Sortie', exact: true }).press('Enter');
      await expect(page.getByRole('img', { name: 'Bourg Palette' })).toBeVisible();
    }
  });
}
