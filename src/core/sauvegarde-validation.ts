import { migrer } from './migrations';
import type { DonneesCompte, DonneesPartie, DonneesRegion, Enveloppe, Niveau, PokemonPossede } from './sauvegarde-types';

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
function forme(v: unknown, requis: Record<string, Validateur>, facultatifs: Record<string, Validateur> = {}) {
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
    bonheur: nombre, pierreEternelle: booleen, calcium: entier }, { surnom: chaine });
}
export function validerDonneesCompte(v: unknown): asserts v is DonneesCompte {
  forme(v, { diamants: nombre, succes: textes, skins: textes,
    preferences: p => forme(p, {}, { sombre: booleen, sonActive: booleen }) });
}
export function validerDonneesPartie(v: unknown): asserts v is DonneesPartie {
  forme(v, { nom: chaine, regionCourante: identifiant, regionsDebloquees: liste(identifiant),
    pokedexNational: liste(positif), pcGlobal: liste(validerPokemonPossede), drapeaux: textes,
    statistiques: s => forme(s, { victoires: entier, argentTotalGagne: nombre }) });
  const partie = v as DonneesPartie;
  exiger(partie.regionsDebloquees.includes(partie.regionCourante), 'Région courante non débloquée');
}
export function validerDonneesRegion(v: unknown): asserts v is DonneesRegion {
  forme(v, { regionId: identifiant, zoneId: chaine, etape: positif, equipe: liste(validerPokemonPossede),
    badges: textes, bossVaincus: textes, objetsCles: textes, quetes: textes, drapeaux: textes,
    evenementsJoues: textes, argent: nombre, ligueGagnee: entier,
    inventaire: i => { objet(i); Object.values(i).forEach(entier); } });
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
