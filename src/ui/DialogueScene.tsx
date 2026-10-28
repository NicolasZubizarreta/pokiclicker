import { useEffect, useRef, useState } from 'react';
import type { Commande } from '../core/evenements';
import { spriteDe } from '../core/personnages';
import { BoiteDialogue, mouvementReduit } from './BoiteDialogue';

/** Remplace le sprite d'un personnage dont l'image n'est pas encore dans le dépôt (voir data/personnages.json). */
function Silhouette({ animee }: { animee: boolean }) {
  return <svg viewBox="0 0 120 160" aria-hidden="true" focusable="false" data-silhouette
    className={`mx-auto h-40 text-texte-doux ${animee ? 'sprite-entree' : ''}`}>
    <circle cx="60" cy="52" r="26" fill="currentColor" />
    <path d="M30 40 L40 12 L52 30 L62 8 L74 30 L86 14 L92 42 Z" fill="currentColor" />
    <path d="M14 160 C14 112 34 92 60 92 C86 92 106 112 106 160 Z" fill="currentColor" />
  </svg>;
}

export function DialogueScene({ commande, terminerEtape }: {
  commande: Extract<Commande, { type: 'dialogue' }>; terminerEtape(): void;
}) {
  const dialogue = useRef<HTMLDialogElement>(null);
  const [reduit] = useState(mouvementReduit);
  useEffect(() => {
    const fenetre = dialogue.current;
    fenetre?.showModal();
    return () => fenetre?.close();
  }, []);
  const sprite = spriteDe(commande.locuteur, commande.pose);

  return <dialog ref={dialogue} aria-label="Dialogue de scène" onCancel={event => event.preventDefault()}
    className="fixed inset-0 m-auto max-h-full w-full max-w-xl overflow-y-auto bg-transparent p-4 text-texte backdrop:bg-fond/70">
    {sprite?.type === 'image' && <img key={sprite.src} src={sprite.src} alt="" width={120} height={120}
      className={`image-rendering-pixelated mx-auto h-40 max-w-full object-contain ${reduit ? '' : 'sprite-entree'}`} />}
    {sprite?.type === 'silhouette' && <Silhouette key={commande.locuteur} animee={!reduit} />}
    <BoiteDialogue key={`${commande.evenement}:${commande.etape}`} commande={commande} reduit={reduit}
      terminer={terminerEtape} />
  </dialog>;
}
