import { chargerPokemon } from '../core/pokemon';
import type { PokemonPossede } from '../core/sauvegarde';
import { apparenceSprite } from './easter-eggs';

const catalogue = chargerPokemon();

export const nomAffiche = (pokemon: PokemonPossede): string => pokemon.oeuf
  ? 'Œuf' : pokemon.surnom ?? catalogue.parNumero(pokemon.numero).nom;

export const spriteAffiche = (pokemon: PokemonPossede): string => apparenceSprite(pokemon).src;

export const progressionOeuf = (oeuf: NonNullable<PokemonPossede['oeuf']>): string =>
  `Éclosion : ${oeuf.pasMax - oeuf.pasRestants}/${oeuf.pasMax}`;
