import { useEffect, useRef, useState } from 'react';
import type { Commande } from '../core/evenements';
import { BoiteDialogue, mouvementReduit } from './BoiteDialogue';

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

  return <dialog ref={dialogue} aria-label="Dialogue de scène" onCancel={event => event.preventDefault()}
    className="fixed inset-0 m-auto max-h-full w-full max-w-xl overflow-y-auto bg-transparent p-4 text-texte backdrop:bg-fond/70">
    {commande.pose && <img src={`img/sprites/chen/${commande.pose}.png`} alt="" width={120} height={120}
      className="image-rendering-pixelated mx-auto h-40 max-w-full object-contain" />}
    <BoiteDialogue key={`${commande.evenement}:${commande.etape}`} commande={commande} reduit={reduit}
      terminer={terminerEtape} />
  </dialog>;
}
