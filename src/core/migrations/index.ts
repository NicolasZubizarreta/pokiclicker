import { ERREUR_VERSION, VERSION_ACTUELLE } from '../sauvegarde-types';
import type { Enveloppe, Niveau } from '../sauvegarde-types';
import { reglages } from '../reglages';

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
export const migrationsParDefaut: TableMigrations = { 1: migrerV1versV2 };

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
