import { useStore } from 'zustand';
import { storeJeu } from './store';

/** Vrai tant que la pension est ouverte et que le joueur n'y est jamais entré. */
export const usePensionNouveau = () => useStore(storeJeu, etat => etat.pension.nouveau);

/** Pastille de rappel de la pension (menu, Carte, onglets) : la même pastille ronde que celle du casino. Décorative : le texte « Nouveau » est porté par la ligne. */
export function PastillePension({ className = '' }: { className?: string }) {
  return <span aria-hidden="true" data-pastille-pension className={`inline-block size-3 shrink-0 rounded-full bg-succes-base ${className}`} />;
}
