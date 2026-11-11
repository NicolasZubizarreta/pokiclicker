import { useStore } from 'zustand';
import { storeJeu } from './store';

/**
 * Annonce de déblocage (PC, Pension, Centre commercial, Casino, Poké-Radar…), posée en haut de l'écran
 * sur toutes les pages, une à la fois. Même présentation que « CARTE DÉBLOQUÉE ! » de l'intro :
 * cadre `bg-surface`, titre en `font-titre`, lecture en `aria-live` (jamais `role="status"`, déjà pris par l'annonce du jeu).
 * Sous `prefers-reduced-motion` le texte est identique, sans glissement.
 * Une annonce « carte » (casino) ne s'éteint pas : elle porte un bouton d'action (`quandAller`) et un bouton pour fermer.
 */
export function AnnonceDeblocage({ quandAller }: { quandAller?: (cible: string) => void }) {
  const texte = useStore(storeJeu, etat => etat.deblocage);
  const carte = useStore(storeJeu, etat => etat.deblocageCarte);
  const bouton = 'min-h-11 min-w-11 px-4 py-2 focus-visible:outline-2 focus-visible:outline-focus';
  return <div aria-live="polite" data-annonce-deblocage className="w-full max-w-(--breakpoint-md)">
    {texte !== null && carte === null && <p key={texte} className="cadre bg-surface p-2 text-center font-titre wrap-anywhere motion-safe:annonce-entree">{texte}</p>}
    {texte !== null && carte !== null && <div key={texte} data-annonce-carte className="cadre pointer-events-auto grid gap-2 bg-surface p-4 text-center motion-safe:annonce-entree">
      <p className="font-titre wrap-anywhere">{texte}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" className={`${bouton} bg-action text-action-texte hover:bg-action-survol`}
          onClick={() => { storeJeu.getState().fermerDeblocage(); quandAller?.(carte.cible); }}>{carte.libelle}</button>
        <button type="button" className={`${bouton} cadre bg-surface-2 hover:bg-selection`}
          onClick={() => storeJeu.getState().fermerDeblocage()}>Fermer</button>
      </div>
    </div>}
  </div>;
}
