import { chargerPokemon } from '../core/pokemon';
import type { PokemonPossede } from '../core/sauvegarde';
import { apparenceSprite } from './easter-eggs';

const catalogue = chargerPokemon();

export const nomAffiche = (pokemon: PokemonPossede): string => pokemon.oeuf
  ? 'Œuf' : pokemon.surnom ?? catalogue.parNumero(pokemon.numero).nom;

export const spriteAffiche = (pokemon: PokemonPossede): string => apparenceSprite(pokemon).src;

/** Classes de l'easter egg du surnom, à poser sur chaque image du Pokémon. */
export const classeSprite = (pokemon: PokemonPossede): string => apparenceSprite(pokemon).classe;

/** Vrai quand le surnom remplace le sprite par une image entière (Daran, Gabriel, Bjorn) : pas de lignes vides sous les pieds à compenser. */
export const spriteEstPhoto = (pokemon: PokemonPossede): boolean => apparenceSprite(pokemon).photo;

/** Texte affiché sur la carte d'un œuf : « 22/50 », rien d'autre. */
export const progressionOeuf = (oeuf: NonNullable<PokemonPossede['oeuf']>): string =>
  `${oeuf.pasMax - oeuf.pasRestants}/${oeuf.pasMax}`;

/** Version lue par les lecteurs d'écran : le texte affiché seul ne dit pas de quoi il s'agit. */
export const libelleOeuf = (oeuf: NonNullable<PokemonPossede['oeuf']>): string => `Éclosion : ${progressionOeuf(oeuf)}`;
