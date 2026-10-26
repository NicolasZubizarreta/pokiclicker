import { useEffect, useRef, useState } from 'react';
import type { Commande } from '../core/evenements';
import { reglages } from '../core/reglages';

export const mouvementReduit = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function BoiteDialogue({ commande, reduit, terminer }: {
  commande: Extract<Commande, { type: 'dialogue' }>; reduit: boolean; terminer(): void;
}) {
  const { texte } = commande;
  const [lettres, ecrire] = useState(reduit ? texte.length : 0);
  const rendue = useRef(false);
  const bouton = useRef<HTMLButtonElement>(null);
  useEffect(() => { bouton.current?.focus(); }, []);
  useEffect(() => {
    if (lettres >= texte.length) return;
    const minuteur = setTimeout(() => ecrire(lettres + 1), reglages.intro.caractereMs);
    return () => clearTimeout(minuteur);
  }, [lettres, texte]);
  const fini = lettres >= texte.length;
  return <>
    <button ref={bouton} type="button" aria-label={`${commande.locuteur} : ${texte}`}
      onClick={() => {
        if (!fini) { ecrire(texte.length); return; }
        if (rendue.current) return;
        rendue.current = true;
        terminer();
      }}
      className="cadre relative min-h-24 w-full bg-surface p-4 pr-10 text-left">
      <span aria-hidden="true" className="block font-titre text-lien">{commande.locuteur}</span>
      <span aria-hidden="true" className="block break-words leading-loose">{texte.slice(0, lettres)}</span>
      {fini && <span aria-hidden="true" className="absolute bottom-2 right-2 text-alerte-base motion-safe:animate-bounce">▼</span>}
    </button>
  </>;
}
