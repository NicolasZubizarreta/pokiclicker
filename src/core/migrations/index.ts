import { ERREUR_VERSION, VERSION_ACTUELLE } from '../sauvegarde-types';
import type { Enveloppe } from '../sauvegarde-types';

export type TableMigrations = Record<number, (donnees: unknown) => unknown>;
export const migrationsParDefaut: TableMigrations = {};

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
    resultat = { ...resultat, version: resultat.version + 1, donnees: migration(resultat.donnees) };
  }
  return resultat;
}
