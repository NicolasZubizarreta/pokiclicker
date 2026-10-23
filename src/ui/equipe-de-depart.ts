import type { PokemonPossede } from '../core/sauvegarde';

// Équipe provisoire, en attendant le choix du partenaire et les captures.
export function equipeDeDepart(): PokemonPossede[] {
  return [1, 4, 7].map((numero) => ({ uid: `depart-${numero}`, numero, niveau: 5,
    xp: 0, shiny: false, bonheur: 0, pierreEternelle: false, calcium: 0 }));
}
