import { mkdir } from 'node:fs/promises';
import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const instant = new Date('2026-10-25T12:00:00Z');
const test = base.extend<{ surveillance: void }>({
  surveillance: [async ({ page }, utiliser) => {
    const erreurs: string[] = [];
    const externes: string[] = [];
    page.on('console', message => { if (message.type() === 'error') erreurs.push(message.text()); });
    page.on('pageerror', erreur => erreurs.push(erreur.message));
    page.on('request', requete => {
      if (new URL(requete.url()).hostname !== 'localhost') externes.push(requete.url());
    });
    await utiliser();
    expect.soft(erreurs, 'Erreurs de console ou de page').toEqual([]);
    expect.soft(externes, 'Requêtes hors de localhost').toEqual([]);
  }, { auto: true }],
});

async function demarrer(page: Page, palier = false) {
  await page.clock.install({ time: instant });
  await page.clock.pauseAt(instant);
  await page.addInitScript(() => { Math.random = () => 0.1; });
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.addInitScript(palier => {
    if (sessionStorage.getItem('progression-prepare')) return;
    sessionStorage.setItem('progression-prepare', '1');
    const cles = Object.keys(localStorage);
    const cle = cles.find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'))!;
    const enveloppe = JSON.parse(localStorage.getItem(cle)!);
    const region = enveloppe.donnees;
    region.equipe = (palier ? [3, 6, 9, 12, 15, 18] : [3, 6, 9, 65, 94, 149]).map(numero => ({
      uid: `progression-${numero}`, numero, niveau: 100, xp: 0, shiny: false,
      bonheur: 0, pierreEternelle: false, calcium: 0, sexe: 'male', favori: false,
    }));
    region.zoneId = palier ? 'kanto.route-1' : 'kanto.arene-d-argenta';
    region.etape = palier ? 1 : 10;
    region.bossVaincus = ['kanto.route-1', 'kanto.foret-de-jade'];
    region.badges = [];
    region.jalonsRecus = [];
    region.argent = 1000;
    enveloppe.revision += 1;
    localStorage.setItem(cle, JSON.stringify(enveloppe));
    if (palier) {
      const clePartie = cles.find(c => c.startsWith('pokiclicker:partie:'))!;
      const partie = JSON.parse(localStorage.getItem(clePartie)!);
      partie.donnees.pokedexNational = Array.from({ length: 20 }, (_, i) => i + 1);
      partie.revision += 1;
      localStorage.setItem(clePartie, JSON.stringify(partie));
    }
  }, palier);
  await page.reload();
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
}

async function regionSauvee(page: Page) {
  return page.evaluate(() => {
    const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'))!;
    return JSON.parse(localStorage.getItem(cle)!).donnees;
  });
}

async function capturer(page: Page, nom: string) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await mkdir('design/captures', { recursive: true });
  await page.evaluate(() => Promise.all([...document.images].map(image => image.decode())));
  await page.screenshot({ path: `design/captures/n-${nom}-${page.viewportSize()!.width}.png` });
}

async function vaincre(page: Page) {
  await expect(page.getByText('Étape 10 sur 10', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Auto-attaque', exact: true }).click();
  await page.getByRole('button', { name: /^Attaquer / }).focus();
  const annonce = page.getByRole('status').filter({ hasText: 'Badge Roche obtenu !' });
  for (let tick = 0; tick < 100 && !await annonce.isVisible(); tick++) {
    await page.clock.runFor(100);
  }
  await expect(annonce).toBeVisible();
}

test('Argenta : annonce, boîte, claque, fermeture et badge conservé', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await demarrer(page);
  await vaincre(page);
  const boite = page.getByRole('dialog', { name: 'Boîte à badges', exact: true });
  const roche = boite.getByRole('button', { name: 'Badge Roche', exact: true });
  await expect(boite).not.toBeVisible();
  await page.clock.runFor(1200);
  await expect(boite).toBeVisible();
  await expect(roche).toHaveCSS('opacity', '0');
  if (page.viewportSize()!.width === 390) await capturer(page, 'obtention');
  await page.clock.runFor(800);
  await expect(roche).toHaveClass(/badge-slam/);
  await page.clock.runFor(1200);
  await expect(roche).not.toHaveClass(/badge-slam/);
  await expect(roche).toHaveCSS('opacity', '1');
  await expect(boite).toBeVisible();
  await boite.getByRole('button', { name: 'Fermer', exact: true }).click();
  await expect(boite).not.toBeVisible();
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeFocused();
  expect((await regionSauvee(page)).badges).toEqual(['roche']);
  await page.reload();
  await page.clock.runFor(3400);
  await expect(boite).not.toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Badge Roche obtenu !' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Plus', exact: true }).click();
  const aventure = page.getByRole('region', { name: 'Ton aventure', exact: true });
  await expect(aventure).toBeVisible();
  await expect(aventure).toContainText('1 / 8');
  await expect(aventure).toContainText('Kanto');
  await expect(aventure).toContainText('DPS');
  await capturer(page, 'plus');
  await page.getByRole('button', { name: 'Badges', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Badges', exact: true })).toBeFocused();
  await expect(page.getByRole('button', { name: 'Badge Roche', exact: true }).last()).toHaveClass(/badge-obtenu/);
  await capturer(page, 'badges');
});

test('20 espèces : 2 500 pièces une seule fois malgré deux rechargements', async ({ page }) => {
  await demarrer(page, true);
  for (let chargement = 0; chargement < 3; chargement++) {
    await expect.poll(async () => (await regionSauvee(page)).argent).toBe(3500);
    expect((await regionSauvee(page)).jalonsRecus).toEqual([10, 20]);
    await page.getByRole('button', { name: 'Plus', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Ton aventure' })).toContainText('20 / 151');
    if (chargement < 2) await page.reload();
  }
});

test('Mouvement réduit : aucun mouvement pendant la remise du badge', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await demarrer(page);
  await vaincre(page);
  for (const delai of [1200, 800, 1200]) {
    await page.clock.runFor(delai);
    await expect(page.getByRole('dialog', { name: 'Boîte à badges' })).toBeVisible();
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  }
});
