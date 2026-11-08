import { mkdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { telephone } from './aide-carte';
import { rayon } from './aide-shop';

// Retour du test iPhone du 07/11 (4e test) : toutes les notifications sont des pop-up en haut de l'écran, hors de la
// mise en page. Rien ne bouge quand une notification apparaît, rien ne sort de l'écran (Shop compris).
const LARGEURS = [360, 390, 430, 1024, 1440];
const NOTIFICATION = '[data-notifications] div[aria-live]:not([data-annonce-deblocage]) p';

async function demarrer(page: Page, largeur: number) {
  await page.setViewportSize({ width: largeur, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.addInitScript(() => {
    const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'));
    if (!cle || sessionStorage.getItem('notifications-prepare')) return;
    sessionStorage.setItem('notifications-prepare', '1');
    const enveloppe = JSON.parse(localStorage.getItem(cle)!);
    enveloppe.donnees.argent = 10_000_000;
    enveloppe.donnees.bossVaincus = ['kanto.route-1', 'kanto.foret-de-jade'];
    enveloppe.revision += 1;
    localStorage.setItem(cle, JSON.stringify(enveloppe));
  });
  await page.reload();
  await page.getByRole('button', { name: 'Shop', exact: true }).click();
  await expect(rayon(page, 'Poké Ball')).toBeVisible();
}

const sansDefilementHorizontal = (page: Page) =>
  page.evaluate(() => ({ defile: document.documentElement.scrollWidth, largeur: document.documentElement.clientWidth }));

for (const largeur of LARGEURS) {
  test(`Shop à ${largeur} px : un achat n'agrandit pas la carte et la notification reste dans l'écran`, async ({ page }) => {
    await demarrer(page, largeur);
    const carte = page.getByRole('article').first();
    await expect(carte).toBeVisible();
    const mesures = () => page.evaluate(() => {
      const rect = (e: Element | null) => { const r = e!.getBoundingClientRect(); return { x: r.x, y: r.y, l: r.width, h: r.height }; };
      return { titre: rect(document.querySelector('h1')), carte: rect(document.querySelector('article')),
        filtre: rect(document.querySelector('[aria-pressed], [role="tab"]')), cartes: document.querySelectorAll('article').length };
    });
    const avant = await mesures();
    await carte.getByRole('button', { name: /^Acheter/ }).click();
    const notification = page.locator(NOTIFICATION).first();
    await expect(notification).toBeVisible();
    const pendant = await mesures();
    expect(pendant).toEqual(avant);
    // La notification est entière dans l'écran : jamais plus large que lui, collée au haut sous la zone sûre.
    const boite = (await notification.boundingBox())!;
    expect(boite.x).toBeGreaterThanOrEqual(0);
    expect(boite.x + boite.width).toBeLessThanOrEqual(largeur);
    expect(boite.y).toBeGreaterThanOrEqual(0);
    if (largeur < 1024) expect(boite.y).toBeLessThan(100);
    else {
      expect(boite.x + boite.width).toBeGreaterThan(largeur - 32);
      expect(boite.y + boite.height).toBeGreaterThan((page.viewportSize()?.height ?? 0) - 32);
    }
    const d = await sansDefilementHorizontal(page);
    expect(d.defile).toBeLessThanOrEqual(d.largeur);
    await mkdir('design/captures', { recursive: true });
    await page.screenshot({ path: `design/captures/notification-shop-${largeur}.png`, animations: 'disabled' });
    await expect(page.locator(NOTIFICATION)).toHaveCount(0);
    expect(await mesures()).toEqual(avant);
  });

  test(`aucun défilement horizontal à ${largeur} px : Shop, Équipe, Menu, Statistiques`, async ({ page }) => {
    test.skip(!telephone(page), 'Mise en page téléphone');
    await demarrer(page, largeur);
    const verifier = async (nom: string) => {
      const d = await sansDefilementHorizontal(page);
      expect(d.defile, `${nom} : scrollWidth ≤ clientWidth`).toBeLessThanOrEqual(d.largeur);
    };
    for (const categorie of ['Poké Ball', 'Objets', 'Accessoires']) {
      await rayon(page, categorie).click();
      await verifier(`Shop ${categorie}`);
    }
    await page.getByRole('button', { name: 'Équipe', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Ton équipe' })).toBeVisible();
    await verifier('Équipe');
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await verifier('Menu');
    await page.getByRole('button', { name: /^Statistiques/ }).click();
    await verifier('Statistiques');
  });

  test(`une notification ne décale ni l'Équipe ni les Statistiques à ${largeur} px`, async ({ page }) => {
    test.skip(!telephone(page), 'Mise en page téléphone');
    await demarrer(page, largeur);
    const achat = async () => {
      await page.getByRole('button', { name: 'Shop', exact: true }).click();
      await page.getByRole('article').first().getByRole('button', { name: /^Acheter/ }).click();
    };
    const mesurer = (selecteur: string) => page.evaluate(selecteur => ({
      present: document.querySelectorAll('[data-notifications] div[aria-live]:not([data-annonce-deblocage]) p').length > 0,
      rect: (() => { const r = document.querySelector(selecteur)!.getBoundingClientRect(); return { x: r.x, y: r.y, l: r.width, h: r.height }; })(),
    }), selecteur);
    for (const [bouton, titre, selecteur] of [['Équipe', 'Ton équipe', 'h1'], ['Menu', 'Menu', 'main']] as const) {
      await achat();
      await page.getByRole('button', { name: bouton, exact: true }).click();
      if (bouton === 'Menu') await page.getByRole('button', { name: /^Statistiques/ }).click();
      const pendant = await mesurer(bouton === 'Menu' ? 'h1' : selecteur);
      expect(pendant.present, `${titre} : la notification doit encore être affichée pendant la mesure`).toBe(true);
      await expect(page.locator(NOTIFICATION)).toHaveCount(0);
      const apres = await mesurer(bouton === 'Menu' ? 'h1' : selecteur);
      expect(apres.rect).toEqual(pendant.rect);
    }
  });
}
