/// <reference lib="dom" />
import { expect } from '@playwright/test';
import zones from '../../data/regions/kanto/zones.json' with { type: 'json' };

const instant = '2026-11-05T12:00:00.000Z';
/** @typedef {import('@playwright/test').Page} Page */
/** @typedef {{contexte: import('@playwright/test').BrowserContext, url: string, largeur: number}} Contexte */
/** @typedef {{groupe: string, slug: string, titre: string, source: string, etat: string, build: 'jeu'|'compte', atteindre?: (page: Page, ctx: Contexte) => Promise<void>, inatteignable?: string}} Ecran */
/** @param {Page} page @param {string|RegExp} nom */
const bouton = (page, nom) => page.getByRole('button', { name: nom, exact: typeof nom === 'string' });
/** @param {Page} page @param {string|RegExp} nom */
const titre = (page, nom) => expect(page.getByRole('heading', { name: nom, exact: true })).toBeVisible();
/** @param {Page} page */
const dialogue = page => page.getByRole('dialog', { name: 'Dialogue de scène' });

/** À 1440 px, l'en-tête de l'écran de combat recouvre les boutons « Mon compte » et « Mes parties » (défaut de l'interface actuelle, à noter dans l'audit) : le clic réel est intercepté, on déclenche donc le clic sur l'élément. */
/** @param {import('@playwright/test').Locator} locator */
const cliquerSousEntete = locator => locator.evaluate(element => /** @type {HTMLElement} */ (element).click());

/** @param {Page} page @param {Contexte} ctx */
async function demarrerAvecEquipe(page, ctx) {
  await page.addInitScript(() => localStorage.setItem('pokiclicker-dev:equipe-de-depart', '1'));
  await page.goto(ctx.url);
  await expect(bouton(page, /^Attaquer /)).toBeVisible();
}

/** @param {Page} page @param {Contexte} ctx @param {Partial<import('../../src/core/sauvegarde-types').DonneesRegion>} region @param {Partial<import('../../src/core/sauvegarde-types').DonneesPartie>} partie */
async function demarrerEtatAvance(page, ctx, region = {}, partie = {}) {
  await demarrerAvecEquipe(page, ctx);
  await page.addInitScript(({ region, partie, boss, instant }) => {
    if (sessionStorage.getItem('audit-prepare')) return;
    sessionStorage.setItem('audit-prepare', '1');
    const cles = Object.keys(localStorage);
    const cle = cles.find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'));
    if (!cle) throw new Error('Sauvegarde région absente.');
    const enveloppe = JSON.parse(localStorage.getItem(cle) ?? 'null');
    const equipe = [3, 6, 9, 65, 94, 149].map(numero => ({ uid: `audit-${numero}`, numero, niveau: 100, xp: 0, shiny: numero === 6, bonheur: 0, pierreEternelle: false, calcium: 0, sexe: 'male', favori: false }));
    Object.assign(enveloppe.donnees, { equipe, zoneId: 'kanto.route-1', etape: 1, starterId: 1, argent: 250000,
      inventaire: { pokeball: 50, superball: 20, hyperball: 10 },
      bossVaincus: boss, badges: ['roche', 'cascade', 'foudre', 'prisme', 'ame', 'marais', 'volcan', 'terre'],
      drapeaux: ['sac-ouvert'], evenementsJoues: ['kanto.intro', 'kanto.fin-pokedex', 'kanto.chen-premier-boss', 'kanto.blue-presentation'],
      ameliorations: ['pokeradar', 'diploma'], diplomeLe: instant, ...region });
    delete enveloppe.donnees.evenementEnCours;
    enveloppe.revision++;
    localStorage.setItem(cle, JSON.stringify(enveloppe));
    const clePartie = cles.find(c => c.startsWith('pokiclicker:partie:'));
    if (!clePartie) throw new Error('Sauvegarde partie absente.');
    const p = JSON.parse(localStorage.getItem(clePartie) ?? 'null');
    Object.assign(p.donnees, { pokedexNational: [1, 3, 6, 9, 65, 94, 149], pcGlobal: [
      { ...equipe[0], uid: 'audit-pc', numero: 25, niveau: 30, shiny: false },
    ], ...partie });
    p.revision++;
    localStorage.setItem(clePartie, JSON.stringify(p));
    const cleCompte = cles.find(c => c.startsWith('pokiclicker:compte:')) ?? 'pokiclicker:compte:local';
    const compte = JSON.parse(localStorage.getItem(cleCompte) ?? 'null') ?? { version: enveloppe.version, niveau: 'compte', id: 'local', revision: 0, ecritLe: instant, donnees: { preferences: {} } };
    Object.assign(compte.donnees, { diamants: 120, succes: ['premiers-pas', 'premier-badge'], skins: ['tenue-kanto'] });
    compte.revision++;
    localStorage.setItem(cleCompte, JSON.stringify(compte));
  }, { region, partie, boss: zones.zones.slice(1, 21).map(z => z.id), instant });
  await page.reload();
}

/** @param {Page} page @param {Contexte} ctx @param {string} navigation @param {string} attendu */
async function ouvrirDepuisNavigation(page, ctx, navigation, attendu) {
  await demarrerEtatAvance(page, ctx);
  await page.getByRole('navigation').getByRole('button', { name: navigation, exact: true }).click();
  await titre(page, attendu);
}

/** @param {Page} page @param {Contexte} ctx @param {string|RegExp} nom @param {'dialog'|'heading'} role @param {string|RegExp} attendu */
async function ouvrirPlus(page, ctx, nom, role = 'dialog', attendu = nom) {
  await ouvrirDepuisNavigation(page, ctx, 'Menu', 'Menu');
  await bouton(page, nom).click();
  if (role === 'heading') await titre(page, attendu);
  else await expect(page.getByRole(role, { name: attendu, exact: true })).toBeVisible();
}

/** @param {Page} page @param {Contexte} ctx */
async function ouvrirEquipe(page, ctx) {
  await ouvrirDepuisNavigation(page, ctx, 'Équipe', 'Ton équipe');
}

/** @param {Page} page @param {Contexte} ctx @param {string} etape */
async function ouvrirIntro(page, ctx, etape) {
  await page.goto(ctx.url);
  await titre(page, 'POKÉ CLICKER');
  if (etape === 'titre') return;
  await bouton(page, 'JOUER').click();
  await expect(page.getByRole('region', { name: 'Chez Maman', exact: true })).toBeVisible();
  if (etape === 'maman') return;
  await bouton(page, 'Sortie').click();
  await expect(page.getByRole('region', { name: 'Bourg Palette', exact: true })).toBeVisible();
  if (etape === 'bourg') return;
  await bouton(page, 'Labo Pokémon du Prof. Chen').click();
  await page.clock.runFor(50);
  const chen = bouton(page, /^Prof\. Chen : /);
  await expect(chen).toContainText('Salutations');
  if (etape === 'dialogue') return;
  for (let i = 0; i < 7; i++) await chen.click();
  await page.clock.runFor(50);
  await titre(page, 'CHOISIS TON PARTENAIRE');
  await bouton(page, /^Carapuce/).click();
  await expect(bouton(page, 'CHOISIR CARAPUCE')).toBeVisible();
}

/** @typedef {{compte: import('../../src/core/sauvegarde-types').Enveloppe<import('../../src/core/sauvegarde-types').DonneesCompte>, partie: import('../../src/core/sauvegarde-types').Enveloppe<import('../../src/core/sauvegarde-types').DonneesPartie>, regions: import('../../src/core/sauvegarde-types').Enveloppe<import('../../src/core/sauvegarde-types').DonneesRegion>[]}} Version */
/** @param {import('@playwright/test').BrowserContext} contexte @param {string} url @param {{version?: Version, ailleurs?: boolean}} options */
async function brancherFauxServeur(contexte, url, { version, ailleurs = false } = {}) {
  const etat = { ailleurs };
  await contexte.route('http://api.test/**', async route => {
    const cors = { 'access-control-allow-origin': url, 'access-control-allow-headers': 'authorization,content-type',
      'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS', 'access-control-expose-headers': 'set-auth-token' };
    /** @param {unknown} json @param {number} status */
    const repondre = (json, status = 200) => route.fulfill({ json, status, headers: cors });
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const chemin = new URL(route.request().url()).pathname;
    if (chemin === '/api/auth/get-session') return repondre({ session: { id: 'audit' } });
    if (chemin.endsWith('/appareil')) return repondre({ actif: !etat.ailleurs });
    if (chemin === '/api/sauvegarde/parties') return repondre({ parties: version ? [{ id: version.partie.id, nom: version.partie.donnees.nom, revision: version.partie.revision, ecritLe: instant, regionCourante: 'kanto', zoneId: 'kanto.route-1' }] : [] });
    if (chemin === '/api/sauvegarde/compte' && version) return repondre({ enveloppe: version.compte });
    if (version && chemin === `/api/sauvegarde/parties/${version.partie.id}`) return repondre({ partie: version.partie, regions: version.regions });
    return repondre({}, 404);
  });
  return etat;
}

/** @param {Page} page @param {Contexte} ctx @param {string} mode */
async function ouvrirCompte(page, ctx, mode) {
  await brancherFauxServeur(ctx.contexte, ctx.url);
  await page.goto(ctx.url + (mode === 'nouveau' ? '?token=audit-local' : ''));
  if (mode === 'inscription') await bouton(page, 'Créer un compte').click();
  if (mode === 'oubli') await bouton(page, 'Mot de passe oublié').click();
  const titres = new Map([['connexion', 'Connexion'], ['inscription', 'Inscription'], ['oubli', 'Mot de passe oublié'], ['nouveau', 'Nouveau mot de passe']]);
  await titre(page, titres.get(mode) ?? mode);
}

/** @param {Page} page @param {Contexte} ctx @param {string} mode */
async function ouvrirCompteConnecte(page, ctx, mode) {
  // Amorçage local par la version sans compte : mêmes sauvegardes, même origine après copie.
  const graine = await ctx.contexte.newPage();
  await demarrerEtatAvance(graine, { ...ctx, url: 'http://localhost:4175' });
  const stockage = await graine.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
  await graine.close();
  await page.addInitScript(stockage => {
    if (sessionStorage.getItem('audit-compte')) return;
    sessionStorage.setItem('audit-compte', '1');
    for (const [cle, valeur] of Object.entries(stockage)) localStorage.setItem(cle, valeur);
    localStorage.setItem('pokiclicker.session', 'audit-jeton');
  }, stockage);
  const enveloppes = Object.entries(stockage).filter(([cle]) => /^pokiclicker:(compte|partie|region):/.test(cle)).map(([, valeur]) => JSON.parse(valeur));
  const version = { compte: enveloppes.find(e => e.niveau === 'compte'), partie: enveloppes.find(e => e.niveau === 'partie'), regions: enveloppes.filter(e => e.niveau === 'region') };
  const serveur = await brancherFauxServeur(ctx.contexte, ctx.url, { version: mode === 'deconnexion' ? version : undefined, ailleurs: mode === 'ailleurs' });
  await page.goto(ctx.url);
  if (mode === 'ailleurs') return titre(page, 'Partie ouverte ailleurs');
  await expect(bouton(page, /^Attaquer /)).toBeVisible();
  if (mode === 'reprise-ailleurs') {
    serveur.ailleurs = true;
    await page.clock.runFor(60_000);
    await expect(page.getByRole('alert')).toContainText('Partie reprise ailleurs');
    return;
  }
  await bouton(page, 'Menu').click();
  await bouton(page, /Menu principal/).click();
  await titre(page, 'Mes parties');
  if (mode === 'deconnexion') {
    await page.getByRole('navigation', { name: 'Zone compte' }).getByRole('button', { name: 'Compte', exact: true }).click();
    await bouton(page, 'Se déconnecter').click();
    await expect(page.getByRole('dialog', { name: 'Se déconnecter ?', exact: true })).toBeVisible();
    await expect(page.getByRole('dialog').getByRole('button', { name: 'Se déconnecter', exact: true })).toBeVisible();
  }
}

/** @param {Page} page @param {Contexte} ctx @param {string|null} section */
async function ouvrirMonCompte(page, ctx, section) {
  await demarrerEtatAvance(page, ctx);
  await cliquerSousEntete(bouton(page, 'Mon compte'));
  await expect(page.getByRole('dialog', { name: 'Mon compte', exact: true })).toBeVisible();
  if (section) {
    const entete = page.getByRole('heading', { name: section, exact: true });
    await expect(entete).toBeVisible();
    await entete.scrollIntoViewIfNeeded();
  }
}

/** @param {Page} page @param {Contexte} ctx @param {string} lieu */
async function ouvrirLieu(page, ctx, lieu) {
  await ouvrirDepuisNavigation(page, ctx, 'Carte', 'Carte');
  await bouton(page, /Céladopole/).click();
  await bouton(page, lieu).click();
  await page.clock.runFor(5000);
  await titre(page, lieu);
}

/** @param {Page} page @param {Contexte} ctx */
async function ouvrirPantheon(page, ctx) {
  // Même technique que tests-e2e/pantheon.spec.ts : un seul PV au dernier adversaire dans le bundle compilé de cette page, le reste du combat est réel.
  let injections = 0;
  await page.route('**/assets/*.js', async route => {
    const reponse = await route.fetch();
    const source = await reponse.text();
    await route.fulfill({ response: reponse, body: source.replace(/\bpv:([\w$]+),pvMax:\1\b/g, (_, maximum) => { injections++; return `pv:1,pvMax:${maximum}`; }) });
  });
  await demarrerEtatAvance(page, ctx, { zoneId: 'kanto.ligue-pokemon', etape: 10, ligueGagnee: 0, starterId: 7 });
  await titre(page, 'Maître Blue (Florizarre)');
  if (injections === 0) throw new Error('Injection du dernier PV introuvable dans le bundle.');
  for (const nom of ['Arrêt auto', 'Auto-attaque']) {
    const interrupteur = bouton(page, nom);
    if (await interrupteur.getAttribute('aria-pressed') === 'true') await interrupteur.click();
  }
  await bouton(page, /^Attaquer /).click();
  await page.clock.runFor(100);
  await expect(page.getByRole('dialog', { name: 'Panthéon', exact: true })).toBeVisible();
}

/** @param {string} groupe @param {string} slug @param {string} titre @param {string} composant @param {string} etat @param {NonNullable<Ecran['atteindre']>} atteindre @param {'jeu'|'compte'} build @returns {Ecran} */
const entree = (groupe, slug, titre, composant, etat, atteindre, build = 'jeu') => ({ groupe, slug, titre, source: `src/ui/${composant}.tsx`, etat, build, atteindre });
const avance = 'Équipe de six au niveau 100, huit badges, 250 000\u00a0₽, sac rempli et radar débloqué.';
export const ecrans = [
  .../** @type {[string,string,string][]} */ ([['connexion', 'Connexion', 'connexion'], ['inscription', 'Inscription', 'inscription'], ['mot-de-passe-oublie', 'Mot de passe oublié', 'oubli'], ['nouveau-mot-de-passe', 'Nouveau mot de passe', 'nouveau']]).map(([slug, nom, mode]) => entree('compte', slug, nom, 'compte/EcranCompte', 'Formulaire sans erreur ; API fictive locale.', (p, c) => ouvrirCompte(p, c, mode), 'compte')),
  entree('compte', 'ecran-parties', 'Mes parties', 'compte/EcranParties', 'Partie locale existante, aucune partie sur le faux serveur.', (p, c) => ouvrirCompteConnecte(p, c, 'parties'), 'compte'),
  entree('compte', 'ecran-deconnexion', 'Se déconnecter ?', 'compte/DialogueDeconnexion', 'Confirmation ouverte depuis l’onglet Compte.', (p, c) => ouvrirCompteConnecte(p, c, 'deconnexion'), 'compte'),
  entree('compte', 'ecran-reprise-ailleurs', 'Partie reprise ailleurs', 'compte/EcranRepriseAilleurs', 'Jeu monté puis battement signalant un autre appareil actif.', (p, c) => ouvrirCompteConnecte(p, c, 'reprise-ailleurs'), 'compte'),
  entree('compte', 'ecran-autre-appareil', 'Partie ouverte ailleurs', 'compte/EcranAutreAppareil', 'Le faux serveur signale un autre appareil actif.', (p, c) => ouvrirCompteConnecte(p, c, 'ailleurs'), 'compte'),
  .../** @type {[string,string,string|null][]} */ ([['ecran-mon-compte', 'Mon compte', null], ['diamants', 'Diamants', 'Diamants'], ['succes', 'Succès', 'Succès'], ['skins', 'Skins', 'Skins']]).map(([slug, nom, section]) => entree('compte', slug, nom, 'compte/EcranMonCompte', 'Compte local : 120 diamants, deux succès, skin tenue-kanto ; section dans la page Mon compte.', (p, c) => ouvrirMonCompte(p, c, section))),
  entree('combat', 'ecran-combat', 'Combat', 'EcranCombat', avance, async (p, c) => { await demarrerEtatAvance(p, c); await expect(p.getByRole('region', { name: /^Combat contre/ })).toBeVisible(); }),
  entree('combat', 'bourg-palette', 'Scène du bourg', 'EcranCombat', 'Bourg Palette après le choix du starter.', async (p, c) => { await demarrerEtatAvance(p, c, { zoneId: 'kanto.bourg-palette' }); await expect(p.getByRole('img', { name: 'Bourg Palette', exact: true })).toBeVisible(); }),
  entree('combat', 'ronflex', 'Scène de Ronflex', 'EcranCombat', 'Ronflex endormi bloque la route, avant usage de la Pokéflûte.', async (p, c) => {
    const vaincus = [...zones.zones.filter(z => !z.sansCombat && z.ancienId > 0 && z.ancienId < 12).map(z => z.id), 'kanto.centrale'];
    await demarrerEtatAvance(p, c, { zoneId: 'kanto.centrale', etape: 1, bossVaincus: vaincus, objetsCles: [] });
    await p.getByRole('navigation').getByRole('button', { name: 'Carte', exact: true }).click();
    await p.locator('[data-forme="Route de Ronflex"]').first().focus();
    await p.keyboard.press('Enter');
    await bouton(p, 'Y aller').click();
    await p.clock.runFor(8000);
    await expect(dialogue(p)).toContainText('Un Ronflex endormi');
    await dialogue(p).getByRole('button').click();
    await expect(dialogue(p)).toHaveCount(0);
    await expect(p.getByRole('img', { name: 'Ronflex endormi', exact: true })).toBeVisible();
  }),
  entree('combat', 'dialogues-chen', 'Dialogues de Chen', 'SceneFin', 'Pokédex complet : félicitations de Chen au laboratoire.', async (p, c) => { await demarrerEtatAvance(p, c, { zoneId: 'kanto.bourg-palette', evenementsJoues: ['kanto.intro'], ameliorations: ['pokeradar'] }, { pokedexNational: Array.from({ length: 151 }, (_, i) => i + 1) }); await expect(dialogue(p)).toContainText('Incroyable'); }),
  entree('combat', 'panneau-sac', 'Sac en combat', 'PanneauSac', avance, async (p, c) => { await demarrerEtatAvance(p, c); await bouton(p, 'Sac').click(); await expect(p.getByRole('dialog', { name: 'Ton Sac', exact: true })).toBeVisible(); }),
  entree('combat', 'fenetre-radar', 'Radar', 'FenetreRadar', avance, async (p, c) => { await demarrerEtatAvance(p, c); await bouton(p, 'Poké-Radar').click(); await expect(p.getByRole('dialog', { name: 'Route 1', exact: true })).toBeVisible(); }),
  .../** @type {[string,string,string,string][]} */ ([['page-intro-maman', 'Chez Maman', 'PageIntro', 'maman'], ['page-intro-bourg', 'Bourg Palette', 'PageIntro', 'bourg'], ['ecran-titre', 'Écran titre', 'EcranTitre', 'titre'], ['choix-starter', 'Choix du starter', 'ChoixStarter', 'starter'], ['dialogue-intro', 'Dialogue de Chen', 'DialogueIntro', 'dialogue']]).map(([slug, nom, source, etape]) => entree('intro', slug, nom, source, 'Nouvelle partie sans équipe de départ ; parcours réel de l’introduction.', (p, c) => ouvrirIntro(p, c, etape))),
  entree('equipe', 'page-equipe', 'Équipe', 'PageEquipe', avance, ouvrirEquipe),
  entree('equipe', 'page-pc', 'PC', 'PagePC', 'Équipe complète, Pikachu niveau 30 au PC.', async (p, c) => { await ouvrirDepuisNavigation(p, c, 'Menu', 'Menu'); await bouton(p, 'PC de Léo').click(); await titre(p, 'PC de Léo'); }),
  entree('equipe', 'sac', 'Sac dans l’équipe', 'Sac', avance, async (p, c) => { await ouvrirEquipe(p, c); await expect(p.getByRole('region', { name: 'Sac', exact: true })).toBeVisible(); }),
  entree('equipe', 'fiche-pokemon', 'Fiche Pokémon', 'FichePokemon', avance, async (p, c) => { await ouvrirEquipe(p, c); await bouton(p, /^Florizarre, niveau/).first().click(); const fiche = p.locator('dialog[open]').first(); if (!await fiche.isVisible()) await bouton(p, 'Ouvre la fiche').click(); await expect(fiche).toBeVisible(); await expect(fiche).toContainText('Florizarre'); }),
  entree('equipe', 'menu-pokemon', 'Menu Pokémon', 'MenuPokemon', avance, async (p, c) => { await ouvrirEquipe(p, c); await bouton(p, /^Florizarre, niveau/).first().click({ button: 'right' }); await expect(p.getByRole('menuitem', { name: 'Résumé', exact: true })).toBeVisible(); }),
  entree('shop', 'page-shop', 'Shop', 'PageShop', avance, (p, c) => ouvrirDepuisNavigation(p, c, 'Shop', 'Shop')),
  entree('carte', 'carte-kanto', 'Carte de Kanto', 'CarteKanto', avance, (p, c) => ouvrirDepuisNavigation(p, c, 'Carte', 'Carte')),
  entree('carte', 'page-centre', 'Centre commercial', 'PageCentre', avance, (p, c) => ouvrirLieu(p, c, 'Centre commercial')),
  entree('carte', 'page-casino', 'Casino', 'PageCasino', avance, (p, c) => ouvrirLieu(p, c, 'Casino')),
  entree('carte', 'page-pension', 'Pension', 'PagePension', avance, async (p, c) => { await demarrerEtatAvance(p, c, { zoneId: 'kanto.bourg-palette' }); await bouton(p, 'Pension Pokémon').click(); await titre(p, 'La pension'); }),
  entree('plus', 'page-plus', 'Plus — menu', 'PagePlus', avance, (p, c) => ouvrirDepuisNavigation(p, c, 'Menu', 'Menu')),
  entree('plus', 'page-plus-reglages', 'Plus — réglages', 'PagePlus', avance, (p, c) => ouvrirPlus(p, c, 'Réglages', 'heading')),
  entree('plus', 'page-monde', 'Plus — monde', 'PageMonde', avance, (p, c) => ouvrirPlus(p, c, 'Monde Pokémon', 'heading')),
  entree('plus', 'pokedex', 'Pokédex', 'Pokedex', avance, (p, c) => ouvrirPlus(p, c, /^Pokédex/, 'heading', 'Pokédex')),
  entree('plus', 'boite-badges', 'Badges', 'BoiteBadges', avance, (p, c) => ouvrirPlus(p, c, 'Badges', 'heading')),
  entree('plus', 'guide', 'Guide', 'Guide', avance, (p, c) => ouvrirPlus(p, c, 'Guide du jeu')),
  entree('plus', 'statistiques', 'Statistiques', 'Statistiques', avance, (p, c) => ouvrirPlus(p, c, 'Statistiques')),
  entree('plus', 'diplome', 'Diplôme', 'Diplome', 'Diplôme obtenu le 5 novembre 2026, partie locale.', (p, c) => ouvrirPlus(p, c, 'Diplôme du Pokédex')),
  entree('fin', 'scene-fin', 'Fin — Pokédex complet', 'SceneFin', '151 espèces capturées, première réplique de Chen.', async (p, c) => { await demarrerEtatAvance(p, c, { zoneId: 'kanto.bourg-palette', evenementsJoues: ['kanto.intro'], ameliorations: [] }, { pokedexNational: Array.from({ length: 151 }, (_, i) => i + 1) }); await expect(dialogue(p)).toContainText('Incroyable'); }),
  entree('fin', 'pantheon', 'Panthéon', 'Pantheon', 'Première victoire à la Ligue, six Pokémon niveau 100.', ouvrirPantheon),
  entree('fin', 'credits', 'Crédits', 'Credits', 'Fin du défi de Chen : crédits disponibles et pas encore vus.', async (p, c) => { await demarrerEtatAvance(p, c, { zoneId: 'kanto.bourg-palette', drapeaux: ['credits-disponibles'] }); await expect(p.locator('dialog.credits[open]')).toBeVisible(); }),
];
