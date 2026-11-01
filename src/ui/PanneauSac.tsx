import { useEffect, useId, useRef, useState } from 'react';
import { Sac } from './Sac';
import type { AffichageSac } from './store-boutique';

export type ObjetAChoisir = { type: 'bonbon' | 'calcium' | 'pierre' | 'stase' | 'jeton'; cle: string; nom: string };

/** Un objet « direct » s'utilise ici ; un objet qui vise un Pokémon ferme le sac et laisse l'équipe le recevoir (`choisirObjet`). */
export function PanneauSac({ sac, utiliserObjetActif, choisirObjet, fermer, declencheur }: {
  sac: AffichageSac;
  utiliserObjetActif(id: string): string | null;
  choisirObjet(objet: ObjetAChoisir): void;
  fermer(): void;
  declencheur: HTMLButtonElement;
}) {
  const dialogue = useRef<HTMLDialogElement>(null);
  const titre = useId();
  const [message, annoncer] = useState<string | null>(null);
  useEffect(() => { dialogue.current?.showModal(); }, []);
  const clore = () => dialogue.current?.close();

  return <dialog ref={dialogue} aria-labelledby={titre}
    className="fiche-pokemon cadre w-full max-w-3xl bg-surface p-0 text-base text-texte"
    onClose={() => { fermer(); declencheur.focus(); }}
    onCancel={event => { event.preventDefault(); clore(); }}>
    <div className="fiche-contenu grid min-w-0 gap-4 p-4 lg:p-8">
      <button type="button" className="cadre min-h-11 min-w-11 justify-self-end bg-surface p-3" onClick={clore}>Fermer</button>
      <h2 id={titre} className="font-titre text-2xl">Ton Sac</h2>
      <Sac sac={sac} utiliser={entree => {
        if (!entree.utilisable || entree.quantite <= 0) return;
        if (entree.utilisable === 'direct') {
          annoncer(utiliserObjetActif(entree.id));
          return;
        }
        choisirObjet({ type: entree.utilisable, cle: entree.id, nom: entree.nom });
        clore();
      }} />
      <p role="status">{message ?? ''}</p>
    </div>
  </dialog>;
}
