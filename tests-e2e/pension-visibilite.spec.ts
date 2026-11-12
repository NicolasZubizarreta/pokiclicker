import { readFileSync } from 'node:fs';
import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Ticket D, visibilité de la pension : annonce qui reste, pastille, accès direct (Menu et Carte), pastille retirée à la première entrée.
const instant = new Date('2026-11-12T12:00:00Z');
const zones = (JSON.parse(readFileSync('data/regions/kanto/zones.json', 'utf8')) as { zones: { id: string }[] }).zones.map(z => z.id);
const annoncesSaufPension = ['sac', 'pc', 'centre-commercial', 'casino', 'poke-radar-au-shop', 'poke-radar',
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

/** Pension débloquée, jamais visitée, toutes les annonces vues sauf celle de la pension ; le casino est déjà visité (sa pastille est prioritaire). */
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
    bossVaincus: zones, ameliorations: ['pokeradar', 'falseSwipe', 'leftovers'], argent: 50000, jetons: 0, casinoVu: true,
    annoncesVues: annoncesSaufPension, ...region,
  });
  await page.reload();
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.clock.runFor(1000);
}

const region = (page: Page) => page.evaluate(() => {
  const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'))!;
  return JSON.parse(localStorage.getItem(cle)!).donnees as { pensionVue?: boolean; annoncesVues?: string[] };
});
const carteAnnonce = (page: Page) => page.locator('[data-annonce-deblocage] [data-annonce-carte]');
const navigation = (page: Page) => page.getByRole('navigation', { name: 'Navigation principale' });
const pastilles = (page: Page) => page.locator('[data-pastille-pension]');
const titrePension = (page: Page) => page.getByRole('heading', { name: /^(La pension|Pension)$/ });

test('annonce qui reste, pastille, « Y aller », pastille retirée à la première entrée', async ({ page }) => {
  await demarrer(page);
  const annonce = carteAnnonce(page);
  await expect(annonce).toContainText('Pension débloquée !');
  await expect(annonce).toContainText('Menu');
  // Elle ne disparaît pas au bout de 3 s ni de 30 s.
  await page.clock.runFor(30000);
  await expect(annonce).toBeVisible();
  // Pastille sur les onglets Menu et Carte.
  await expect(navigation(page).getByRole('button', { name: 'Menu', exact: true }).locator('[data-pastille-pension]')).toBeVisible();
  await expect(navigation(page).getByRole('button', { name: 'Carte', exact: true }).locator('[data-pastille-pension]')).toBeVisible();
  expect((await region(page)).annoncesVues).toEqual(annoncesSaufPension);

  await annonce.getByRole('button', { name: 'Y aller' }).click();
  await expect(titrePension(page)).toBeVisible();
  await expect(carteAnnonce(page)).toHaveCount(0);
  await expect(pastilles(page)).toHaveCount(0);
  expect(await region(page)).toMatchObject({ pensionVue: true });
  expect((await region(page)).annoncesVues).toContain('pension');

  // Ressortir puis revenir : ni annonce, ni pastille.
  await navigation(page).getByRole('button', { name: 'Menu', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Pension/ }).locator('[data-pastille-pension]')).toHaveCount(0);
  await page.getByRole('button', { name: /^Pension/ }).click();
  await expect(titrePension(page)).toBeVisible();

  await page.reload();
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.clock.runFor(2000);
  await expect(carteAnnonce(page)).toHaveCount(0);
  await expect(pastilles(page)).toHaveCount(0);
  expect(await region(page)).toMatchObject({ pensionVue: true });
});

test('l’annonce revient au rechargement tant qu’elle n’est pas fermée, « Fermer » la retire mais garde la pastille', async ({ page }) => {
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
  expect((await region(page)).pensionVue).toBeUndefined();
  expect((await region(page)).annoncesVues).toContain('pension');
  await page.reload();
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.clock.runFor(5000);
  await expect(carteAnnonce(page)).toHaveCount(0);
  await expect(pastilles(page).first()).toBeVisible();
});

test('accès direct par le Menu : entrée avec pastille, puis la pastille disparaît', async ({ page }) => {
  await demarrer(page, { annoncesVues: [...annoncesSaufPension, 'pension'] });
  await expect(carteAnnonce(page)).toHaveCount(0);
  await navigation(page).getByRole('button', { name: 'Menu', exact: true }).click();
  const entree = page.getByRole('button', { name: /^Pension/ });
  await expect(entree.locator('[data-pastille-pension]')).toBeVisible();
  await entree.click();
  await expect(titrePension(page)).toBeVisible();
  await expect(pastilles(page)).toHaveCount(0);
  expect(await region(page)).toMatchObject({ pensionVue: true });
});

test('sur PC, le décor entier et toute la zone des œufs tiennent d’un coup, sans rien rogner', async ({ page }, info) => {
  test.skip(info.project.name !== 'pc', 'mise en page PC');
  await demarrer(page, { annoncesVues: [...annoncesSaufPension, 'pension'], pensionVue: true });
  await navigation(page).getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('button', { name: /^Pension/ }).click();
  await expect(titrePension(page)).toBeVisible();
  for (const [largeur, hauteur] of [[1280, 800], [1440, 900], [1920, 1080]]) {
    await page.setViewportSize({ width: largeur, height: hauteur });
    await page.clock.runFor(300);
    const mesures = await page.evaluate(() => {
      const zone = document.querySelector('main#contenu')!.getBoundingClientRect();
      const decor = document.querySelector('.pension-scene')!.getBoundingClientRect();
      const fentes = [...document.querySelectorAll<HTMLElement>('.pension-fente')];
      return {
        decorBas: decor.bottom, zoneBas: zone.bottom, decorHaut: decor.top, zoneHaut: zone.top,
        decorGauche: decor.left, decorDroite: decor.right,
        fentes: fentes.map(f => ({ bas: f.getBoundingClientRect().bottom, gauche: f.getBoundingClientRect().left, droite: f.getBoundingClientRect().right,
          rogne: f.scrollHeight > f.clientHeight + 1 || f.scrollWidth > f.clientWidth + 1 })),
        titreVisible: [...document.querySelectorAll('.pension-oeufs h2')].every(h => h.getBoundingClientRect().width <= 1),
        decorBasFentes: decor.bottom,
      };
    });
    const etiquette = `${largeur}×${hauteur}`;
    expect(mesures.decorHaut, `haut du décor à ${etiquette}`).toBeGreaterThanOrEqual(mesures.zoneHaut);
    expect(mesures.decorBas, `bas du décor à ${etiquette}`).toBeLessThanOrEqual(mesures.zoneBas);
    expect(mesures.fentes, `cartes d’emplacement à ${etiquette}`).toHaveLength(5);
    for (const f of mesures.fentes) {
      expect(f.bas, `bas d’une carte à ${etiquette}`).toBeLessThanOrEqual(mesures.decorBas);
      expect(f.gauche, `bord gauche d’une carte à ${etiquette}`).toBeGreaterThanOrEqual(mesures.decorGauche);
      expect(f.droite, `bord droit d’une carte à ${etiquette}`).toBeLessThanOrEqual(mesures.decorDroite);
      expect(f.rogne, `texte rogné dans une carte à ${etiquette}`).toBe(false);
    }
    expect(mesures.titreVisible, `un seul compteur d’œufs à ${etiquette}`).toBe(true);
    await expect(page.locator('.pension-compteur')).toBeVisible();
    expect(await debordeHorizontalement(page), `défilement horizontal à ${etiquette}`).toBe(false);
  }
});

test('accès direct par la Carte : ligne « Pension » avec pastille, sans passer par Bourg Palette', async ({ page }) => {
  await demarrer(page, { annoncesVues: [...annoncesSaufPension, 'pension'] });
  await navigation(page).getByRole('button', { name: 'Carte', exact: true }).click();
  const ligne = page.getByRole('button', { name: 'Pension, accès direct' });
  await expect(ligne.locator('[data-pastille-pension]')).toBeVisible();
  await ligne.click();
  await expect(titrePension(page)).toBeVisible();
  await page.getByRole('button', { name: 'Retour à la carte' }).click();
  await expect(page.getByRole('button', { name: 'Pension, accès direct' }).locator('[data-pastille-pension]')).toHaveCount(0);
});

/** Captures de contrôle (CAPTURES=1) : six largeurs, ignorées par git (design/captures/). */
async function capturer(page: Page, nom: string) {
  if (!process.env.CAPTURES) return;
  const origine = page.viewportSize()!;
  for (const [largeur, hauteur] of [[360, 844], [390, 844], [430, 844], [1280, 800], [1440, 900], [1920, 1080]]) {
    await page.setViewportSize({ width: largeur, height: hauteur });
    await page.clock.runFor(300);
    expect(await debordeHorizontalement(page), `défilement horizontal à ${largeur} px (${nom})`).toBe(false);
    // Sur PC, la page défile dans la zone centrale : le défilement est conservé d'une largeur à l'autre.
    await page.screenshot({ path: `design/captures/pension/${nom}-${largeur}.png` });
  }
  await page.setViewportSize(origine);
}
const debordeHorizontalement = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

test('parcours : deux parents compatibles, chance de ponte, éclosion avec la marque, collection et paliers', async ({ page }) => {
  const femelle = { ...equipe[4], sexe: 'femelle' };
  const oeuf = { uid: 'oeuf-test', numero: 25, niveau: 1, xp: 0, shiny: false, bonheur: 0, pierreEternelle: false, calcium: 0,
    sexe: 'male', favori: false, oeuf: { pasRestants: 1, pasMax: 25 } };
  await demarrer(page, { equipe: [equipe[0], equipe[1], equipe[2], equipe[3], femelle, oeuf], annoncesVues: [...annoncesSaufPension, 'pension'], pensionVue: true });
  await navigation(page).getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('button', { name: /^Pension/ }).click();
  await expect(titrePension(page)).toBeVisible();
  await capturer(page, 'ecran-vide');

  // Parent 1 : un mâle de l'équipe ; parent 2 : la femelle, avec la chance de ponte du couple.
  await page.getByRole('button', { name: 'Déposer un parent' }).first().click();
  const fenetre = page.getByRole('dialog', { name: 'Choisir un parent' });
  await expect(fenetre).toBeVisible();
  await capturer(page, 'choix-parent-1');
  await fenetre.locator('.pension-candidat').first().click();
  await expect(fenetre).toBeHidden();
  await page.getByRole('button', { name: 'Déposer un parent' }).first().click();
  await expect(fenetre).toBeVisible();
  const compatible = fenetre.locator('.pension-candidat').filter({ hasText: 'type partagé' }).first();
  await expect(compatible).toContainText('2 % · type partagé');
  await capturer(page, 'choix-parent-2');
  await compatible.click();
  await expect(fenetre).toBeHidden();
  await expect(page.getByText('Deux parents compatibles.')).toHaveCount(1);
  await expect(page.getByText(/2 % par élimination/)).toBeVisible();
  await capturer(page, 'ecran-parents');

  // Éclosion : l'œuf de l'équipe éclôt au prochain combat gagné.
  await navigation(page).getByRole('button', { name: 'Combat', exact: true }).click();
  const eclosion = page.getByRole('dialog', { name: /est né !$/ });
  for (let i = 0; i < 30 && !(await eclosion.isVisible()); i++) {
    await page.getByRole('button', { name: /^Attaquer / }).click();
    await page.clock.runFor(700);
  }
  await expect(eclosion).toBeVisible();
  await expect(eclosion).toContainText('Marque d\'éclosion · +5 % de dégâts');
  await expect(eclosion).toContainText('Nouvelle espèce');
  await expect(eclosion).toContainText('Espèces écloses 1/151');
  await capturer(page, 'eclosion');
  await eclosion.getByRole('button', { name: 'Continuer' }).click();
  await expect(eclosion).toHaveCount(0);

  // Collection : une espèce éclose en couleur, les autres en silhouette, quatre paliers.
  await navigation(page).getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('button', { name: /^Pension/ }).click();
  const collection = page.getByRole('region', { name: 'Collection d’éclosions' });
  await expect(collection).toContainText('1/151');
  await expect(collection.locator('.pension-palier')).toHaveCount(4);
  await collection.evaluate(element => element.scrollIntoView({ block: 'start' }));
  await capturer(page, 'collection');
  expect(await debordeHorizontalement(page)).toBe(false);
});

test('pension fermée (Tour Pokémon non vaincue) : ni annonce, ni pastille, ni entrée directe', async ({ page }) => {
  await demarrer(page, { bossVaincus: [], annoncesVues: ['sac', 'pc'] });
  await expect(carteAnnonce(page)).toHaveCount(0);
  await expect(pastilles(page)).toHaveCount(0);
  await navigation(page).getByRole('button', { name: 'Menu', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Pension/ })).toHaveCount(0);
  await navigation(page).getByRole('button', { name: 'Carte', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pension, accès direct' })).toHaveCount(0);
});
