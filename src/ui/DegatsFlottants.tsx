import { useEffect, useRef } from 'react';
import type { StoreJeu } from './store';

export function DegatsFlottants({ store }: { store: StoreJeu }) {
  const conteneur = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const minuteurs = new Set<ReturnType<typeof setTimeout>>();
    const desabonner = store.abonnerDegats(degat => {
      const chiffre = document.createElement('span');
      // Vert si l'équipe est efficace, rouge si elle l'est peu (V1 : couleur du chiffre selon le multiplicateur de type).
      const multiplicateur = store.getState().equipe[0]?.multiplicateur ?? 1;
      const couleur = multiplicateur > 1 ? 'text-succes-base' : multiplicateur < 1 ? 'text-erreur-base' : 'text-neutre-50';
      chiffre.className = `degat-flottant contour-texte absolute right-1/4 top-1/2 font-titre text-3xl ${couleur}`;
      chiffre.textContent = `−${Math.ceil(degat.valeur)}`;
      conteneur.current?.append(chiffre);
      const minuteur = setTimeout(() => { chiffre.remove(); minuteurs.delete(minuteur); }, 500);
      minuteurs.add(minuteur);
    });
    const element = conteneur.current;
    return () => { desabonner(); minuteurs.forEach(clearTimeout); element?.replaceChildren(); };
  }, [store]);
  return <div ref={conteneur} aria-hidden="true" className="pointer-events-none absolute inset-0" />;
}
