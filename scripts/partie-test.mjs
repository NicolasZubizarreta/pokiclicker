/// <reference lib="dom" />
import { spawn } from 'node:child_process';
import { rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { setTimeout as attendre } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { chromium, expect } from '@playwright/test';
import zones from '../data/regions/kanto/zones.json' with { type: 'json' };
import badges from '../data/badges.json' with { type: 'json' };
import objets from '../data/objets.json' with { type: 'json' };
import succes from '../data/succes.json' with { type: 'json' };
import sexes from '../data/sexes.json' with { type: 'json' };

process.chdir(fileURLToPath(new URL('../', import.meta.url)));
const verifier = process.argv.includes('--verifier');
const profil = '.partie-test/profil';
const port = 5199;
const url = `http://localhost:${port}`;
/** @type {import('@playwright/test').BrowserContext | undefined} */
let navigateur;
/** @type {import('node:child_process').ChildProcess | undefined} */
let serveur;
/** @type {Promise<void> | undefined} */
let termine;
/** @type {Promise<void> | undefined} */
let fermeture;

function arreter() {
  return fermeture ??= (async () => {
    await navigateur?.close().catch(() => {});
    if (serveur && serveur.exitCode === null && serveur.signalCode === null) {
      serveur.kill('SIGTERM');
      await Promise.race([termine, attendre(3000)]);
      if (serveur.exitCode === null && serveur.signalCode === null) {
        serveur.kill('SIGKILL');
        await termine;
      }
    }
  })();
}
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => {
  console.log('\nFermeture du navigateur et du serveur…');
  void arreter().finally(() => process.exit(signal === 'SIGINT' ? 130 : 143));
});

/** @param {import('@playwright/test').Page} page */
async function preparer(page) {
  await page.addInitScript(() => {
    if (!localStorage.getItem('partie-test-prepare')) {
      localStorage.setItem('pokiclicker-dev:equipe-de-depart', '1');
    }
  });
  await page.goto(url);
  if (await page.evaluate(() => localStorage.getItem('partie-test-prepare'))) {
    console.log('Profil existant : reprise de la progression.');
    return;
  }
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  // Comme l'audit : modifier les enveloppes avant le démarrage de l'application au rechargement.
  await page.addInitScript(({ boss, badges, objets, succes, sexes }) => {
    if (localStorage.getItem('partie-test-prepare')) return;
    const instant = new Date().toISOString();
    /** @param {number} numero @param {string} uid @param {number} niveau @param {number} [index] @returns {import('../src/core/sauvegarde-types').PokemonPossede} */
    function pokemon(numero, uid, niveau, index = 0) {
      return { uid, numero, niveau, xp: 0, shiny: index % 13 === 1, bonheur: 100,
        pierreEternelle: false, calcium: 0, favori: index % 7 === 1,
        sexe: sexes.sansSexe.includes(numero) ? 'sansSexe' : sexes.toujoursMale.includes(numero) ? 'male'
          : sexes.toujoursFemelle.includes(numero) || index % 2 ? 'femelle' : 'male' };
    }
    const equipe = [3, 6, 9, 65, 94, 149].map((n, i) => pokemon(n, `test-equipe-${n}`, 100, i));
    const numeros = [1, 4, 7, 10, 13, 16, 19, 21, 23, 25, 27, 29, 32, 35, 37, 39, 41, 43,
      46, 48, 50, 52, 54, 56, 58, 60, 63, 66, 69, 72, 74, 77, 79, 81, 92, 95, 113, 129, 132, 133];
    const pcGlobal = numeros.map((n, i) => {
      const p = pokemon(n, `test-pc-${n}`, i === 36 ? 100 : 5 + (i * 5 % 96), i);
      if (i === 0) p.surnom = 'Bourgeon';
      if (i === 9) p.surnom = 'Étincelle';
      return p;
    });
    const oeufs = [25, 1].map((n, i) => ({ ...pokemon(n, `test-pension-oeuf-${i}`, 1),
      shiny: false, oeuf: { pasRestants: 15 + i * 5, pasMax: 25 } }));
    pcGlobal.push({ ...pokemon(25, 'test-pc-oeuf', 1), oeuf: { pasRestants: 15, pasMax: 25 } });
    const parents = [pokemon(25, 'test-parent-male', 50), pokemon(25, 'test-parent-femelle', 55, 1)];
    const quantites = { pokeball: 99, superball: 99, hyperball: 60, masterball: 3, candy: 99,
      repel: 50, superRepel: 50, xAttack: 50, xSpecial: 50, calcium: 50, pomegBerry: 50,
      fireStone: 20, waterStone: 20, leafStone: 20, thunderStone: 20, moonStone: 20,
      everstone: 20, pokeDoll: 30, shinyToken: 2 };
    const inventaire = Object.fromEntries(Object.entries(quantites).map(([id, quantite]) => {
      const objet = objets.find(o => o.id === id);
      if (!objet?.inventaire) throw new Error(`Objet sans clé d'inventaire : ${id}`);
      return [objet.inventaire, quantite];
    }));
    const cles = Object.keys(localStorage);
    const cleRegion = cles.find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'));
    const clePartie = cles.find(c => c.startsWith('pokiclicker:partie:'));
    if (!cleRegion || !clePartie) throw new Error('Sauvegarde locale initiale absente.');
    const region = JSON.parse(localStorage.getItem(cleRegion) ?? 'null');
    /** @type {Partial<import('../src/core/sauvegarde-types').DonneesRegion>} */
    const avancee = { equipe, pc: pcGlobal, starterId: 1, zoneId: 'kanto.route-victoire', etape: 1,
      bossVaincus: boss, badges, ligueGagnee: 0, argent: 5_000_000, jetons: 5000,
      objetsCles: ['pokeflute'], drapeaux: ['sac-ouvert', 'ronflex-vaincu'],
      evenementsJoues: ['kanto.intro', 'kanto.fin-pokedex', 'kanto.chen-premier-boss', 'kanto.blue-presentation', 'kanto.ronflex-reveil', 'kanto.rival-route-victoire'],
      inventaire, ameliorations: ['runningShoes', 'amuletCoin', 'protein', 'hardStone', 'pokeradar', 'leftovers', 'falseSwipe', 'diploma'],
      diplomeLe: instant, pension: { parents, oeufs, emplacementsOeuf: 3 },
      statistiques: { eliminations: 12_000, argentTotalGagne: 8_000_000 } };
    Object.assign(region.donnees, avancee);
    delete region.donnees.evenementEnCours;
    delete region.donnees.annoncesVues;
    region.revision++;
    localStorage.setItem(cleRegion, JSON.stringify(region));
    const partie = JSON.parse(localStorage.getItem(clePartie) ?? 'null');
    /** @type {Partial<import('../src/core/sauvegarde-types').DonneesPartie>} */
    const progression = { nom: 'Partie test',
      pokedexNational: [...new Set([...Array.from({ length: 120 }, (_, i) => i + 1),
        ...[...equipe, ...pcGlobal, ...parents, ...oeufs].map(p => p.numero)])].sort((a, b) => a - b),
      statistiques: { victoires: 12_000, argentTotalGagne: 8_000_000, tempsJeuMs: 4 * 60 * 60 * 1000 } };
    Object.assign(partie.donnees, progression);
    partie.revision++;
    localStorage.setItem(clePartie, JSON.stringify(partie));
    const cleCompte = 'pokiclicker:compte:local';
    const compte = JSON.parse(localStorage.getItem(cleCompte) ?? 'null') ?? {
      version: region.version, niveau: 'compte', id: 'local', revision: 0, ecritLe: instant, donnees: { preferences: {} },
    };
    // Aucun catalogue de skins n'existe actuellement dans les données du jeu.
    Object.assign(compte.donnees, { diamants: 500, succes, skins: [] });
    compte.revision++;
    localStorage.setItem(cleCompte, JSON.stringify(compte));
    localStorage.setItem('partie-test-prepare', '1');
  }, { boss: zones.zones.slice(1, 21).map(z => z.id), badges: badges.map(b => b.id), objets,
    succes: succes.succes.map(s => s.id), sexes });
  await page.reload();
  console.log('Partie avancée préparée : 6 Pokémon en équipe, 41 au PC, Ligue à gagner.');
}

async function lancer() {
  if (process.argv.includes('--reset')) {
    await rm(profil, { recursive: true, force: true });
    console.log('Profil de test réinitialisé.');
  }
  // Refuser un port occupé avant de sonder l'URL : ne jamais ouvrir un autre serveur.
  await new Promise((resolve, reject) => {
    const sonde = createServer();
    sonde.once('error', reject);
    sonde.listen(port, 'localhost', () => sonde.close(erreur => erreur ? reject(erreur) : resolve(undefined)));
  });
  console.log(`Démarrage du jeu en mode local : ${url}`);
  // Une valeur vide empêche aussi Vite de reprendre une URL définie dans un fichier .env.
  serveur = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', 'localhost', '--port', String(port), '--strictPort'], {
    env: { ...process.env, VITE_API_URL: '' }, shell: false, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let journal = '';
  serveur.stdout?.on('data', sortie => { journal = (journal + sortie).slice(-4000); });
  serveur.stderr?.on('data', sortie => { journal = (journal + sortie).slice(-4000); });
  /** @type {Error | undefined} */
  let erreurServeur;
  termine = new Promise(resolve => {
    serveur?.once('error', erreur => { erreurServeur = erreur; resolve(); });
    serveur?.once('exit', code => { erreurServeur = new Error(`Vite arrêté (${code}) : ${journal}`); resolve(); });
  });
  const limite = Date.now() + 120_000;
  while (true) {
    if (erreurServeur) throw erreurServeur;
    if (Date.now() > limite) throw new Error('Le serveur ne répond pas après 120 secondes.');
    try {
      if ((await fetch(url, { signal: AbortSignal.timeout(1000) })).ok) break;
    } catch { /* Le serveur démarre. */ }
    await attendre(250);
  }
  const optionsNavigateur = { headless: verifier, viewport: null, args: ['--window-size=1440,900'] };
  // Chromium de Playwright s'il est installé, sinon Chrome ou Edge déjà présents sur la machine.
  for (const canal of [undefined, 'chrome', 'msedge']) {
    try {
      navigateur = await chromium.launchPersistentContext(profil, { ...optionsNavigateur, channel: canal });
      break;
    } catch (erreurLancement) {
      if (canal === 'msedge') throw erreurLancement;
    }
  }
  if (!navigateur) throw new Error('Aucun navigateur disponible.');
  const ferme = new Promise(resolve => navigateur?.once('close', resolve));
  const page = navigateur.pages()[0] ?? await navigateur.newPage();
  /** @type {string[]} */
  const erreurs = [];
  page.on('pageerror', erreur => erreurs.push(erreur.message));
  page.on('console', message => { if (message.type() === 'error') erreurs.push(message.text()); });
  await preparer(page);
  if (verifier) {
    /** @type {Record<string, string>} */
    const titres = { Équipe: 'Ton équipe', PC: 'PC de Léo', Shop: 'Shop', Carte: 'Carte', Menu: 'Menu' };
    let nombrePc = 0;
    for (const menu of ['Combat', 'Équipe', 'Shop', 'Carte', 'Menu', 'PC']) {
      if (menu === 'PC') await page.getByRole('button', { name: 'PC de Léo', exact: true }).click();
      else await page.getByRole('navigation').getByRole('button', { name: menu, exact: true }).click();
      if (menu === 'Combat') await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
      else await expect(page.getByRole('heading', { name: titres[menu], exact: true })).toBeVisible();
      if (menu === 'Équipe') await expect(page.locator('button[data-uid]')).toHaveCount(6);
      if (menu === 'PC') {
        await expect(page.getByRole('heading', { name: 'Équipe · 6 / 6', exact: true })).toBeVisible();
        nombrePc = await page.locator('ul > li').count();
        expect(nombrePc).toBeGreaterThanOrEqual(30);
      }
    }
    // Laisser aussi remonter les erreurs des derniers rendus et ressources.
    await page.waitForTimeout(500);
    expect(erreurs, 'Erreurs JavaScript ou console').toEqual([]);
    console.log('Menus vérifiés : Combat, Équipe, Shop, Carte, Menu, PC (depuis Menu).');
    console.log(`Vérification réussie : 6 Pokémon en équipe, ${nombrePc} au PC, aucune erreur JavaScript ou console.`);
  } else {
    console.log('Progression conservée dans .partie-test/profil. Fermez la fenêtre ou faites Ctrl+C pour quitter.');
    await Promise.race([ferme, termine.then(() => { throw erreurServeur; })]);
  }
}

try {
  await lancer();
} catch (erreur) {
  console.error('Échec de la partie test :', erreur instanceof Error ? erreur.message : erreur);
  process.exitCode = 1;
} finally {
  await arreter();
}
