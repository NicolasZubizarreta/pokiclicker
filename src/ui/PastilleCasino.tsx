import { useStore } from 'zustand';
import { storeJeu } from './store';

/** Vrai tant que le casino est ouvert et que le joueur n'y est jamais entré. */
export const useCasinoNouveau = () => useStore(storeJeu, etat => etat.casino.nouveau);

/**
 * Pastille de rappel du casino (menu, Carte, onglets) : même pastille ronde `succes-base` que le rappel d'évolution
 * de la barre latérale. Décorative : le texte « Nouveau » est porté par la ligne qui l'affiche.
 */
export function PastilleCasino({ className = '' }: { className?: string }) {
  return <span aria-hidden="true" data-pastille-casino className={`inline-block size-3 shrink-0 rounded-full bg-succes-base ${className}`} />;
}
