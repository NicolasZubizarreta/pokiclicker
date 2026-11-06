import { useId, useLayoutEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { Sac } from './Sac';
import { storeJeu } from './store';
import { choisirObjet, fermerSac, storeSac, useSacContexte } from './sacContexte';

export function FenetreSac() {
  return useSacContexte(etat => etat.ouvert) ? <FenetreOuverte /> : null;
}

function FenetreOuverte() {
  const sac = useStore(storeJeu, etat => etat.sac);
  const utiliserObjetActif = useStore(storeJeu, etat => etat.utiliserObjetActif);
  const dialogue = useRef<HTMLDialogElement>(null);
  const titre = useId();
  const [message, annoncer] = useState<string | null>(null);
  useLayoutEffect(() => {
    const declencheur = document.activeElement;
    dialogue.current?.showModal();
    return () => {
      if (!storeSac.getState().objet && declencheur instanceof HTMLElement && declencheur.isConnected) declencheur.focus();
    };
  }, []);
  const clore = () => dialogue.current?.close();
  return <dialog ref={dialogue} aria-labelledby={titre}
    className="fiche-pokemon cadre w-full max-w-3xl bg-surface p-0 text-base text-texte"
    onClose={fermerSac}
    onCancel={event => { event.preventDefault(); clore(); }}>
    <div className="fiche-contenu grid min-w-0 gap-4 p-4 lg:p-8">
      <button type="button" className="cadre min-h-11 min-w-11 justify-self-end bg-surface p-3" onClick={clore}>Fermer</button>
      <h2 id={titre} className="font-titre text-2xl">Ton Sac</h2>
      <Sac sac={sac} utiliser={entree => {
        if (!entree.utilisable || entree.quantite <= 0) return;
        if (entree.utilisable === 'direct') { annoncer(utiliserObjetActif(entree.id)); return; }
        choisirObjet({ type: entree.utilisable, cle: entree.id, nom: entree.nom });
      }} />
      <p role="status">{message ?? ''}</p>
    </div>
  </dialog>;
}
