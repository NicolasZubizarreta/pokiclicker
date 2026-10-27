import { mkdir } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { DonneesRegion } from '../src/core/sauvegarde';
import fin from '../data/evenements/fin.json' with { type: 'json' };

const instant = new Date('2026-10-25T12:00:00Z');
const evenement = (id: string) => fin.evenements.find(e => e.id === id)!;
const lignes = (id: string) => evenement(id).etapes.flatMap(e => e.type === 'dialogue' ? [e.texte!] : []);

type Preparation = { zone: string; etape: number; ligueGagnee: number; drapeaux: string[]; joues: string[] };

// Même préparation que pantheon.spec.ts : sauvegarde écrite avant le rechargement, combat réel ensuite.
async function demarrer(page: Page, preparation: Preparation, dernierPv: boolean) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install({ time: instant });
  await page.clock.pauseAt(instant);
  await page.addInitScript(() => { Math.random = () => 0.1; });
  let injections = 0;
  if (dernierPv) await page.route('**/assets/*.js', async route => {
    const reponse = await route.fetch();
    const source = await reponse.text();
    const corps = source.replace(/\bpv:([\w$]+),pvMax:\1\b/g, (_, maximum: string) => {
      injections++;
      return `pv:1,pvMax:${maximum}`;
    });
    await route.fulfill({ response: reponse, body: corps });
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.addInitScript(({ zone, etape, ligueGagnee, drapeaux, joues }) => {
    if (sessionStorage.getItem('fin-prepare')) return;
    sessionStorage.setItem('fin-prepare', '1');
    const cles = Object.keys(localStorage);
    const cle = cles.find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'))!;
    const enveloppe = JSON.parse(localStorage.getItem(cle)!);
    const region = enveloppe.donnees;
    region.equipe = [3, 6, 9, 65, 94, 149].map(numero => ({
      uid: `fin-${numero}`, numero, niveau: 100, xp: 0, shiny: false,
      bonheur: 0, pierreEternelle: false, calcium: 0, sexe: 'male', favori: false,
    }));
    region.zoneId = zone;
    region.etape = etape;
    region.starterId = 1;
    region.ligueGagnee = ligueGagnee;
    region.drapeaux = drapeaux;
    region.evenementsJoues = joues;
    enveloppe.revision += 1;
    localStorage.setItem(cle, JSON.stringify(enveloppe));
    const clePartie = cles.find(c => c.startsWith('pokiclicker:partie:'))!;
    const partie = JSON.parse(localStorage.getItem(clePartie)!);
    partie.donnees.pokedexNational = Array.from({ length: 151 }, (_, i) => i + 1);
    partie.revision += 1;
    localStorage.setItem(clePartie, JSON.stringify(partie));
  }, preparation);
  await page.reload();
  return () => expect(injections, 'Injection du dernier PV dans le combat compilé').toBeGreaterThan(0);
}

async function regionSauvee(page: Page): Promise<DonneesRegion> {
  return page.evaluate(() => {
    const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'))!;
    return JSON.parse(localStorage.getItem(cle)!).donnees;
  });
}

// Lit chaque ligne de Chen dans l'ordre, puis attend que la fenêtre de dialogue se ferme.
async function lire(page: Page, textes: string[]) {
  const fenetre = page.getByRole('dialog', { name: 'Dialogue de scène' });
  for (const texte of textes) {
    await expect(fenetre).toContainText(texte);
    await fenetre.getByRole('button').click();
  }
  await expect(fenetre).toHaveCount(0);
}

const sansDefilement = (page: Page) => page.evaluate(() =>
  document.documentElement.scrollWidth <= document.documentElement.clientWidth);

test('Fin : le Pokédex complet fait dire cinq lignes à Chen, donne le diplôme, rejouable depuis Plus', async ({ page }, informations) => {
  await demarrer(page, { zone: 'kanto.bourg-palette', etape: 1, ligueGagnee: 0, drapeaux: [], joues: ['kanto.intro'] }, false);
  const dialogue = lignes('kanto.fin-pokedex');
  await lire(page, dialogue);
  const region = await regionSauvee(page);
  expect(region.zoneId).toBe('kanto.labo');
  expect(region.ameliorations.filter(id => id === 'diploma')).toHaveLength(1);
  expect(region.ameliorations.filter(id => id === 'shinyCharm')).toHaveLength(1);
  expect(region.evenementsJoues.filter(id => id === 'kanto.fin-pokedex')).toHaveLength(1);

  await page.getByRole('button', { name: 'Plus', exact: true }).click();
  await page.getByRole('button', { name: 'Diplôme du Pokédex', exact: true }).click();
  const diplome = page.getByRole('dialog', { name: 'Diplôme du Pokédex' });
  await expect(diplome).toBeVisible();
  // Nom de la partie créée par défaut.
  await expect(diplome.getByText('Partie 1', { exact: true })).toBeVisible();
  await expect(diplome.locator('time')).toHaveAttribute('datetime', instant.toISOString());
  await expect(diplome.locator('time')).toHaveText('25 octobre 2026');
  expect(await sansDefilement(page)).toBe(true);
  await mkdir('design/captures', { recursive: true });
  const largeur = informations.project.name === 'mobile' ? 390 : 1440;
  await page.screenshot({ path: `design/captures/x-diplome-${largeur}.png`, animations: 'disabled' });
  await diplome.getByRole('button', { name: 'Fermer', exact: true }).click();
  await expect(diplome).toHaveCount(0);

  // Le diplôme garde son nom et sa date après rechargement, et Chen ne reparle pas.
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Labo Pokémon du Prof. Chen', level: 1 })).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Dialogue de scène' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Plus', exact: true }).click();
  await page.getByRole('button', { name: 'Diplôme du Pokédex', exact: true }).click();
  await expect(page.locator('dialog[open] time')).toHaveText('25 octobre 2026');
});

test('Fin : le défi de Chen se gagne, Chen conclut, les crédits défilent par pages une seule fois', async ({ page }, informations) => {
  const verifierInjection = await demarrer(page, { zone: 'kanto.labo', etape: 6, ligueGagnee: 1,
    drapeaux: ['defi-chen-actif', 'defi-chen-intro-vue'], joues: ['kanto.intro', 'kanto.fin-pokedex'] }, true);
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  verifierInjection();
  const auto = page.getByRole('button', { name: 'Auto-attaque', exact: true });
  if (await auto.getAttribute('aria-pressed') === 'true') await auto.click();
  await page.getByRole('button', { name: /^Attaquer / }).click();
  await page.clock.runFor(100);

  await lire(page, lignes('kanto.defi-chen-victoire'));
  const credits = page.locator('dialog.credits');
  await expect(credits).toBeVisible();
  // Mouvement réduit : lecture par pages au lieu du défilement.
  await expect(credits.getByText(/^Page 1 \/ \d+$/)).toBeVisible();
  const total = Number((await credits.getByText(/^Page 1 \/ \d+$/).textContent())!.split('/')[1]);
  expect(total).toBeGreaterThan(1);
  expect(await sansDefilement(page)).toBe(true);
  const largeur = informations.project.name === 'mobile' ? 390 : 1440;
  await page.screenshot({ path: `design/captures/x-credits-${largeur}.png`, animations: 'disabled' });
  for (let i = 1; i < total; i++) await credits.getByRole('button', { name: 'Suivant', exact: true }).click();
  await credits.getByRole('button', { name: 'Terminer', exact: true }).click();
  await expect(credits.getByRole('heading', { name: 'Retour à Kanto' })).toBeVisible();
  await credits.getByRole('button', { name: 'Retour à Kanto', exact: true }).click();
  await expect(credits).toHaveCount(0);

  const region = await regionSauvee(page);
  expect(region.drapeaux).toContain('defi-chen-gagne');
  expect(region.evenementsJoues.filter(id => id === 'kanto.defi-chen-victoire')).toHaveLength(1);

  // Les crédits ne reviennent pas après rechargement.
  await page.reload();
  await expect(page.getByRole('navigation', { name: 'Navigation principale' })).toBeVisible();
  await page.clock.runFor(500);
  await expect(page.getByRole('dialog', { name: 'Dialogue de scène' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Passer', exact: true })).toHaveCount(0);
});

test('Fin : les crédits peuvent être passés d’un geste (Échap) sans les lire', async ({ page }) => {
  const verifierInjection = await demarrer(page, { zone: 'kanto.labo', etape: 6, ligueGagnee: 1,
    drapeaux: ['defi-chen-actif', 'defi-chen-intro-vue'], joues: ['kanto.intro', 'kanto.fin-pokedex'] }, true);
  verifierInjection();
  await page.getByRole('button', { name: /^Attaquer / }).click();
  await page.clock.runFor(100);
  await lire(page, lignes('kanto.defi-chen-victoire'));
  const passer = page.getByRole('button', { name: 'Passer', exact: true });
  await expect(passer).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(passer).toHaveCount(0);
});
