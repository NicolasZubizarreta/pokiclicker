import type { PokemonPossede } from '../core/sauvegarde';

// Sexe provisoire, remplacé par le ticket P.
export function equipeDeDepart(): PokemonPossede[] {
  return [1, 4, 7].map((numero) => ({ uid: `depart-${numero}`, numero, niveau: 5,
    xp: 0, shiny: false, bonheur: 0, pierreEternelle: false, calcium: 0, sexe: 'male', favori: false }));
}
