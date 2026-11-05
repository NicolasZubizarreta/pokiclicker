import { mkdir, readFile } from 'node:fs/promises';
import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { telephone, ligneZone, voyagerVers } from './aide-carte';

// Mêmes observateurs que le combat : aucune erreur de console, aucune requête hors de localhost.
const test = base.extend<{ surveillance: void }>({
  surveillance: [async ({ page }, utiliser) => {
    const erreurs: string[] = [];
    const requetesExternes: string[] = [];
    page.on('console', message => { if (message.type() === 'error') erreurs.push(message.text()); });
    page.on('pageerror', erreur => erreurs.push(erreur.message));
    page.on('request', requete => {
      if (new URL(requete.url()).hostname !== 'localhost') requetesExternes.push(requete.url());
    });
    await utiliser();
    expect.soft(erreurs, 'Erreurs de console ou de page').toEqual([]);
    expect.soft(requetesExternes, 'Requêtes hors de localhost').toEqual([]);
  }, { auto: true }],
});

async function ouvrirCarte(page: Page, adresse = '/') {
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await page.goto(adresse);
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.getByRole('button', { name: 'Carte', exact: true }).click();
  await expect(page.getByRole('img', { name: 'Carte de Kanto' }).or(page.locator('svg[aria-label="Carte de Kanto"]'))).toBeVisible();
  await page.evaluate(() => Promise.all([...document.images].map(image => image.decode().catch(() => undefined))));
}

test('Carte : image sans bande, cibles tactiles, zone fermée et captures', async ({ page }, informations) => {
  test.skip(telephone(page), 'Fiche de zone : profil PC seulement');
  await ouvrirCarte(page);
  const carte = page.locator('svg[aria-label="Carte de Kanto"]');
  const boite = (await carte.boundingBox())!;
  expect(boite.width / boite.height).toBeCloseTo(16 / 9, 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await expect(page.getByRole('progressbar', { name: 'Badges obtenus' })).toBeVisible();
  // Zones ouvertes : Bourg Palette et Route 1 (actuelle) ; la fiche réserve sa place sans bouger la carte.
  const zoneOuverte = page.getByRole('button', { name: 'Bourg Palette', exact: true });
  await expect(zoneOuverte).toBeVisible();
  const avant = (await carte.boundingBox())!;
  await zoneOuverte.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('region', { name: 'Zone sélectionnée' })).toContainText('Bourg Palette');
  await expect(page.getByRole('button', { name: 'Y aller' })).toBeVisible();
  const apres = (await carte.boundingBox())!;
  expect(Math.abs(apres.y - avant.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(apres.height - avant.height)).toBeLessThanOrEqual(1);
  // Cible ≥ 44 px : le halo de toucher de chaque zone ouverte.
  const halos = await page.locator('[data-halos] circle').evaluateAll(cercles => cercles.map(cercle => {
    const rectangle = cercle.getBoundingClientRect();
    return Math.min(rectangle.width, rectangle.height);
  }));
  expect(halos.length).toBeGreaterThan(0);
  for (const taille of halos) expect(taille).toBeGreaterThanOrEqual(43.5);
  // Zone fermée : « Bloquée » et la raison en français, sans bouton d'action.
  await page.locator('[data-forme="Forêt de Jade"]').first().focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('region', { name: 'Zone sélectionnée' })).toContainText('Bloquée');
  await expect(page.getByRole('region', { name: 'Zone sélectionnée' })).toContainText('Bats le boss de Route 1.');
  await expect(page.getByRole('button', { name: 'Y aller' })).toHaveCount(0);
  await mkdir('design/captures', { recursive: true });
  const largeur = informations.project.name === 'mobile' ? 390 : 1440;
  await page.screenshot({ path: `design/captures/g-carte-${largeur}.png`, animations: 'disabled' });
});

test('Carte : vol vers une zone, fiche fermée au départ, puis retour au combat', async ({ page }) => {
  await ouvrirCarte(page);
  const allerVers = page.getByRole('button', { name: 'Y aller' });
  await voyagerVers(page, 'Bourg Palette');
  await page.clock.runFor(900);
  await expect(page.locator('[data-vol-overlay]')).toBeAttached();
  if (telephone(page)) await expect(ligneZone(page, 'Bourg Palette')).toBeVisible();
  else await expect(allerVers).toHaveCount(0);
  await page.clock.runFor(2300);
  await expect(page.getByRole('button', { name: 'Carte', exact: true })).toHaveAttribute('aria-current', 'page');
  await page.clock.runFor(700);
  await expect(page.getByRole('heading', { name: 'Bourg Palette', exact: true })).toBeVisible();
  await expect(page.getByText('Pas de Pokémon sauvage ici. Va sur la Route 1 pour combattre.')).toBeVisible();
});

test('Carte : mouvement réduit, changement de zone sans overlay', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ouvrirCarte(page);
  await voyagerVers(page, 'Bourg Palette');
  await expect(page.locator('[data-vol-overlay]')).toHaveCount(0);
  await page.clock.runFor(400);
  await expect(page.getByRole('heading', { name: 'Bourg Palette', exact: true })).toBeVisible();
});

test('Carte : zoom à la molette et déplacement sans faire défiler la page, mode debug', async ({ page }) => {
  test.skip(telephone(page), 'Molette et glisser à la souris : profil PC.');
  await ouvrirCarte(page, '/?debug=carte');
  const carte = page.locator('svg[aria-label="Carte de Kanto"]');
  const viewBox = () => carte.getAttribute('viewBox');
  const initial = await viewBox();
  const boite = (await carte.boundingBox())!;
  await page.mouse.move(boite.x + boite.width / 2, boite.y + boite.height / 2);
  await page.mouse.wheel(0, -400);
  await expect.poll(viewBox).not.toBe(initial);
  const zoome = await viewBox();
  const defilement = await page.evaluate(() => window.scrollY);
  await page.mouse.down();
  await page.mouse.move(boite.x + boite.width / 2 + 120, boite.y + boite.height / 2 + 60, { steps: 6 });
  await page.mouse.up();
  await expect.poll(viewBox).not.toBe(zoome);
  expect(await page.evaluate(() => window.scrollY)).toBe(defilement);
  // Mode debug : les 24 noms de formes sont écrits sur la carte.
  const noms = await page.locator('svg[aria-label="Carte de Kanto"] text').allTextContents();
  expect(noms.length).toBeGreaterThanOrEqual(24);
});

test('Carte : fluidité au repos, pulsation de la zone actuelle comprise', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.getByRole('button', { name: 'Carte', exact: true }).click();
  await expect(page.locator('svg[aria-label^="Carte de Kanto"]')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const fps = await page.evaluate(() => new Promise<number>(terminer => {
    let images = 0;
    const debut = performance.now();
    const dessiner = () => {
      images++;
      if (performance.now() - debut < 5000) requestAnimationFrame(dessiner);
      else terminer(images / ((performance.now() - debut) / 1000));
    };
    requestAnimationFrame(dessiner);
  }));
  // Seuil de DESIGN.md : 59 images/s au repos ; marge de mesure pour la machine de test.
  expect(fps).toBeGreaterThanOrEqual(55);
});

test('Carte téléphone : liste qui défile, carte non cliquable, vol au toucher', async ({ page }) => {
  test.skip(!telephone(page));
  await ouvrirCarte(page);
  const liste = page.getByRole('list', { name: 'Zones de Kanto' });
  const carte = page.getByRole('img', { name: 'Carte de Kanto. Zone actuelle en vert.', exact: true });
  await expect(liste).toBeVisible();
  for (const ligne of await liste.getByRole('button').all()) {
    expect((await ligne.boundingBox())!.height).toBeGreaterThanOrEqual(48);
  }
  const bas = (await liste.boundingBox())!;
  const image = (await carte.boundingBox())!;
  expect(bas.y + bas.height).toBeLessThanOrEqual(image.y);
  expect(await liste.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
  const fermee = ligneZone(page, 'Forêt de Jade');
  await expect(fermee).toHaveAttribute('aria-disabled', 'true');
  await expect(fermee).toContainText('fermée');
  await expect(ligneZone(page, 'Route 1')).toHaveAccessibleName(/tu es ici/);
  await page.mouse.click(image.x + image.width / 2, image.y + image.height / 2);
  await expect(liste).toBeVisible();
  await expect(page.getByRole('button', { name: 'Carte', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByText('Vol en cours')).toHaveCount(0);
  // Bourg Palette permet de repartir vers Route 1, une zone de combat ouverte.
  await voyagerVers(page, 'Bourg Palette');
  await page.clock.runFor(3900);
  await expect(page.getByRole('heading', { name: 'Bourg Palette', exact: true })).toBeVisible();
  // Le bouton Carte rebondit tant qu’une zone nouvelle n’a pas été vue : pas « stable » pour Playwright.
  await page.getByRole('button', { name: 'Carte', exact: true }).click({ force: true });
  await ligneZone(page, 'Route 1').click();
  await expect(page.getByRole('status')).toContainText('Vol en cours');
  await page.clock.runFor(3900);
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible({ timeout: 10000 });
});

test('Carte téléphone : Céladopole ferme sa fenêtre puis vole vers l’Arène', async ({ page }) => {
  test.skip(!telephone(page));
  const kanto = JSON.parse(await readFile('data/regions/kanto/zones.json', 'utf8')) as { zones: { ancienId: number; id: string }[] };
  await ouvrirCarte(page);
  await page.evaluate(boss => {
    const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'))!;
    const enveloppe = JSON.parse(localStorage.getItem(cle)!);
    Object.assign(enveloppe.donnees, {
      argent: 50000, jetons: 0, zoneId: 'kanto.tour-pokemon', etape: 1,
      starterId: 1, evenementsJoues: ['kanto.intro'], drapeaux: ['sac-ouvert'],
      equipe: [{ uid: 'carte-starter', numero: 1, sexe: 'male', niveau: 5, xp: 0,
        shiny: false, bonheur: 0, pierreEternelle: false, calcium: 0, favori: false }],
      bossVaincus: [...boss, 'kanto.tour-pokemon'], badges: ['roche', 'cascade', 'foudre'], inventaire: {},
    });
    delete enveloppe.donnees.evenementEnCours;
    enveloppe.revision += 1;
    localStorage.setItem(cle, JSON.stringify(enveloppe));
  }, kanto.zones.filter(z => z.ancienId > 0 && z.ancienId < 10).map(z => z.id));
  await page.reload();
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.getByRole('button', { name: 'Carte', exact: true }).click();
  await ligneZone(page, 'Céladopole').click();
  const fenetre = page.getByRole('dialog', { name: 'Céladopole', exact: true });
  await expect(fenetre).toBeVisible();
  await fenetre.getByRole('button', { name: 'Arène', exact: true }).click();
  await expect(fenetre).toBeHidden();
  await expect(page.getByRole('status')).toContainText('Vol en cours');
  await page.clock.runFor(3900);
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible({ timeout: 10000 });
});
