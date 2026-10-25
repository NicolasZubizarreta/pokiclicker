import { mkdir } from 'node:fs/promises';
import { test, expect, type Page } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

const chen = (page: Page) => page.getByRole('button', { name: /^Prof\. Chen : / });

async function capturer(page: Page, nom: string, largeur: number) {
  await mkdir('design/captures', { recursive: true });
  await page.evaluate(() => Promise.all([...document.images].map(image => image.decode())));
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  await page.screenshot({ path: `design/captures/p2-intro-${nom}-${largeur}.png`, fullPage: true });
}

for (const largeur of [390, 1440]) {
  test(`Intro de Chen : du titre au premier combat à ${largeur} px`, async ({ page }) => {
    await page.setViewportSize({ width: largeur, height: largeur === 390 ? 844 : 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'POKÉ CLICKER' })).toBeVisible();
    await capturer(page, 'titre', largeur);
    await page.getByRole('button', { name: 'JOUER' }).click();
    await expect(page.getByRole('region', { name: 'Chez Maman' })).toBeVisible();
    await page.getByRole('button', { name: 'Sortie', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Bourg Palette' })).toBeVisible();
    await capturer(page, 'bourg-palette', largeur);
    await page.getByRole('button', { name: 'Labo Pokémon du Prof. Chen', exact: true }).click();
    await expect(chen(page)).toContainText('Salutations');
    await capturer(page, 'dialogue', largeur);

    for (let ligne = 0; ligne < 3; ligne++) await chen(page).click();
    await expect(chen(page)).toContainText('Pour les apprivoiser');
    await expect(page.getByText('+5 POKÉBALLS !')).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'POKÉ CLICKER' })).toHaveCount(0);
    await expect(chen(page)).toContainText('Pour les apprivoiser');
    for (let ligne = 0; ligne < 3; ligne++) await chen(page).click();
    await expect(chen(page)).toContainText('Choisis-en un');
    await chen(page).click();
    await expect(page.getByRole('heading', { name: 'CHOISIS TON PARTENAIRE' })).toBeVisible();
    await page.getByRole('button', { name: /^Carapuce/ }).click();
    await capturer(page, 'choix', largeur);
    await page.getByRole('button', { name: 'CHOISIR CARAPUCE' }).click();
    await expect(page.getByRole('heading', { name: 'CHOISIS TON PARTENAIRE' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Sortie', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Bourg Palette' })).toBeVisible();
    await page.getByRole('button', { name: 'Équipe', exact: true }).click();
    await expect(page.getByRole('button', { name: /^Carapuce, niveau 5/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /niveau/ })).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Pokéball ×5', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Combat', exact: true }).click();
    await page.getByRole('button', { name: 'Zone suivante : Route 1' }).click();
    await expect(page.getByRole('heading', { name: 'Route 1', exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: /^Combat contre/ })).toBeVisible();
  });
}
