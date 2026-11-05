import { effetDe, photosDe, stadeEvolution } from '../core/easter-eggs';
import type { PokemonPossede } from '../core/sauvegarde';
import { cheminSprite } from './precharger';

const classes = {
  retourne: 'ee-retourne',
  'arc-en-ciel': 'ee-arc-en-ciel motion-safe:ee-arc-en-ciel-anime',
  caca: 'ee-caca',
};

export function apparenceSprite(pokemon: PokemonPossede): { src: string; classe: string; photo: boolean } {
  if (pokemon.oeuf) return { src: 'img/objets/lucky-egg.png', classe: '', photo: false };
  const effet = effetDe(pokemon.surnom);
  const photos = photosDe(pokemon.surnom);
  if (photos) return { src: photos[stadeEvolution(pokemon.numero) - 1]!, classe: '', photo: true };
  return { src: cheminSprite(pokemon.numero, pokemon.shiny), classe: effet && effet !== 'photo' ? classes[effet] : '', photo: false };
}
