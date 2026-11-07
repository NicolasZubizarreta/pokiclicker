import { cibleValidePierre, evolutionDisponible, evolutionParPierre } from '../core/evolution';
import type { AffichageSac } from './store-boutique';

export function evolutionProposee(pokemon: Parameters<typeof cibleValidePierre>[0], entrees: AffichageSac['entrees']) {
  if (pokemon.oeuf || pokemon.pierreEternelle) return null;
  const niveau = evolutionDisponible(pokemon);
  const pierre = niveau === null ? pierreProposee(pokemon, entrees) : null;
  const vers = niveau ?? (pierre ? evolutionParPierre(pokemon.numero, pierre.id) : null);
  return vers === null ? null : { vers, pierre };
}

export function pierreProposee(pokemon: Parameters<typeof cibleValidePierre>[0], entrees: AffichageSac['entrees']): {
  id: string; nom: string; image: string | null;
} | null {
  const pierre = entrees.find(entree => entree.utilisable === 'pierre' && entree.quantite > 0
    && cibleValidePierre(pokemon, entree.id));
  return pierre ? { id: pierre.id, nom: pierre.nom, image: pierre.image } : null;
}
