import { mkdir } from 'node:fs/promises';
import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

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

async function demarrer(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
}

// Après une première visite (la partie existe), les boss de la Route 1 et de la Forêt de Jade sont battus
// et le PC contient `total` Pokémon : Électrode, Mélofée, puis des espèces à sexe tiré au hasard.
async function remplirPc(page: Page, total: number) {
  await page.addInitScript(nombre => {
    const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'));
    if (!cle) return;
    const enveloppe = JSON.parse(localStorage.getItem(cle)!);
    // Une seule fois par onglet : le rechargement suivant doit lire ce que le jeu a enregistré.
    if (sessionStorage.getItem('pc-prepare')) return;
    sessionStorage.setItem('pc-prepare', '1');
    const especes = [1, 4, 7, 16, 19, 25, 35, 39, 52, 54, 58, 60, 63, 66, 74, 77, 79, 92, 95, 96, 104, 109, 111, 116, 129, 133, 143, 147];
    const pokemon = (uid: string, numero: number, niveau: number, sexe: string, extra = {}) =>
      ({ uid, numero, niveau, xp: 0, shiny: false, bonheur: 0, pierreEternelle: false, calcium: 0, sexe, favori: false, ...extra });
    const pc = [pokemon('pc-elec', 101, 12, 'sansSexe'), pokemon('pc-melo', 35, 40, 'femelle', { favori: true })];
    for (let i = 0; pc.length < nombre; i++) {
      pc.push(pokemon(`pc-${i}`, especes[i % especes.length]!, 1 + (i * 7) % 60, 'male', { shiny: i % 37 === 0, favori: i % 11 === 0 }));
    }
    enveloppe.donnees.pc = pc;
    enveloppe.donnees.bossVaincus = ['kanto.route-1', 'kanto.foret-de-jade'];
    enveloppe.revision += 1;
    localStorage.setItem(cle, JSON.stringify(enveloppe));
  }, total);
  await page.reload();
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
}

async function ouvrirPc(page: Page) {
  await page.getByRole('navigation').getByRole('button', { name: 'PC', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'PC de Léo', level: 1 })).toBeVisible();
}

const grille = (page: Page) => page.getByRole('list').filter({ has: page.getByRole('button', { name: /, niveau / }) }).last();

test('PC : verrouillé avec sa raison tant que l’Arène d’Argenta est fermée', async ({ page }) => {
  await demarrer(page);
  const entree = page.getByRole('navigation').getByRole('button', { name: 'PC', exact: true });
  await expect(entree).toHaveClass(/opacity-60/);
  await entree.click();
  await expect(page.getByText('Le PC de Léo s\'ouvre à l\'Arène d\'Argenta.')).toBeVisible();
});

test('PC : tris, recherche, captures et pas de défilement horizontal', async ({ page }, informations) => {
  await demarrer(page);
  await remplirPc(page, 200);
  await ouvrirPc(page);
  await expect(page.getByText('200 Pokémon')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const premier = () => grille(page).getByRole('button').first();
  await expect(premier()).toContainText('N° 1 ·');
  await page.getByRole('button', { name: 'Niveau', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Niveau', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(premier()).toContainText(/Niveau 6[0-9]/);
  await page.getByRole('button', { name: 'Shiny', exact: true }).click();
  await expect(premier().getByText('Shiny')).toBeAttached();
  await page.getByRole('button', { name: 'Favori', exact: true }).click();
  await expect(premier().locator('svg').first()).toBeAttached();
  await page.getByRole('button', { name: 'Nom', exact: true }).click();
  await expect(premier()).toContainText(/Abra/);
  await mkdir('design/captures', { recursive: true });
  const largeur = informations.project.name === 'mobile' ? 390 : 1440;
  await page.evaluate(() => Promise.all([...document.images].map(image => image.decode().catch(() => undefined))));
  await page.screenshot({ path: `design/captures/i-pc-${largeur}.png`, animations: 'disabled' });
  const recherche = page.getByRole('searchbox', { name: 'Nom ou numéro' });
  await recherche.fill('élec');
  await expect(grille(page).getByRole('button')).toHaveCount(1);
  await expect(grille(page).getByRole('button').first()).toContainText('Électrode');
  await recherche.fill('zzzz');
  await expect(page.getByText('Aucun Pokémon ne correspond à « zzzz ».')).toBeVisible();
  await recherche.fill('');
  await expect(page.getByText('200 Pokémon')).toBeVisible();
  await expect(grille(page).getByRole('button')).toHaveCount(200);
});

test('PC : placer jusqu’à six, échanger, et tout survit au rechargement', async ({ page }, informations) => {
  await demarrer(page);
  await remplirPc(page, 12);
  await ouvrirPc(page);
  const pc = informations.project.name === 'mobile';
  const placer = async (nom: RegExp) => {
    await grille(page).getByRole('button', { name: nom }).first().click();
    const fiche = page.locator('dialog[open]').first();
    if (pc) await fiche.getByRole('button', { name: 'Placer dans l\'équipe' }).click();
    else await page.getByRole('button', { name: 'Placer dans l\'équipe' }).click();
  };
  await placer(/^Mélofée, niveau/);
  await placer(/^Électrode, niveau/);
  await expect(page.getByText('10 Pokémon')).toBeVisible();
  // L'équipe a 5 Pokémon : un de plus la remplit, le suivant demande un échange.
  await grille(page).getByRole('button').first().click();
  if (pc) await page.locator('dialog[open]').first().getByRole('button', { name: 'Placer dans l\'équipe' }).click();
  else await page.getByRole('button', { name: 'Placer dans l\'équipe' }).click();
  await expect(page.getByText('9 Pokémon')).toBeVisible();
  await grille(page).getByRole('button').first().click();
  if (pc) await page.locator('dialog[open]').first().getByRole('button', { name: 'Placer dans l\'équipe' }).click();
  else await page.getByRole('button', { name: 'Placer dans l\'équipe' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Choisis le Pokémon à remplacer par' })).toBeVisible();
  await expect(page.getByText('9 Pokémon')).toBeVisible();
  await page.evaluate(() => Promise.all([...document.images].map(image => image.decode().catch(() => undefined))));
  const largeur = pc ? 390 : 1440;
  await page.screenshot({ path: `design/captures/i-pc-echange-${largeur}.png`, animations: 'disabled' });
  await page.getByRole('button', { name: /^Bulbizarre, niveau/ }).first().click();
  await expect(page.getByText('9 Pokémon')).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Choisis le Pokémon à remplacer par' })).toHaveCount(0);
  const apres = await page.getByText(/^\d+ Pokémon$/).textContent();
  await page.reload();
  await page.getByRole('navigation').getByRole('button', { name: 'PC', exact: true }).click();
  await expect(page.getByText(apres!)).toBeVisible();
  await page.getByRole('button', { name: 'Équipe', exact: true }).click();
  await expect(page.getByText(/· 6 \/ 6$/)).toBeVisible();
});

test('Pokédex : 151 cases et compteur des starters', async ({ page }, informations) => {
  await demarrer(page);
  await page.getByRole('button', { name: 'Plus', exact: true }).click();
  await page.getByRole('button', { name: /^Pokédex/ }).click();
  await expect(page.getByRole('heading', { name: 'Pokédex', level: 1 })).toBeVisible();
  await expect(page.getByText('3 / 151')).toBeVisible();
  await expect(page.getByRole('listitem')).toHaveCount(151);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.evaluate(() => Promise.all([...document.images].map(image => image.decode().catch(() => undefined))));
  const largeur = informations.project.name === 'mobile' ? 390 : 1440;
  await page.screenshot({ path: `design/captures/i-pokedex-${largeur}.png`, animations: 'disabled' });
});

test('PC : la grille ne bouge pas pendant trois secondes de combat avec 200 Pokémon', async ({ page }) => {
  await demarrer(page);
  await remplirPc(page, 200);
  await ouvrirPc(page);
  await expect(grille(page).getByRole('button')).toHaveCount(200);
  const mutations = await page.evaluate(() => new Promise<number>(resolve => {
    const liste = [...document.querySelectorAll('ul')].find(ul => ul.querySelectorAll('button').length >= 200)!;
    let total = 0;
    const observateur = new MutationObserver(enregistrements => { total += enregistrements.length; });
    observateur.observe(liste, { subtree: true, childList: true, attributes: true, characterData: true });
    setTimeout(() => { observateur.disconnect(); resolve(total); }, 3000);
  }));
  expect(mutations).toBe(0);
});
