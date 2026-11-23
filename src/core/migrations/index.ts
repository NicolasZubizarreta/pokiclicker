import { ERREUR_VERSION, VERSION_ACTUELLE } from '../sauvegarde-types';
import type { Enveloppe, Niveau } from '../sauvegarde-types';
import { lignee } from '../evolution';
import { reglages } from '../reglages';
import { sexeEspece } from '../sexe';

export type TableMigrations = Record<number, (donnees: unknown, niveau: Niveau, ecritLe: string) => unknown>;

export function migrerV1versV2(donnees: unknown, niveau: Niveau): unknown {
  if (niveau === 'compte') return donnees;
  const source = donnees as Record<string, unknown>;
  const completer = (valeur: unknown) => {
    // Une donnée mal formée traverse telle quelle : c'est la validation qui la refuse, avec son message.
    if (valeur === null || typeof valeur !== 'object' || typeof (valeur as { uid?: unknown }).uid !== 'string') return valeur;
    const pokemon = valeur as Record<string, unknown>;
    // La parité de la somme des codes UTF-16 de l'uid fixe le sexe sans hasard ni horloge.
    const somme = (pokemon.uid as string).split('').reduce((total, lettre) => total + lettre.charCodeAt(0), 0);
    return { ...pokemon, sexe: somme % 2 === 0 ? 'male' : 'femelle', favori: false };
  };
  const completerListe = (liste: unknown) => (Array.isArray(liste) ? liste.map(completer) : liste);
  if (niveau === 'partie') return { ...source, pcGlobal: completerListe(source.pcGlobal) };
  return { ...structuredClone(reglages.depart.region), ...source, equipe: completerListe(source.equipe) };
}
export function migrerV2versV3(donnees: unknown, niveau: Niveau): unknown {
  if (niveau === 'compte' || donnees === null || typeof donnees !== 'object') return donnees;
  const source = donnees as Record<string, unknown>;
  const corrigerListe = (liste: unknown) => Array.isArray(liste) ? liste.map(valeur => {
    if (valeur === null || typeof valeur !== 'object') return valeur;
    const pokemon = valeur as Record<string, unknown>;
    // Les numéros inconnus restent à la charge de la validation.
    let sexe;
    try { sexe = sexeEspece(pokemon.numero as number); } catch { return valeur; }
    return sexe === 'aleatoire' ? valeur : { ...pokemon, sexe };
  }) : liste;
  if (niveau === 'partie') return { ...source, pcGlobal: corrigerListe(source.pcGlobal) };
  const pension = source.pension;
  return { ...source, equipe: corrigerListe(source.equipe), pc: corrigerListe(source.pc),
    pension: pension !== null && typeof pension === 'object'
      ? { ...pension, parents: corrigerListe((pension as Record<string, unknown>).parents),
        oeufs: corrigerListe((pension as Record<string, unknown>).oeufs) }
      : pension };
}
export function migrerV3versV4(donnees: unknown, niveau: Niveau): unknown {
  if (niveau !== 'partie' || donnees === null || typeof donnees !== 'object' || Array.isArray(donnees)) return donnees;
  const source = donnees as Record<string, unknown>;
  if (!Array.isArray(source.pokedexNational) || !Array.isArray(source.pcGlobal)) return donnees;
  const vus = [...source.pokedexNational];
  for (const valeur of source.pcGlobal) {
    if (valeur === null || typeof valeur !== 'object') continue;
    const pokemon = valeur as Record<string, unknown>;
    if (pokemon.oeuf === undefined && Number.isInteger(pokemon.numero) && (pokemon.numero as number) >= 1
      && !vus.includes(pokemon.numero)) vus.push(pokemon.numero);
  }
  return { ...source, vus };
}
export function migrerV4versV5(donnees: unknown, niveau: Niveau, ecritLe: string): unknown {
  if (niveau !== 'region' || donnees === null || typeof donnees !== 'object' || Array.isArray(donnees)) return donnees;
  const source = donnees as Record<string, unknown>;
  if (source.chronos === null || typeof source.chronos !== 'object' || Array.isArray(source.chronos)) return donnees;
  const chronos = { ...source.chronos } as Record<string, unknown>;
  const referenceMs = Date.parse(ecritLe);
  for (const cle of ['finRepousse', 'finSuperRepousse', 'finBoostAttaque', 'finBoostAttaqueSpeciale', 'rechargeFauchage']) {
    const fin = chronos[cle];
    // Les valeurs mal formées restent à la charge de la validation.
    if (typeof fin !== 'number' || !Number.isSafeInteger(fin) || fin < 0) continue;
    const restant = Number.isFinite(referenceMs) ? Math.max(0, fin - referenceMs) : 0;
    chronos[cle] = Math.floor(cle === 'rechargeFauchage' ? Math.min(restant, reglages.objetsActifs.rechargeFauchageMs) : restant);
  }
  return { ...source, chronos };
}
export function migrerV5versV6(donnees: unknown): unknown {
  // Le champ suivi reste absent : les sauvegardes existantes démarrent leurs compteurs à zéro.
  // Les données mal formées traversent telles quelles, à la charge de la validation.
  return donnees;
}
export const migrationsParDefaut: TableMigrations = { 1: migrerV1versV2, 2: migrerV2versV3, 3: migrerV3versV4, 4: migrerV4versV5, 5: migrerV5versV6 };

export function migrer(enveloppe: Enveloppe<unknown>, table = migrationsParDefaut): Enveloppe<unknown> {
  if (!Number.isInteger(enveloppe.version) || enveloppe.version < 0) {
    throw new Error('Version invalide');
  }
  if (enveloppe.version > VERSION_ACTUELLE) throw new Error(ERREUR_VERSION);
  let resultat = structuredClone(enveloppe);
  while (resultat.version < VERSION_ACTUELLE) {
    const migration = table[resultat.version];
    if (!migration) {
      throw new Error(`Migration manquante : de la version ${resultat.version} à la version ${resultat.version + 1}.`);
    }
    resultat = { ...resultat, version: resultat.version + 1, donnees: migration(resultat.donnees, resultat.niveau, resultat.ecritLe) };
  }
  if (resultat.niveau === 'region' && resultat.donnees !== null && typeof resultat.donnees === 'object') {
    const source = resultat.donnees as Record<string, unknown>;
    const stats = source.statistiques;
    if (stats === undefined || (stats !== null && typeof stats === 'object' && !Array.isArray(stats))) {
      resultat.donnees = { ...source, statistiques: { eliminations: 0, argentTotalGagne: 0, ...stats } };
    }
  }
  if (resultat.niveau === 'region') resultat.donnees = rattraperEspecesEcloses(resultat.donnees);
  if (resultat.niveau === 'region') resultat.donnees = rattraperDex(resultat.donnees);
  return resultat;
}

/** Rattrapage idempotent : les espèces atteintes par évolution depuis une éclosion entrent dans `especesEcloses`. */
export function rattraperEspecesEcloses(donnees: unknown): unknown {
  if (donnees === null || typeof donnees !== 'object' || Array.isArray(donnees)) return donnees;
  const source = donnees as Record<string, unknown>;
  const pension = source.pension !== null && typeof source.pension === 'object' ? source.pension as Record<string, unknown> : {};
  const marques = [source.equipe, source.pc, pension.parents].flatMap(liste => Array.isArray(liste) ? liste : [])
    .filter(valeur => valeur !== null && typeof valeur === 'object' && (valeur as Record<string, unknown>).marqueEclosion === true
      && Number.isInteger((valeur as Record<string, unknown>).numero) && ((valeur as Record<string, unknown>).numero as number) >= 1);
  if (marques.length === 0) return donnees;
  const connues = Array.isArray(source.especesEcloses) ? source.especesEcloses as unknown[] : [];
  const ajoutees: number[] = [];
  for (const marque of marques) {
    let especes: number[];
    try { especes = lignee((marque as { numero: number }).numero); } catch { continue; }
    for (const espece of especes) if (!connues.includes(espece) && !ajoutees.includes(espece)) ajoutees.push(espece);
  }
  return ajoutees.length === 0 ? donnees : { ...source, especesEcloses: [...connues, ...ajoutees] };
}

/** Rattrape seulement les chromatiques encore possédés ; les œufs attendent leur éclosion. */
export function rattraperDex(donnees: unknown): unknown {
  if (donnees === null || typeof donnees !== 'object' || Array.isArray(donnees)) return donnees;
  const source = donnees as Record<string, unknown>;
  const pension = source.pension !== null && typeof source.pension === 'object' ? source.pension as Record<string, unknown> : {};
  let resultat = source;
  for (const valeur of [source.equipe, source.pc, pension.parents].flatMap(liste => Array.isArray(liste) ? liste : [])) {
    if (valeur === null || typeof valeur !== 'object') continue;
    const pokemon = valeur as Record<string, unknown>;
    if (pokemon.shiny !== true || pokemon.oeuf !== undefined || !Number.isInteger(pokemon.numero)
      || (pokemon.numero as number) < 1 || (pokemon.numero as number) > reglages.pension.especesTirees) continue;
    let numeros: number[];
    try { numeros = pokemon.marqueEclosion === true ? lignee(pokemon.numero as number) : [pokemon.numero as number]; } catch { continue; }
    for (const champ of pokemon.marqueEclosion === true ? ['especesShiny', 'especesEclosesShiny'] : ['especesShiny']) {
      const connues: unknown[] = Array.isArray(resultat[champ]) ? resultat[champ] as unknown[] : [];
      const ajoutees = numeros.filter(numero => !connues.includes(numero));
      if (ajoutees.length) resultat = { ...resultat, [champ]: [...connues, ...ajoutees] };
    }
  }
  return resultat;
}
