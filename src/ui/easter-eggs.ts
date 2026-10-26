import donnees from '../../data/easter-eggs.json';
import { effetDe, stadeEvolution } from '../core/easter-eggs';
import type { PokemonPossede } from '../core/sauvegarde';
import { cheminSprite } from './precharger';

const photos = donnees.effets.find(({ effet }) => effet === 'photo')!.assets;
const classes = {
  retourne: 'ee-retourne',
  'arc-en-ciel': 'ee-arc-en-ciel motion-safe:ee-arc-en-ciel-anime',
  caca: 'ee-caca',
};

export function apparenceSprite(pokemon: PokemonPossede): { src: string; classe: string; photo: boolean } {
  if (pokemon.oeuf) return { src: 'img/objets/lucky-egg.png', classe: '', photo: false };
  const effet = effetDe(pokemon.surnom);
  if (effet === 'photo') {
    return { src: photos[stadeEvolution(pokemon.numero) - 1]!, classe: '', photo: true };
  }
  return { src: cheminSprite(pokemon.numero), classe: effet ? classes[effet] : '', photo: false };
}
