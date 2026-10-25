import { ERREUR_VERSION, VERSION_ACTUELLE } from '../sauvegarde-types';
import type { Enveloppe, Niveau } from '../sauvegarde-types';
import { reglages } from '../reglages';
import { sexeEspece } from '../sexe';

export type TableMigrations = Record<number, (donnees: unknown, niveau: Niveau) => unknown>;

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
export const migrationsParDefaut: TableMigrations = { 1: migrerV1versV2, 2: migrerV2versV3 };

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
    resultat = { ...resultat, version: resultat.version + 1, donnees: migration(resultat.donnees, resultat.niveau) };
  }
  return resultat;
}
