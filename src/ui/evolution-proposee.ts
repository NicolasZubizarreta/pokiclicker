import { cibleValidePierre } from '../core/evolution';
import type { AffichageSac } from './store-boutique';

export function pierreProposee(pokemon: Parameters<typeof cibleValidePierre>[0], entrees: AffichageSac['entrees']): {
  id: string; nom: string; image: string;
} | null {
  const pierre = entrees.find(entree => entree.utilisable === 'pierre' && entree.quantite > 0
    && cibleValidePierre(pokemon, entree.id));
  return pierre ? { id: pierre.id, nom: pierre.nom, image: pierre.image } : null;
}
