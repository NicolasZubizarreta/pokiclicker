import donneesCasino from '../../data/casino.json';
import donneesJeuxCasino from '../../data/casino-jeux.json';
import { migrer } from './migrations';
import { reglages } from './reglages';
import { sexeEspece } from './sexe';
import type { DonneesCompte, DonneesPartie, DonneesRegion, Enveloppe, MainBlackjack, MainBlackjackAncienne, Niveau, PokemonPossede } from './sauvegarde-types';

type Validateur = (valeur: unknown) => void;
export function exiger(condition: unknown, raison: string): asserts condition {
  if (!condition) throw new Error(raison);
}
export function objet(valeur: unknown): asserts valeur is Record<string, unknown> {
  exiger(valeur !== null && typeof valeur === 'object' && !Array.isArray(valeur), 'Objet attendu');
  exiger(Object.getPrototypeOf(valeur) === Object.prototype || Object.getPrototypeOf(valeur) === null,
    'Objet JSON attendu');
}
export function chaine(valeur: unknown): asserts valeur is string {
  exiger(typeof valeur === 'string', 'Texte attendu');
}
export function identifiant(valeur: unknown): asserts valeur is string {
  chaine(valeur);
  exiger(valeur.length > 0 && !valeur.includes(':'), 'Identifiant invalide');
}
const nombre: Validateur = v => exiger(typeof v === 'number' && Number.isFinite(v) && v >= 0, 'Nombre positif ou nul attendu');
const entier: Validateur = v => { nombre(v); exiger(Number.isSafeInteger(v), 'Entier attendu'); };
const positif: Validateur = v => { entier(v); exiger((v as number) > 0, 'Entier strictement positif attendu'); };
const booleen: Validateur = v => exiger(typeof v === 'boolean', 'Booléen attendu');
const liste = (valider: Validateur): Validateur => v => {
  exiger(Array.isArray(v), 'Tableau attendu');
  for (const element of v) valider(element);
};
const textes = liste(chaine);
export function forme(v: unknown, requis: Record<string, Validateur>, facultatifs: Record<string, Validateur> = {}) {
  objet(v);
  exiger(Object.keys(v).every(cle => Object.hasOwn(requis, cle) || Object.hasOwn(facultatifs, cle)), 'Champ inconnu');
  for (const [cle, valider] of Object.entries(requis)) {
    exiger(Object.hasOwn(v, cle), `Champ manquant : ${cle}`);
    valider(v[cle]);
  }
  for (const [cle, valider] of Object.entries(facultatifs)) if (Object.hasOwn(v, cle)) valider(v[cle]);
}
export function validerPokemonPossede(v: unknown): asserts v is PokemonPossede {
  forme(v, { uid: identifiant, numero: positif, niveau: positif, xp: nombre, shiny: booleen,
    bonheur: nombre, pierreEternelle: booleen, calcium: entier, favori: booleen,
    sexe: s => exiger(s === 'male' || s === 'femelle' || s === 'sansSexe', `Sexe invalide : ${String(s)}`) },
  { marqueEclosion: booleen, surnom: s => {
    chaine(s);
    exiger(s.trim().length > 0 && s.trim().length <= reglages.equipe.surnomMax, 'Surnom invalide');
  }, oeuf: o => {
    try {
      forme(o, { pasRestants: entier, pasMax: positif });
      const oeuf = o as NonNullable<PokemonPossede['oeuf']>;
      exiger(oeuf.pasRestants <= oeuf.pasMax, 'les pas restants dépassent le maximum');
    } catch (erreur) {
      throw new Error(`Œuf invalide : ${(erreur as Error).message}`);
    }
  } });
  const pokemon = v as PokemonPossede;
  const sexe = sexeEspece(pokemon.numero);
  exiger(sexe === 'aleatoire' ? pokemon.sexe !== 'sansSexe' : pokemon.sexe === sexe,
    'Sexe incompatible avec l’espèce');
}
export function validerDonneesCompte(v: unknown): asserts v is DonneesCompte {
  forme(v, { diamants: entier, succes: textes, skins: textes,
    preferences: p => forme(p, {}, { sombre: booleen, sonActive: booleen, autoAttaque: booleen, autoClicLie: booleen,
      arretAuto: a => forme(a, { actif: booleen, commun: booleen, peuCommun: booleen, rare: booleen,
        tresRare: booleen, legendaire: booleen, shiny: booleen, nouveau: booleen }) }) });
}
export function validerDonneesPartie(v: unknown): asserts v is DonneesPartie {
  forme(v, { nom: chaine, regionCourante: identifiant, regionsDebloquees: liste(identifiant),
    pokedexNational: liste(positif), vus: liste(positif), pcGlobal: liste(validerPokemonPossede), drapeaux: textes,
    statistiques: s => forme(s, { victoires: entier, argentTotalGagne: nombre }, { tempsJeuMs: entier }) });
  const partie = v as DonneesPartie;
  exiger(partie.regionsDebloquees.includes(partie.regionCourante), 'Région courante non débloquée');
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
    forme(b, { mise: positif, paquet: cartes, joueur: cartes, croupier: cartes });
    const main = b as MainBlackjackAncienne;
    const toutes = [...main.paquet, ...main.joueur, ...main.croupier];
    exiger(toutes.length === 52 && new Set(toutes).size === 52, 'Paquet blackjack invalide');
    exiger(main.joueur.length >= 2 && main.croupier.length >= 1, 'Main blackjack invalide');
    return;
  }
  forme(b, {
    phase: p => exiger(p === 'assurance' || p === 'jeu', 'Phase blackjack invalide'),
    mains: liste(m => forme(m, { cartes, mise: positif, separee: booleen, doublee: booleen,
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
export function validerDonneesRegion(v: unknown): asserts v is DonneesRegion {
  forme(v, { regionId: identifiant, zoneId: chaine, etape: positif, equipe: liste(validerPokemonPossede),
    badges: textes, bossVaincus: textes, objetsCles: textes, quetes: textes, drapeaux: textes,
    evenementsJoues: textes, argent: nombre, ligueGagnee: entier,
    inventaire: i => { objet(i); Object.values(i).forEach(entier); },
    pc: liste(validerPokemonPossede), ameliorations: textes, jalonsRecus: liste(positif),
    starterId: s => { if (s !== null) positif(s); },
    statistiques: s => forme(s, { eliminations: entier, argentTotalGagne: nombre }),
    chronos: c => forme(c, { finRepousse: entier, finSuperRepousse: entier, finBoostAttaque: entier,
      finBoostAttaqueSpeciale: entier, rechargeFauchage: entier }),
    pension: p => {
      forme(p, { parents: liste(validerPokemonPossede), oeufs: liste(o => {
        validerPokemonPossede(o);
        exiger(o.oeuf !== undefined, 'Œuf invalide : état d’œuf manquant dans la pension');
      }), emplacementsOeuf: positif });
      exiger((p as DonneesRegion['pension']).parents.length <= 2, 'Pension invalide : au plus deux parents');
      const pension = p as DonneesRegion['pension'];
      exiger(pension.emplacementsOeuf <= reglages.pension.emplacementsMax, 'Pension invalide : trop d’emplacements');
      exiger(pension.oeufs.length <= pension.emplacementsOeuf, 'Pension invalide : trop d’œufs');
    },
    jetons: entier,
    arretAuto: a => forme(a, { commun: booleen, peuCommun: booleen, rare: booleen, tresRare: booleen,
      legendaire: booleen, shiny: booleen, nouveau: booleen }) }, {
    diplomeLe: dateUtc,
    annoncesVues: textes,
    casinoVu: booleen,
    pensionVue: booleen,
    evenementEnCours: e => forme(e, { id: identifiant,
      etape: i => { entier(i); exiger((i as number) >= 0, 'Étape invalide'); },
      file: liste(identifiant) }),
    blackjackEnCours: validerBlackjackEnCours,
    sabotBlackjack: s => validerSabot(s),
    especesEcloses: e => {
      liste(positif)(e);
      const especes = e as number[];
      exiger(new Set(especes).size === especes.length, 'Espèces écloses : doublon');
      exiger(especes.every(n => n <= reglages.pension.especesTirees), 'Espèces écloses : numéro inconnu');
    },
    plusOuMoinsCarte: c => { entier(c); exiger((c as number) >= 1 && (c as number) <= donneesJeuxCasino.plusOuMoins.rangs, 'Carte du plus ou moins invalide'); },
  });
}
export function dateUtc(v: unknown): void {
  chaine(v);
  exiger(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(v)
    && Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v.replace(/Z$/, v.includes('.') ? 'Z' : '.000Z'),
  'Date UTC invalide');
}
export function validerEnveloppe(v: unknown, niveau: Niveau): Enveloppe<unknown> {
  forme(v, { version: entier, niveau: chaine, id: identifiant, revision: positif,
    ecritLe: dateUtc, donnees: () => {} });
  const enveloppe = v as Enveloppe<unknown>;
  exiger(enveloppe.niveau === niveau, 'Niveau inattendu');
  const resultat = migrer(enveloppe);
  const validateurs = { compte: validerDonneesCompte, partie: validerDonneesPartie, region: validerDonneesRegion };
  validateurs[niveau](resultat.donnees);
  return resultat;
}
