import { chargerPokemon } from '../core/pokemon';
import type { PokemonPossede } from '../core/sauvegarde';
import { apparenceSprite } from './easter-eggs';

const catalogue = chargerPokemon();

export const nomAffiche = (pokemon: PokemonPossede): string => pokemon.oeuf
  ? 'Œuf' : pokemon.surnom ?? catalogue.parNumero(pokemon.numero).nom;

export const spriteAffiche = (pokemon: PokemonPossede): string => apparenceSprite(pokemon).src;

/** Classes de l'easter egg du surnom (retourné, arc-en-ciel, caca), à poser sur chaque image du Pokémon. */
export const classeSprite = (pokemon: PokemonPossede): string => apparenceSprite(pokemon).classe;

/** Vrai quand le surnom remplace le sprite par une image entière (Daran, Gabriel, Bjorn) : pas de lignes vides sous les pieds à compenser. */
export const spriteEstPhoto = (pokemon: PokemonPossede): boolean => apparenceSprite(pokemon).photo;

export const progressionOeuf = (oeuf: NonNullable<PokemonPossede['oeuf']>): string =>
  `Éclosion : ${oeuf.pasMax - oeuf.pasRestants}/${oeuf.pasMax}`;
