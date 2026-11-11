import { readFileSync } from 'node:fs';
import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Ticket C, visibilité du casino : annonce qui reste, pastille, accès direct (Menu et Carte), jetons offerts une seule fois.
const instant = new Date('2026-10-28T12:00:00Z');
const zones = (JSON.parse(readFileSync('data/regions/kanto/zones.json', 'utf8')) as { zones: { id: string }[] }).zones.map(z => z.id);
const casino = JSON.parse(readFileSync('data/casino.json', 'utf8')) as { premiereEntree: { jetons: number } };
const offerts = casino.premiereEntree.jetons;
const annoncesSaufCasino = ['sac', 'pc', 'pension', 'centre-commercial', 'poke-radar-au-shop', 'poke-radar',
  'fauchage-au-shop', 'fauchage', 'auto-clic-au-shop', 'auto-clic'];
const equipe = [3, 6, 9, 65, 94, 149].map(numero => ({
  uid: `visibilite-${numero}`, numero, niveau: 100, xp: 0, shiny: false,
  bonheur: 0, pierreEternelle: false, calcium: 0, sexe: 'male', favori: false,
}));

const test = base.extend<{ surveillance: void }>({
  surveillance: [async ({ page }, utiliser) => {
    const erreurs: string[] = [];
    page.on('console', message => { if (message.type() === 'error') erreurs.push(message.text()); });
    page.on('pageerror', erreur => erreurs.push(erreur.message));
    await utiliser();
    expect.soft(erreurs, 'Erreurs de console ou de page').toEqual([]);
  }, { auto: true }],
});

/** Casino débloqué, jamais visité, toutes les annonces vues sauf celle du casino. */
async function demarrer(page: Page, region: Record<string, unknown> = {}) {
  await page.clock.install({ time: instant });
  await page.clock.pauseAt(instant);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => { Math.random = () => 0.1; });
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.addInitScript(champs => {
    if (sessionStorage.getItem('visibilite-prepare')) return;
    sessionStorage.setItem('visibilite-prepare', '1');
    const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'))!;
    const enveloppe = JSON.parse(localStorage.getItem(cle)!);
    Object.assign(enveloppe.donnees, champs);
    delete enveloppe.donnees.evenementEnCours;
    enveloppe.revision += 1;
    localStorage.setItem(cle, JSON.stringify(enveloppe));
  }, {
    zoneId: 'kanto.route-1', etape: 1, starterId: 1, equipe, drapeaux: ['sac-ouvert'], evenementsJoues: ['kanto.intro'],
    bossVaincus: zones, ameliorations: ['pokeradar', 'falseSwipe', 'leftovers'], argent: 50000, jetons: 0,
    annoncesVues: annoncesSaufCasino, ...region,
  });
  await page.reload();
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.clock.runFor(1000);
}

const region = (page: Page) => page.evaluate(() => {
  const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'))!;
  return JSON.parse(localStorage.getItem(cle)!).donnees as { jetons: number; casinoVu?: boolean; annoncesVues?: string[] };
});
const carteAnnonce = (page: Page) => page.locator('[data-annonce-deblocage] [data-annonce-carte]');
const navigation = (page: Page) => page.getByRole('navigation', { name: 'Navigation principale' });
const pastilles = (page: Page) => page.locator('[data-pastille-casino]');
const jetons = (page: Page) => page.locator('[data-jetons]:visible').first();
const bienvenue = `${offerts} jetons offerts pour ta première visite !`;

test('annonce qui reste, pastille, « Y aller », jetons offerts une seule fois, pastille retirée', async ({ page }) => {
  await demarrer(page);
  const annonce = carteAnnonce(page);
  await expect(annonce).toContainText('Casino débloqué !');
  await expect(annonce).toContainText('Menu');
  // Elle ne disparaît pas au bout de 3 s ni de 30 s.
  await page.clock.runFor(30000);
  await expect(annonce).toBeVisible();
  // Pastille sur les onglets Menu et Carte.
  await expect(navigation(page).getByRole('button', { name: 'Menu', exact: true }).locator('[data-pastille-casino]')).toBeVisible();
  await expect(navigation(page).getByRole('button', { name: 'Carte', exact: true }).locator('[data-pastille-casino]')).toBeVisible();
  expect(await region(page)).toMatchObject({ jetons: 0, annoncesVues: annoncesSaufCasino });

  await annonce.getByRole('button', { name: 'Y aller' }).click();
  await expect(page.getByRole('heading', { name: 'Casino', exact: true })).toBeVisible();
  await expect(page.getByText(bienvenue)).toBeVisible();
  await expect(jetons(page)).toHaveText(new RegExp(`^${offerts}( jetons)?$`));
  await expect(carteAnnonce(page)).toHaveCount(0);
  await expect(pastilles(page)).toHaveCount(0);
  expect(await region(page)).toMatchObject({ jetons: offerts, casinoVu: true });
  expect((await region(page)).annoncesVues).toContain('casino');

  // Ressortir puis revenir : ni nouveau cadeau, ni message, ni pastille.
  await page.getByRole('button', { name: 'Retour à la Carte' }).click();
  await navigation(page).getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('button', { name: /^Casino/ }).click();
  await expect(page.getByRole('heading', { name: 'Casino', exact: true })).toBeVisible();
  await expect(page.getByText(bienvenue)).toHaveCount(0);
  await expect(jetons(page)).toHaveText(new RegExp(`^${offerts}( jetons)?$`));

  await page.reload();
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.clock.runFor(2000);
  await expect(carteAnnonce(page)).toHaveCount(0);
  await expect(pastilles(page)).toHaveCount(0);
  expect(await region(page)).toMatchObject({ jetons: offerts, casinoVu: true });
});

test('l’annonce revient au rechargement tant qu’elle n’est pas fermée, « Fermer » la retire sans donner le cadeau', async ({ page }) => {
  await demarrer(page);
  await expect(carteAnnonce(page)).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.clock.runFor(2000);
  await expect(carteAnnonce(page)).toBeVisible();
  await carteAnnonce(page).getByRole('button', { name: 'Fermer' }).click();
  await expect(carteAnnonce(page)).toHaveCount(0);
  // La pastille reste : le joueur n'est pas encore entré.
  await expect(pastilles(page).first()).toBeVisible();
  expect(await region(page)).toMatchObject({ jetons: 0 });
  expect((await region(page)).annoncesVues).toContain('casino');
  await page.reload();
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.clock.runFor(5000);
  await expect(carteAnnonce(page)).toHaveCount(0);
  await expect(pastilles(page).first()).toBeVisible();
});

test('accès direct par le Menu : entrée avec pastille, puis la pastille disparaît', async ({ page }) => {
  await demarrer(page, { annoncesVues: [...annoncesSaufCasino, 'casino'] });
  await expect(carteAnnonce(page)).toHaveCount(0);
  await navigation(page).getByRole('button', { name: 'Menu', exact: true }).click();
  const entree = page.getByRole('button', { name: /^Casino/ });
  await expect(entree.locator('[data-pastille-casino]')).toBeVisible();
  await entree.click();
  await expect(page.getByText(bienvenue)).toBeVisible();
  await expect(jetons(page)).toHaveText(new RegExp(`^${offerts}( jetons)?$`));
  await expect(pastilles(page)).toHaveCount(0);
});

test('accès direct par la Carte : ligne « Casino » avec pastille, sans passer par la fiche de Céladopole', async ({ page }) => {
  await demarrer(page, { annoncesVues: [...annoncesSaufCasino, 'casino'] });
  await navigation(page).getByRole('button', { name: 'Carte', exact: true }).click();
  const ligne = page.getByRole('button', { name: 'Casino, accès direct' });
  await expect(ligne.locator('[data-pastille-casino]')).toBeVisible();
  await ligne.click();
  await expect(page.getByRole('heading', { name: 'Casino', exact: true })).toBeVisible();
  await expect(page.getByText(bienvenue)).toBeVisible();
  await page.getByRole('button', { name: 'Retour à la Carte' }).click();
  await expect(page.getByRole('button', { name: 'Casino, accès direct' }).locator('[data-pastille-casino]')).toHaveCount(0);
});

test('casino fermé (Tour Pokémon non vaincue) : ni annonce, ni pastille, ni entrée directe', async ({ page }) => {
  await demarrer(page, { bossVaincus: [], annoncesVues: ['sac', 'pc'] });
  await expect(carteAnnonce(page)).toHaveCount(0);
  await expect(pastilles(page)).toHaveCount(0);
  await navigation(page).getByRole('button', { name: 'Menu', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Casino/ })).toHaveCount(0);
  await navigation(page).getByRole('button', { name: 'Carte', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Casino, accès direct' })).toHaveCount(0);
});
