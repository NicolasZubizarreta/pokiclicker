import type { Ref } from 'react';
import { Crayon } from './icones';

/** Crayon seul à côté du nom d'un Pokémon : cible tactile de 44 px sans cadre visible, nom accessible « Renommer <nom> ». */
export function BoutonRenommer({ nom, ouvrir, className = '', ref }: {
  nom: string;
  ouvrir(declencheur: HTMLButtonElement): void;
  className?: string;
  ref?: Ref<HTMLButtonElement>;
}) {
  return <button ref={ref} type="button" aria-label={`Renommer ${nom}`} title={`Renommer ${nom}`}
    className={`relative inline-grid shrink-0 place-items-center p-1 text-texte-doux hover:text-texte after:absolute after:top-1/2 after:left-1/2 after:size-11 after:-translate-x-1/2 after:-translate-y-1/2 after:content-[''] ${className}`}
    onClick={event => ouvrir(event.currentTarget)}><Crayon /></button>;
}
