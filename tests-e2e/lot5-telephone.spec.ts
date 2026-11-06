import { mkdir } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

const largeurs = [360, 390, 430];

test.describe('lot 5 : Shop, Pokédex, Badges téléphone', () => {
  test.beforeEach(async ({}, info) => {
    test.skip(info.project.name !== 'mobile', 'Pages téléphone.');
  });

  for (const largeur of largeurs) {
    test(`Pokédex et Badges à ${largeur} px`, async ({ page }) => {
      await page.setViewportSize({ width: largeur, height: 844 });
      await mkdir('design/captures', { recursive: true });
      await page.goto('/');
      await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
      await page.getByRole('button', { name: 'Menu', exact: true }).click();

      await page.getByRole('button', { name: /^Pokédex/ }).click();
      await expect(page.getByRole('heading', { level: 1, name: 'Pokédex' })).toBeFocused();
      await expect(page.getByRole('progressbar', { name: 'Espèces capturées' })).toBeVisible();
      await page.getByRole('button', { name: 'Capturées', exact: true }).click();
      await expect(page.getByRole('button', { name: /déjà capturé/ }).first()).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await page.screenshot({ path: `design/captures/lot5-pokedex-${largeur}.png` });
      await page.getByRole('button', { name: /déjà capturé/ }).first().click();
      const fiche = page.getByRole('dialog');
      await expect(fiche).toContainText('Déjà capturé');
      await page.screenshot({ path: `design/captures/lot5-pokedex-fiche-${largeur}.png` });
      await page.getByRole('button', { name: 'Fermer la fiche du Pokédex' }).click();
      await expect(fiche).toHaveCount(0);
      await page.getByRole('button', { name: 'Retour au menu' }).click();
      await expect(page.locator('[data-entree="pokedex"]')).toBeFocused();

      await page.getByRole('button', { name: /^Badges/ }).click();
      await expect(page.getByRole('heading', { level: 1, name: 'Badges' })).toBeFocused();
      await expect(page.getByRole('button', { name: /^Badge / })).toHaveCount(8);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await page.screenshot({ path: `design/captures/lot5-badges-${largeur}.png` });
      await page.getByRole('button', { name: /^Badge / }).first().click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.screenshot({ path: `design/captures/lot5-badge-detail-${largeur}.png` });
      await page.getByRole('button', { name: 'Fermer le badge' }).click();
      await page.getByRole('button', { name: 'Retour au menu' }).click();
      await expect(page.locator('[data-entree="badges"]')).toBeFocused();
    });
  }

  for (const largeur of largeurs) {
    test(`Shop en trois catégories à ${largeur} px`, async ({ page }) => {
      await page.setViewportSize({ width: largeur, height: 844 });
      await mkdir('design/captures', { recursive: true });
      await page.goto('/');
      await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
      await page.addInitScript(() => {
        const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'));
        if (!cle || sessionStorage.getItem('lot5-prepare')) return;
        sessionStorage.setItem('lot5-prepare', '1');
        const enveloppe = JSON.parse(localStorage.getItem(cle)!);
        enveloppe.donnees.argent = 100000;
        enveloppe.donnees.bossVaincus = ['kanto.route-1', 'kanto.foret-de-jade', 'kanto.cave-taupiqueur', 'kanto.mont-selenite'];
        enveloppe.revision += 1;
        localStorage.setItem(cle, JSON.stringify(enveloppe));
      });
      await page.reload();
      await page.getByRole('button', { name: 'Shop', exact: true }).click();
      for (const nom of ['Poké Ball', 'Objets', 'Accessoires']) {
        await page.getByRole('button', { name: nom, exact: true }).click();
        await expect(page.getByRole('button', { name: nom, exact: true })).toHaveAttribute('aria-pressed', 'true');
        await expect(page.getByRole('button', { name: 'Soin', exact: true })).toHaveCount(0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        await page.screenshot({ path: `design/captures/lot5-shop-${nom.replace(/\W/g, '').toLowerCase()}-${largeur}.png` });
      }
    });
  }
});
