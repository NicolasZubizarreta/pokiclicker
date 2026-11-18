import { useEffect, useRef } from 'react';
import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { storeJeu } from './store';
import './tuto/tuto.css';

/** Guide de l'objectif « Zone suivante » : cadre jaune autour du bouton « Suivant », reste de l'écran grisé (même rendu que les tutoriels). */
export const storeGuideZone = createStore<{ actif: boolean }>(() => ({ actif: false }));
export const lancerGuideZoneSuivante = () => storeGuideZone.setState({ actif: true });
const arreter = () => storeGuideZone.setState({ actif: false });
const CIBLE = '[data-guide="zone-suivante"]';

export function GuideZoneSuivante() {
  const actif = useStore(storeGuideZone, e => e.actif);
  const repere = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!actif) return;
    const depart = storeJeu.getState().lieu?.id;
    const placer = () => {
      const element = repere.current;
      if (!element) return;
      const r = document.querySelector<HTMLElement>(CIBLE)?.getBoundingClientRect();
      element.hidden = !r;
      if (r) Object.assign(element.style, { left: `${r.left - 6}px`, top: `${r.top - 6}px`, width: `${r.width + 12}px`, height: `${r.height + 12}px` });
    };
    // Un clic ailleurs que sur « Suivant », Échap ou un changement de lieu termine le guide.
    const clic = (event: MouseEvent) => { if (!(event.target instanceof Element && event.target.closest(CIBLE))) arreter(); };
    const touche = (event: KeyboardEvent) => { if (event.key === 'Escape') arreter(); };
    const jeu = storeJeu.subscribe(etat => { if (etat.lieu?.id !== depart) arreter(); });
    const minuterie = setInterval(placer, 150);
    placer();
    document.addEventListener('click', clic, true);
    document.addEventListener('keydown', touche);
    return () => { jeu(); clearInterval(minuterie); document.removeEventListener('click', clic, true); document.removeEventListener('keydown', touche); };
  }, [actif]);
  if (!actif) return null;
  return <div className="tuto-couche">
    <div ref={repere} className="repere" hidden />
    <p className="sr-only" aria-live="polite">Appuie sur Suivant pour aller à la zone suivante.</p>
  </div>;
}
