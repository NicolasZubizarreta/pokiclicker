import { detailDps } from '../core/equipe';
import type { PokemonPossede } from '../core/sauvegarde';

export function dpsSansType(pokemon: PokemonPossede): number {
  return Object.values(detailDps(pokemon, 1)).reduce((produit, facteur) => produit * facteur, 1);
}
