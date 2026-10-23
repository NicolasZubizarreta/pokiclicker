import { useEffect, useRef } from 'react';
import type { StoreJeu } from './store';

export function DegatsFlottants({ store }: { store: StoreJeu }) {
  const conteneur = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const minuteurs = new Set<ReturnType<typeof setTimeout>>();
    const desabonner = store.abonnerDegats(degat => {
      const chiffre = document.createElement('span');
      chiffre.className = 'degat-flottant absolute right-1/4 top-1/2 bg-surface font-titre text-3xl';
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
