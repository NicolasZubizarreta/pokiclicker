import { evolutionDisponible } from '../core/evolution';
import { nomAffiche } from './affichage-pokemon';

type PokemonPossede = Parameters<typeof evolutionDisponible>[0];

export function annonceEvolution(equipe: PokemonPossede[], vues: string[]): { id: string; texte: string } | null {
  const pokemon = equipe.find(pokemon => evolutionDisponible(pokemon) !== null
    && !vues.includes(`evolution:${pokemon.uid}:${pokemon.numero}`));
  return pokemon ? { id: `evolution:${pokemon.uid}:${pokemon.numero}`, texte: `${nomAffiche(pokemon)} peut évoluer !` } : null;
}

export type EvolutionAffichee = { uid: string; ancien: number; nouveau: number };

export function afficherEvolution(evolution: EvolutionAffichee | null, finMs: number,
  tempsJeuMs: number): EvolutionAffichee | null {
  return tempsJeuMs < finMs ? evolution : null;
}
