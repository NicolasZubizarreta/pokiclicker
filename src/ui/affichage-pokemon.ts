import { chargerPokemon } from '../core/pokemon';
import type { PokemonPossede } from '../core/sauvegarde';
import { apparenceSprite } from './easter-eggs';

const catalogue = chargerPokemon();

export const nomAffiche = (pokemon: PokemonPossede): string => pokemon.oeuf
  ? 'Œuf' : pokemon.surnom ?? catalogue.parNumero(pokemon.numero).nom;

export const spriteAffiche = (pokemon: PokemonPossede): string => apparenceSprite(pokemon).src;

/** Classes de l'easter egg du surnom (retourné, arc-en-ciel, caca), à poser sur chaque image du Pokémon. */
export const classeSprite = (pokemon: PokemonPossede): string => apparenceSprite(pokemon).classe;

export const progressionOeuf = (oeuf: NonNullable<PokemonPossede['oeuf']>): string =>
  `Éclosion : ${oeuf.pasMax - oeuf.pasRestants}/${oeuf.pasMax}`;
