import { useEffect, useRef } from 'react';
import type { StoreJeu } from './store';

const DUREE_MS = 1100;
// Butin (argent, XP) à gauche, là où ne tombent pas les dégâts (à droite) ; capture en haut ; diamants en bas à droite.
const places = {
  butin: 'left-1/4 top-[30%] -translate-x-1/2 text-2xl text-alerte-base',
  capture: 'left-1/2 top-[18%] -translate-x-1/2 text-3xl text-succes-base',
  diamants: 'right-4 bottom-1/4 text-2xl text-info-texte',
} as const;

/** Signes de gain posés sur la scène sans la masquer ni capter le clic. Coupés de l'animation (pas du texte) en mouvement réduit. */
export function GainsFlottants({ store }: { store: StoreJeu }) {
  const conteneur = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const minuteurs = new Set<ReturnType<typeof setTimeout>>();
    const desabonner = store.abonnerGains(gain => {
      const bloc = document.createElement('div');
      bloc.className = `gain-flottant contour-texte absolute text-center font-titre ${places[gain.type]}`;
      gain.lignes.forEach((ligne, i) => {
        const p = document.createElement('p');
        if (i > 0) p.className = 'text-base';
        p.textContent = ligne;
        bloc.append(p);
      });
      conteneur.current?.append(bloc);
      const minuteur = setTimeout(() => { bloc.remove(); minuteurs.delete(minuteur); }, DUREE_MS);
      minuteurs.add(minuteur);
    });
    const element = conteneur.current;
    return () => { desabonner(); minuteurs.forEach(clearTimeout); element?.replaceChildren(); };
  }, [store]);
  return <div ref={conteneur} aria-hidden="true" className="pointer-events-none absolute inset-0 z-20" />;
}
