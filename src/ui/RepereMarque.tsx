import type { PokemonPossede } from '../core/sauvegarde';
import { IconeShiny } from './IconeShiny';
import './RepereMarque.css';

/**
 * Tag « issu d'un œuf » : l'icône d'œuf seule, sans cercle ni fond.
 * Pour un Pokémon à la fois shiny et issu d'un œuf (`shiny`), un seul tag : l'œuf avec l'étoile shiny à l'intérieur.
 */
export function RepereMarque({ shiny = false }: { shiny?: boolean }) {
  const libelle = shiny ? "Chromatique, marque d'éclosion" : "Marque d'éclosion";
  return <span className={shiny ? 'repere-marque repere-marque-shiny' : 'repere-marque'} role="img" aria-label={libelle} title={libelle}>
    <svg viewBox="0 0 30 30" aria-hidden="true" focusable="false"><path d="M24 18c0 7-4 10-9 10S6 25 6 18 11 2 15 2s9 9 9 16Z" />
      {shiny ? <path className="repere-etoile" d="M15 11l1.6 4.4L21 17l-4.4 1.6L15 23l-1.6-4.4L9 17l4.4-1.6Z" /> : <path d="m15 3-2 5 3 3-4 4 3 4-2 5m3-13 5 1m-9 3-4-1" />}</svg>
  </span>;
}

/**
 * Les tags d'un Pokémon, à poser juste après son nom : l'étoile shiny (une seule, décorative : le nom ou la fiche le disent déjà),
 * puis l'icône d'œuf à sa droite, ou juste après le nom si le Pokémon n'est pas shiny. Shiny et issu d'un œuf : un seul tag combiné.
 * Un œuf n'affiche rien : son espèce reste cachée.
 */
export function RepereTags({ pokemon, decoratif = true }: { pokemon: Pick<PokemonPossede, 'marqueEclosion' | 'shiny' | 'oeuf'>; decoratif?: boolean }) {
  const shiny = pokemon.shiny && !pokemon.oeuf;
  const marque = pokemon.marqueEclosion && !pokemon.oeuf;
  if (!shiny && !marque) return null;
  if (shiny && marque) return <span className="repere-tags"><RepereMarque shiny /></span>;
  return <span className="repere-tags">{shiny && <IconeShiny decoratif={decoratif} />}{marque && <RepereMarque />}</span>;
}
