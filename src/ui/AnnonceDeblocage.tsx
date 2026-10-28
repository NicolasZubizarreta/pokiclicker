import { useStore } from 'zustand';
import { storeJeu } from './store';

/**
 * Annonce de déblocage (PC, Pension, Centre commercial, Casino, Poké-Radar…), posée en haut de l'écran
 * sur toutes les pages, une à la fois. Même présentation que « CARTE DÉBLOQUÉE ! » de l'intro :
 * cadre `bg-surface`, titre en `font-titre`, lecture en `aria-live` (jamais `role="status"`, déjà pris par l'annonce du jeu).
 * Sous `prefers-reduced-motion` le texte est identique, sans glissement.
 */
export function AnnonceDeblocage() {
  const texte = useStore(storeJeu, etat => etat.deblocage);
  return <div aria-live="polite" data-annonce-deblocage className="pointer-events-none fixed inset-x-4 top-4 z-30 lg:left-28">
    {texte !== null && <p key={texte} className="cadre bg-surface p-2 text-center font-titre motion-safe:annonce-entree">{texte}</p>}
  </div>;
}
