import type { PokemonPossede } from '../core/sauvegarde';
import './RepereMarque.css';

export function RepereMarque() {
  return <span className="repere-marque" role="img" aria-label="Marque d'éclosion" title="Marque d'éclosion">
    <svg viewBox="0 0 30 30" aria-hidden="true" focusable="false"><path d="M24 18c0 7-4 10-9 10S6 25 6 18 11 2 15 2s9 9 9 16Z" /><path d="m15 3-2 5 3 3-4 4 3 4-2 5m3-13 5 1m-9 3-4-1" /></svg>
  </span>;
}

/** Tag shiny, de la même taille que le repère d'éclosion. */
export function RepereShiny({ decoratif = false }: { decoratif?: boolean }) {
  return <span className="repere-marque repere-shiny" {...(decoratif ? { 'aria-hidden': true } : { role: 'img', 'aria-label': 'Chromatique', title: 'Chromatique' })}>
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 1l2.6 8.4L23 12l-8.4 2.6L12 23l-2.6-8.4L1 12l8.4-2.6Z" /></svg>
  </span>;
}

/** Les tags d'un Pokémon : marque d'éclosion et shiny côte à côte. Posés sur le coin haut droit d'un portrait, ou en ligne (`enLigne`, à côté d'un nom : le shiny y est décoratif, le nom le dit déjà). */
export function RepereTags({ pokemon, enLigne = false }: { pokemon: Pick<PokemonPossede, 'marqueEclosion' | 'shiny' | 'oeuf'>; enLigne?: boolean }) {
  const shiny = pokemon.shiny && !pokemon.oeuf;
  if (!pokemon.marqueEclosion && !shiny) return null;
  return <span className={`repere-tags${enLigne ? '' : ' repere-marque-sur-portrait'}`}>
    {shiny && <RepereShiny decoratif={enLigne} />}{pokemon.marqueEclosion && <RepereMarque />}
  </span>;
}
