import { chargerPokemon } from '../core/pokemon';
import type { PokemonPossede } from '../core/sauvegarde';
import { cheminSprite } from './precharger';

const catalogue = chargerPokemon();

export const nomAffiche = (pokemon: PokemonPossede): string => pokemon.oeuf
  ? 'Œuf' : pokemon.surnom ?? catalogue.parNumero(pokemon.numero).nom;

export const spriteAffiche = (pokemon: PokemonPossede): string => pokemon.oeuf
  ? 'img/objets/lucky-egg.png' : cheminSprite(pokemon.numero);

export const progressionOeuf = (oeuf: NonNullable<PokemonPossede['oeuf']>): string =>
  `Éclosion : ${oeuf.pasMax - oeuf.pasRestants}/${oeuf.pasMax}`;
