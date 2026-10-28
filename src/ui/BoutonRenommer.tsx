import type { Ref } from 'react';
import { Crayon } from './icones';

/** Crayon à côté du nom d'un Pokémon : cible de 44 px, nom accessible « Renommer <nom> ». */
export function BoutonRenommer({ nom, ouvrir, className = '', ref }: {
  nom: string;
  ouvrir(declencheur: HTMLButtonElement): void;
  className?: string;
  ref?: Ref<HTMLButtonElement>;
}) {
  return <button ref={ref} type="button" aria-label={`Renommer ${nom}`} title={`Renommer ${nom}`}
    className={`cadre inline-grid min-h-11 min-w-11 shrink-0 place-items-center bg-surface hover:bg-selection ${className}`}
    onClick={event => ouvrir(event.currentTarget)}><Crayon /></button>;
}
