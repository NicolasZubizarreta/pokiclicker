import donneesCasino from '../../data/casino.json';
import donneesJeuxCasino from '../../data/casino-jeux.json';
import { migrer } from './migrations';
import { reglages } from './reglages';
import { sexeEspece } from './sexe';
import { CATEGORIES_DEPENSE, JEUX_SUIVIS, suiviVide } from './suivi';
import { chargerPokemon } from './pokemon';
import monde from '../../data/regions/kanto/zones.json';
import catalogueMonde from '../../data/monde.json';
import badges from '../../data/badges.json';
import jalons from '../../data/jalons.json';
import objetsCles from '../../data/objets-cles.json';
import objets from '../../data/objets.json';
import evenementsIntro from '../../data/evenements/intro.json';
import evenementsRival from '../../data/evenements/rival.json';
import evenementsRonflex from '../../data/evenements/ronflex.json';
import evenementsFin from '../../data/evenements/fin.json';
import evenementsChenBoss from '../../data/evenements/chen-boss.json';
import { LISTE_MAX, PLAFOND_ARGENT, PLAFOND_JETONS } from './plafonds';
import type { DonneesCompte, DonneesPartie, DonneesRegion, Enveloppe, MainBlackjack, MainBlackjackAncienne, Niveau, PokemonPossede } from './sauvegarde-types';

/**
 * Politique (incident de production du 20/11) : une vraie sauvegarde n'est jamais refusée pour une règle « douce ».
 * On répare (valeur ramenée au maximum, doublon retiré, champ inconnu ou facultatif illisible retiré) ; on ne refuse que
 * ce qui est réellement corrompu (JSON, types, champs obligatoires absents, taille absurde).
 */
/** Au-delà, une liste n'est plus une sauvegarde mais un fichier abîmé ou hostile. Les PC de plusieurs milliers de Pokémon passent. */
const LISTE_ABSOLUE = 200_000;
type Validateur = (valeur: unknown) => void;
export const NOM_PARTIE_MIN = 1;
export const NOM_PARTIE_MAX = 100;
export function chaineBornee(v: unknown, min = 0, max = 200): asserts v is string {
  exiger(typeof v === 'string' && v.length >= min && v.length <= max, 'Longueur de texte invalide');
}
const cataloguePokemon = () => chargerPokemon().liste.length;
const regions = [monde.region, ...catalogueMonde.regionsVerrouillees.map(id => id.toLowerCase())];
// Imports statiques : le cœur reste utilisable hors Vite (serveur, tests Node).
const evenements: { id: string; etapes: unknown[] }[] = [
  ...evenementsIntro.evenements, ...evenementsRival.evenements, ...evenementsRonflex.evenements,
  ...evenementsFin.evenements, ...evenementsChenBoss.evenements,
];
/**
 * Un uid partagé par deux Pokémon (défaut d'une ancienne version) est réparé, pas refusé : le deuxième reçoit un uid
 * distinct. Refuser ici rendrait toute la partie illisible pour un défaut que le joueur ne peut pas corriger.
 */
function uniques(pokemon: PokemonPossede[]): void {
  const vus = new Set<string>();
  for (const p of pokemon) {
    let uid = p.uid;
    for (let n = 2; vus.has(uid); n++) uid = `${p.uid.slice(0, 56)}~${n}`;
    p.uid = uid;
    vus.add(uid);
  }
}
/**
 * Listes d'identifiants : doublons retirés, puis coupées à la taille du catalogue. Une liste plus longue que le catalogue
 * ne peut contenir que des doublons ou des restes d'une ancienne version : la couper ne fait rien perdre au joueur, et
 * refuser la partie lui ferait tout perdre. Les listes de Pokémon (pc, équipe) ne sont jamais coupées : seule leur taille
 * maximale (`liste`) les borne.
 */
function bornerIdentifiants(v: Record<string, unknown>, bornes: Record<string, number> = {}): void {
  for (const [cle, valeur] of Object.entries(v)) {
    if (!Array.isArray(valeur)) continue;
    // Le sabot de blackjack contient légitimement des doublons (6 paquets) : il ne se dédoublonne pas.
    if (cle !== 'sabotBlackjack' && valeur.every(e => typeof e === 'string' || typeof e === 'number')) {
      // Un texte plus long qu'un identifiant n'en est pas un : il est écarté, pas la partie.
      const gardes = valeur.filter(e => typeof e !== 'string' || e.length <= 200);
      v[cle] = [...new Set(gardes)].slice(0, bornes[cle] ?? LISTE_MAX);
    }
  }
}
/** Espèces d'une collection (chromatiques, écloses) : seuls les numéros du catalogue restent, sans doublon. */
function reparerEspeces(region: Record<string, unknown>, cle: string): void {
  const valeur = region[cle];
  if (!Array.isArray(valeur)) return;
  region[cle] = [...new Set(valeur.filter((n): n is number => Number.isSafeInteger(n) && n >= 1 && n <= reglages.pension.especesTirees))];
}
/** Entier positif ou nul le plus proche : décimal arrondi vers le bas, négatif ramené à zéro. */
function entierPositif(parent: Record<string, unknown>, cle: string, max = Number.MAX_SAFE_INTEGER): void {
  const valeur = parent[cle];
  if (typeof valeur === 'number') parent[cle] = Math.min(max, Math.max(0, Math.floor(valeur)));
}
export function exiger(condition: unknown, raison: string): asserts condition {
  if (!condition) throw new Error(raison);
}
export function objet(valeur: unknown): asserts valeur is Record<string, unknown> {
  exiger(valeur !== null && typeof valeur === 'object' && !Array.isArray(valeur), 'Objet attendu');
  exiger(Object.getPrototypeOf(valeur) === Object.prototype || Object.getPrototypeOf(valeur) === null,
    'Objet JSON attendu');
}
export function chaine(valeur: unknown): asserts valeur is string {
  chaineBornee(valeur);
}
export function identifiant(valeur: unknown): asserts valeur is string {
  chaine(valeur);
  chaineBornee(valeur, 1, 64);
  exiger(valeur.length > 0 && !valeur.includes(':'), 'Identifiant invalide');
}
const nombre: Validateur = v => exiger(typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= Number.MAX_SAFE_INTEGER, 'Nombre positif ou nul attendu');
const entier: Validateur = v => { nombre(v); exiger(Number.isSafeInteger(v), 'Entier attendu'); };
const positif: Validateur = v => { entier(v); exiger((v as number) > 0, 'Entier strictement positif attendu'); };
const booleen: Validateur = v => exiger(typeof v === 'boolean', 'Booléen attendu');
/** Un nombre fini : le signe et les décimales se réparent après coup (`entierPositif`), ils ne font pas refuser la partie. */
const reel: Validateur = v => exiger(typeof v === 'number' && Number.isFinite(v), 'Nombre attendu');
const liste = (valider: Validateur): Validateur => v => {
  exiger(Array.isArray(v), 'Tableau attendu');
  exiger(v.length <= LISTE_ABSOLUE, 'Liste trop longue');
  for (const element of v) valider(element);
};
const texte: Validateur = v => exiger(typeof v === 'string', 'Texte attendu');
const textes = liste(texte);
/** Identifiants de tutoriels vus : au plus 64 (le jeu en compte une dizaine) ; la coupe se fait dans `bornerIdentifiants`. */
const tutosVus: Validateur = textes;
/** Forme stricte, pour les données du jeu (événements, scènes) : un champ inconnu ou manquant est une erreur d'auteur. */
export function forme(v: unknown, requis: Record<string, Validateur>, facultatifs: Record<string, Validateur> = {}) {
  objet(v);
  exiger(Object.keys(v).every(cle => Object.hasOwn(requis, cle) || Object.hasOwn(facultatifs, cle)), 'Champ inconnu');
  for (const [cle, valider] of Object.entries(requis)) {
    exiger(Object.hasOwn(v, cle), `Champ manquant : ${cle}`);
    valider(v[cle]);
  }
  for (const [cle, valider] of Object.entries(facultatifs)) if (Object.hasOwn(v, cle)) valider(v[cle]);
}
/**
 * Forme des sauvegardes : champs inconnus retirés (reste d'une autre version), jamais un refus. Avec `tolerer`, un champ
 * facultatif illisible est retiré (la partie se charge comme une ancienne sauvegarde qui ne l'avait pas) au lieu de faire
 * refuser le tout. Les champs obligatoires absents ou mal typés restent une vraie corruption.
 */
function formeSouple(v: unknown, requis: Record<string, Validateur>, facultatifs: Record<string, Validateur> = {}, tolerer = false) {
  objet(v);
  for (const cle of Object.keys(v)) if (!Object.hasOwn(requis, cle) && !Object.hasOwn(facultatifs, cle)) delete v[cle];
  for (const [cle, valider] of Object.entries(requis)) {
    exiger(Object.hasOwn(v, cle), `Champ manquant : ${cle}`);
    valider(v[cle]);
  }
  for (const [cle, valider] of Object.entries(facultatifs)) {
    if (!Object.hasOwn(v, cle)) continue;
    if (!tolerer) { valider(v[cle]); continue; }
    try { valider(v[cle]); } catch { delete v[cle]; }
  }
}
export function validerPokemonPossede(v: unknown): asserts v is PokemonPossede {
  formeSouple(v, { uid: identifiant, numero: positif, niveau: reel, xp: reel, shiny: booleen,
    bonheur: reel, pierreEternelle: booleen, calcium: reel, favori: booleen,
    sexe: s => exiger(s === 'male' || s === 'femelle' || s === 'sansSexe', `Sexe invalide : ${String(s)}`) },
  { marqueEclosion: booleen, surnom: texte, objetTenu: () => undefined, oeuf: o => {
    try {
      formeSouple(o, { pasRestants: reel, pasMax: positif });
    } catch (erreur) {
      throw new Error(`Œuf invalide : ${(erreur as Error).message}`);
    }
  } });
  const pokemon = v as PokemonPossede;
  // Valeurs hors des bornes du jeu : ramenées dans les bornes (la partie reste lisible), jamais refusées.
  pokemon.niveau = Math.min(reglages.recompenses.niveauMax, Math.max(1, Math.floor(pokemon.niveau)));
  pokemon.calcium = Math.min(reglages.degats.calciumMax, Math.max(0, Math.floor(pokemon.calcium)));
  pokemon.bonheur = Math.min(reglages.recompenses.bonheur.max, Math.max(0, pokemon.bonheur));
  pokemon.xp = Math.max(0, pokemon.xp);
  // Objet tenu illisible (ou sur un œuf) : retiré, la partie reste lisible. Un id inconnu du jeu reste sans effet.
  if (pokemon.objetTenu !== undefined) {
    try { identifiant(pokemon.objetTenu); if (pokemon.oeuf) throw new Error('œuf'); } catch { delete pokemon.objetTenu; }
  }
  if (pokemon.oeuf) pokemon.oeuf.pasRestants = Math.min(pokemon.oeuf.pasMax, Math.max(0, Math.floor(pokemon.oeuf.pasRestants)));
  if (pokemon.surnom !== undefined) {
    const surnom = pokemon.surnom.trim().slice(0, reglages.equipe.surnomMax).trim();
    if (surnom) pokemon.surnom = surnom; else delete pokemon.surnom;
  }
  // Sexe incompatible avec l'espèce (table de sexes corrigée depuis l'écriture de la partie) : remis à celui de l'espèce.
  const sexe = sexeEspece(pokemon.numero);
  if (sexe !== 'aleatoire') pokemon.sexe = sexe;
  else if (pokemon.sexe === 'sansSexe') pokemon.sexe = 'male';
}
export function validerDonneesCompte(v: unknown): asserts v is DonneesCompte {
  formeSouple(v, { diamants: reel, succes: textes, skins: textes,
    // Préférences lues avec indulgence : une option illisible retombe sur sa valeur par défaut, jamais sur un compte refusé.
    preferences: p => formeSouple(p, {}, { sombre: booleen, sonActive: booleen, autoAttaque: booleen, autoClicLie: booleen, evolutionAuto: booleen, passerEclosions: booleen, relacherDoublons: booleen, notifications: booleen,
      balleChoisie: b => { if (typeof b === 'string') chaine(b); },
      arretAuto: a => formeSouple(a, { actif: booleen, commun: booleen, peuCommun: booleen, rare: booleen,
        tresRare: booleen, legendaire: booleen, shiny: booleen, nouveau: booleen }) }, true) });
  entierPositif(v as Record<string, unknown>, 'diamants');
  bornerIdentifiants(v as Record<string, unknown>);
}
export function validerDonneesPartie(v: unknown): asserts v is DonneesPartie {
  formeSouple(v, { nom: texte, regionCourante: texte, regionsDebloquees: textes,
    pokedexNational: liste(reel), vus: liste(reel), pcGlobal: liste(validerPokemonPossede), drapeaux: textes,
    statistiques: s => formeSouple(s, { victoires: reel, argentTotalGagne: reel }, { tempsJeuMs: reel }, true) });
  const partie = v as DonneesPartie;
  // Nom hors bornes : coupé ou remplacé, la partie reste ouvrable.
  partie.nom = partie.nom.trim().slice(0, NOM_PARTIE_MAX).trim() || 'Ma partie';
  const entiersDuCatalogue = (nombres: number[]) => nombres.filter(n => Number.isSafeInteger(n) && n >= 1);
  partie.pokedexNational = entiersDuCatalogue(partie.pokedexNational);
  partie.vus = entiersDuCatalogue(partie.vus);
  bornerIdentifiants(v as Record<string, unknown>, { regionsDebloquees: regions.length, pokedexNational: cataloguePokemon(), vus: cataloguePokemon() });
  // Régions : seules les connues restent, la région de départ reste toujours, la région courante est toujours débloquée.
  partie.regionsDebloquees = [...new Set([monde.region, ...partie.regionsDebloquees.filter(id => regions.includes(id))])];
  if (!partie.regionsDebloquees.includes(partie.regionCourante)) partie.regionCourante = monde.region;
  uniques(partie.pcGlobal);
  entierPositif(partie.statistiques as Record<string, unknown>, 'victoires');
  entierPositif(partie.statistiques as Record<string, unknown>, 'argentTotalGagne');
  entierPositif(partie.statistiques as Record<string, unknown>, 'tempsJeuMs');
}
const CARTE_BLACKJACK = /^(A|[2-9]|10|J|Q|K)-[SHDC]$/;
const carteBlackjack: Validateur = c => {
  chaine(c);
  exiger(CARTE_BLACKJACK.test(c), 'Carte blackjack invalide');
};
/** Une carte apparaît au plus une fois par paquet du sabot, et le sabot n'a jamais plus de cartes que ses paquets. */
function compterCartes(cartes: readonly string[]): void {
  const total = donneesCasino.blackjack.paquets;
  exiger(cartes.length <= total * 52, 'Sabot blackjack invalide : trop de cartes');
  const compte = new Map<string, number>();
  for (const carte of cartes) {
    const n = (compte.get(carte) ?? 0) + 1;
    exiger(n <= total, 'Sabot blackjack invalide : carte en trop');
    compte.set(carte, n);
  }
}
function validerSabot(s: unknown): void {
  liste(carteBlackjack)(s);
  compterCartes(s as string[]);
}
/** Ancien format (un paquet de 52 par main, sans carte cachée), encore lisible, ou main du sabot de plusieurs paquets. */
function validerBlackjackEnCours(b: unknown): void {
  const cartes = liste(carteBlackjack);
  if (b !== null && typeof b === 'object' && Object.hasOwn(b, 'joueur')) {
    formeSouple(b, { mise: positif, paquet: cartes, joueur: cartes, croupier: cartes });
    const main = b as MainBlackjackAncienne;
    const toutes = [...main.paquet, ...main.joueur, ...main.croupier];
    exiger(toutes.length === 52 && new Set(toutes).size === 52, 'Paquet blackjack invalide');
    exiger(main.joueur.length >= 2 && main.croupier.length >= 1, 'Main blackjack invalide');
    return;
  }
  formeSouple(b, {
    phase: p => exiger(p === 'assurance' || p === 'jeu', 'Phase blackjack invalide'),
    mains: liste(m => formeSouple(m, { cartes, mise: positif, separee: booleen, doublee: booleen,
      statut: s => exiger(s === 'en-cours' || s === 'reste' || s === 'depasse' || s === 'abandon', 'Statut blackjack invalide') })),
    active: entier, croupier: cartes, assurance: entier,
  });
  const main = b as MainBlackjack;
  exiger(main.mains.length >= 1 && main.mains.length <= donneesCasino.blackjack.maxMains, 'Mains blackjack invalides');
  exiger(main.active < main.mains.length, 'Main active invalide');
  exiger(main.mains.every(m => m.cartes.length >= 1), 'Main blackjack invalide');
  exiger(main.croupier.length >= 2, 'Croupier blackjack invalide');
  exiger(main.phase === 'assurance' || main.mains[main.active]!.statut === 'en-cours', 'Main active terminée');
  exiger(main.phase === 'jeu' || (main.mains.length === 1 && main.mains[0]!.cartes.length === 2 && main.assurance === 0),
    'Assurance blackjack invalide');
  compterCartes([...main.mains.flatMap(m => m.cartes), ...main.croupier]);
}
/** Le suivi est facultatif : chaque sous-champ illisible retrouve sa valeur vide. */
export function validerSuivi(v: unknown): void {
  objet(v);
  const vide = suiviVide();
  const compteur: Validateur = reel;
  const compteurs = (cles: readonly string[]): Validateur => valeur => {
    formeSouple(valeur, {}, Object.fromEntries(cles.map(cle => [cle, compteur])), true);
    for (const cle of Object.keys(valeur as Record<string, unknown>)) entierPositif(valeur as Record<string, unknown>, cle);
  };
  const dictionnaire = (valider: Validateur, garder: (cle: string) => boolean, max: number): Validateur => valeur => {
    objet(valeur);
    for (const cle of Object.keys(valeur)) {
      if (!garder(cle)) { delete valeur[cle]; continue; }
      try { valider(valeur[cle]); } catch { delete valeur[cle]; }
    }
    for (const cle of Object.keys(valeur).sort().slice(0, Math.max(0, Object.keys(valeur).length - max))) delete valeur[cle];
  };
  const equipe: Validateur = valeur => {
    exiger(Array.isArray(valeur), 'Équipe attendue');
    const uids = valeur.filter(uid => { try { identifiant(uid); return true; } catch { return false; } });
    valeur.splice(0, valeur.length, ...[...new Set(uids)].slice(0, 6));
  };
  const records: Validateur = valeur => {
    formeSouple(valeur, {}, { ...Object.fromEntries(Object.keys(vide.records).map(cle => [cle, compteur])),
      tempsBossMinMs: n => { if (n !== null) reel(n); } }, true);
    const r = valeur as Record<string, unknown>;
    for (const cle of Object.keys(r)) {
      // Le DPS garde la précision au dixième prévue par noterDps.
      if (cle === 'dpsMax') r[cle] = Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.round((r[cle] as number) * 10) / 10));
      else if (cle === 'mannequinDpsMax') r[cle] = Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, r[cle] as number));
      else if (r[cle] !== null) entierPositif(r, cle);
    }
  };
  formeSouple(v, {}, {
    ...Object.fromEntries(['captures', 'capturesShiny', 'evolutions', 'oeufsEclos', 'bossVaincus', 'serieVictoires'].map(cle => [cle, compteur])),
    depenses: compteurs(CATEGORIES_DEPENSE), jetons: compteurs(['gagnes', 'perdus']), records,
    casino: dictionnaire(compteurs(['parties', 'meilleurGain', 'meilleureSerie', 'serieActuelle']), cle => JEUX_SUIVIS.some(jeu => jeu === cle), JEUX_SUIVIS.length),
    rencontres: dictionnaire(compteurs(['vus', 'captures', 'depuisShiny']), cle => /^[1-9]\d*$/.test(cle) && Number(cle) <= cataloguePokemon(), cataloguePokemon()),
    argentJours: valeur => {
      dictionnaire(reel, cle => /^\d{4}-\d{2}-\d{2}$/.test(cle), 7)(valeur);
      for (const cle of Object.keys(valeur as Record<string, unknown>)) entierPositif(valeur as Record<string, unknown>, cle);
    },
    fenetreCaptures: valeur => {
      if (valeur === null) return;
      formeSouple(valeur, { debutMs: reel, n: reel });
      for (const cle of ['debutMs', 'n']) entierPositif(valeur as Record<string, unknown>, cle);
    },
    equipes: valeur => {
      exiger(Array.isArray(valeur), 'Équipes attendues');
      const places = Array.from({ length: 3 }, (_, i) => {
        try { equipe(valeur[i]); return valeur[i].length ? valeur[i] : null; } catch { return null; }
      });
      valeur.splice(0, valeur.length, ...places);
    },
    hall: valeur => {
      exiger(Array.isArray(valeur), 'Hall attendu');
      const entrees = valeur.filter(entree => {
        try {
          formeSouple(entree, { date: date => {
            chaine(date);
            exiger(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(date) && Number.isFinite(Date.parse(date)), 'Date UTC attendue');
          }, tempsJeuMs: reel, equipe: liste(p => {
            formeSouple(p, { numero: positif, niveau: reel, shiny: booleen }, { surnom: nom => chaineBornee(nom, 1, 200) }, true);
            const pokemon = p as Record<string, unknown>;
            exiger((pokemon.numero as number) <= cataloguePokemon(), 'Espèce inconnue');
            entierPositif(pokemon, 'niveau');
          }) });
          entierPositif(entree, 'tempsJeuMs');
          entree.equipe = entree.equipe.slice(0, 6);
          return true;
        } catch { return false; }
      }).slice(0, 50);
      valeur.splice(0, valeur.length, ...entrees);
    },
    titre: valeur => chaineBornee(valeur, 0, 40),
    chaine: valeur => {
      formeSouple(valeur, { numero: reel, longueur: reel });
      for (const cle of ['numero', 'longueur']) entierPositif(valeur as Record<string, unknown>, cle);
    },
  }, true);
  for (const cle of ['captures', 'capturesShiny', 'evolutions', 'oeufsEclos', 'bossVaincus', 'serieVictoires']) entierPositif(v, cle);
  const fusion = { ...vide, ...v, records: { ...vide.records, ...v.records as object }, jetons: { ...vide.jetons, ...v.jetons as object } };
  for (const stats of Object.values(fusion.casino)) Object.assign(stats, Object.assign({ parties: 0, meilleurGain: 0, meilleureSerie: 0, serieActuelle: 0 }, stats));
  for (const rencontre of Object.values(fusion.rencontres)) Object.assign(rencontre, Object.assign({ vus: 0, captures: 0, depuisShiny: 0 }, rencontre));
  Object.assign(v, fusion);
}

export function validerDonneesRegion(v: unknown): asserts v is DonneesRegion {
  formeSouple(v, { regionId: identifiant, zoneId: texte, etape: reel, equipe: liste(validerPokemonPossede),
    badges: textes, bossVaincus: textes, objetsCles: textes, quetes: textes, drapeaux: textes,
    evenementsJoues: textes, argent: reel, ligueGagnee: reel,
    inventaire: i => { objet(i); Object.values(i).forEach(reel); },
    pc: liste(validerPokemonPossede), ameliorations: textes, jalonsRecus: liste(reel),
    starterId: s => { if (s !== null) positif(s); },
    statistiques: s => formeSouple(s, { eliminations: reel, argentTotalGagne: reel }),
    chronos: c => formeSouple(c, { finRepousse: reel, finSuperRepousse: reel, finBoostAttaque: reel,
      finBoostAttaqueSpeciale: reel, rechargeFauchage: reel }),
    pension: p => formeSouple(p, { parents: liste(validerPokemonPossede), oeufs: liste(validerPokemonPossede), emplacementsOeuf: reel }),
    jetons: reel,
    arretAuto: a => formeSouple(a, { commun: booleen, peuCommun: booleen, rare: booleen, tresRare: booleen,
      legendaire: booleen, shiny: booleen, nouveau: booleen }) }, {
    diplomeLe: dateUtc,
    annoncesVues: textes,
    tutosVus,
    casinoVu: booleen,
    pensionVue: booleen,
    zonesAtteintes: textes,
    suivi: validerSuivi,
    evenementEnCours: e => formeSouple(e, { id: identifiant,
      etape: i => { entier(i); exiger((i as number) >= 0, 'Étape invalide'); },
      file: liste(identifiant) }),
    blackjackEnCours: validerBlackjackEnCours,
    sabotBlackjack: s => validerSabot(s),
    especesShiny: liste(reel),
    especesEclosesShiny: liste(reel),
    especesEcloses: liste(reel),
    plusOuMoinsCarte: c => { entier(c); exiger((c as number) >= 1 && (c as number) <= donneesJeuxCasino.plusOuMoins.rangs, 'Carte du plus ou moins invalide'); },
  }, true);
  const region = v as DonneesRegion;
  exiger(regions.includes(region.regionId), 'Région inconnue');
  // Starter inconnu des trois de départ (ancienne version, partie de test) : conservé, il n'y a rien à réparer.
  for (const cle of ['etape', 'ligueGagnee', 'jetons']) entierPositif(region as unknown as Record<string, unknown>, cle);
  for (const cle of Object.keys(region.chronos)) entierPositif(region.chronos as Record<string, unknown>, cle);
  entierPositif(region.statistiques as Record<string, unknown>, 'eliminations');
  entierPositif(region.statistiques as Record<string, unknown>, 'argentTotalGagne');
  region.argent = Math.max(0, region.argent);
  // Inventaire : une entrée illisible (nom hors normes) est écartée, les quantités deviennent des entiers positifs.
  region.inventaire = Object.fromEntries(Object.entries(region.inventaire).slice(0, LISTE_MAX).filter(([cle]) => {
    try { identifiant(cle); return true; } catch { return false; }
  }).map(([cle, quantite]) => [cle, Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(quantite)))]));
  // Pension : au plus deux parents, des œufs en cours seulement, pas plus d'œufs que d'emplacements. Ce qui dépasse
  // retourne au PC : un Pokémon n'est jamais perdu pour mettre la pension en règle.
  const pension = region.pension;
  entierPositif(pension as unknown as Record<string, unknown>, 'emplacementsOeuf', reglages.pension.emplacementsMax);
  const sansEtatDOeuf = pension.oeufs.filter(o => o.oeuf === undefined);
  pension.oeufs = pension.oeufs.filter(o => o.oeuf !== undefined);
  region.pc.push(...sansEtatDOeuf, ...pension.parents.splice(2));
  pension.emplacementsOeuf = Math.min(reglages.pension.emplacementsMax, Math.max(1, pension.emplacementsOeuf, pension.oeufs.length));
  region.pc.push(...pension.oeufs.splice(pension.emplacementsOeuf));
  for (const cle of ['especesShiny', 'especesEclosesShiny', 'especesEcloses']) reparerEspeces(region as unknown as Record<string, unknown>, cle);
  if (region.tutosVus) region.tutosVus = region.tutosVus.filter(t => t.length <= 40);
  // Seule la région jouable (Kanto) a ses zones chargées : les régions verrouillées ne sont pas réparées.
  if (region.regionId === monde.region) {
    // Lieux (`kanto.labo`) et zones d'événement (`evenement:…`) sont des zones valides qui ne sont pas dans `monde.zones`.
    const speciale = region.zoneId.startsWith('evenement:') || monde.lieux.some(l => `${monde.region}.${l.lieu}` === region.zoneId);
    const zone = monde.zones.find(z => z.id === region.zoneId);
    if (!zone && !speciale) {
      region.zoneId = monde.depart;
      region.etape = Math.max(1, Math.min(region.etape, monde.zones.find(z => z.id === monde.depart)?.etapes ?? 1));
    } else if (zone) region.etape = Math.max(1, Math.min(region.etape, zone.etapes ?? 1));
  }
  bornerIdentifiants(v as Record<string, unknown>, {
    badges: badges.length, bossVaincus: monde.zones.length,
    objetsCles: objetsCles.objets.length, ameliorations: objets.filter(o => o.type === 'amelioration').length,
    evenementsJoues: evenements.length, jalonsRecus: jalons.paliers.length,
    // Zones + lieux : le Centre commercial (un lieu, pas une zone) y est noté dès la première visite.
    zonesAtteintes: monde.zones.length + monde.lieux.length,
    especesShiny: reglages.pension.especesTirees, especesEcloses: reglages.pension.especesTirees,
    especesEclosesShiny: reglages.pension.especesTirees, tutosVus: 64,
  });
  uniques([...region.equipe, ...region.pc, ...region.pension.parents, ...region.pension.oeufs]);
  const courant = region.evenementEnCours;
  // Le catalogue d'événements est injecté par le store : la validation ne juge que ce qui n'en dépend pas.
  // Un événement ou une étape inconnus sont déjà abandonnés par le moteur (`avancer`, `commandeCourante`).
  if (courant) {
    if (region.evenementsJoues.includes(courant.id)) delete region.evenementEnCours;
    else bornerIdentifiants(courant, {});
  }
  region.argent = Math.min(PLAFOND_ARGENT, region.argent);
  region.jetons = Math.min(PLAFOND_JETONS, region.jetons);
  region.argent = Math.floor(region.argent);
  region.statistiques.argentTotalGagne = Math.floor(region.statistiques.argentTotalGagne);
}
export function dateUtc(v: unknown): void {
  chaine(v);
  exiger(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(v)
    && Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v.replace(/Z$/, v.includes('.') ? 'Z' : '.000Z'),
  'Date UTC invalide');
}
export function validerEnveloppe(v: unknown, niveau: Niveau): Enveloppe<unknown> {
  formeSouple(v, { version: entier, niveau: chaine, id: identifiant, revision: positif,
    ecritLe: dateUtc, donnees: () => {} });
  const enveloppe = v as Enveloppe<unknown>;
  exiger(enveloppe.revision < Number.MAX_SAFE_INTEGER, 'Révision trop élevée');
  exiger(enveloppe.niveau === niveau, 'Niveau inattendu');
  const resultat = migrer(enveloppe);
  const validateurs = { compte: validerDonneesCompte, partie: validerDonneesPartie, region: validerDonneesRegion };
  validateurs[niveau](resultat.donnees);
  return resultat;
}
