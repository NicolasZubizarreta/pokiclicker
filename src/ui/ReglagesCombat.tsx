import { useId, useRef } from 'react';
import type { ReglagesArret } from '../core/sauvegarde-types';

const options = [
  ['commun', 'Commun'], ['peuCommun', 'Peu commun'], ['rare', 'Rare'],
  ['tresRare', 'Très rare'], ['legendaire', 'Légendaire'],
  ['shiny', 'Chromatique'], ['nouveau', 'Nouveau Pokémon'],
] as const;
const bouton = 'cadre min-h-11 min-w-11 bg-surface p-3 aria-pressed:bg-selection';

export function ReglagesCombat({ autoAttaque, arret, basculer, regler }: {
  autoAttaque: boolean;
  arret: ReglagesArret;
  basculer(): void;
  regler(partiel: Partial<ReglagesArret>): void;
}) {
  const dialogue = useRef<HTMLDialogElement>(null);
  const declencheur = useRef<HTMLButtonElement>(null);
  const titre = useId();
  const fermer = () => dialogue.current?.close();

  return <div className="flex min-w-0 flex-wrap gap-2 text-base text-texte">
    <button type="button" className={bouton} aria-pressed={autoAttaque} onClick={basculer}>Auto-attaque</button>
    <button type="button" className={bouton} aria-pressed={arret.actif}
      onClick={() => regler({ actif: !arret.actif })}>Arrêt auto</button>
    <button type="button" ref={declencheur} className={bouton}
      onClick={() => dialogue.current?.showModal()}>Réglages de l'arrêt</button>
    <dialog ref={dialogue} aria-labelledby={titre}
      className="fiche-pokemon cadre w-full max-w-3xl bg-surface p-0 text-base text-texte"
      onClose={() => declencheur.current?.focus()}
      onCancel={event => { event.preventDefault(); fermer(); }}>
      <div className="fiche-contenu grid min-w-0 gap-4 p-4 lg:p-8">
        <h2 id={titre} className="font-titre text-xl">Réglages de l'arrêt</h2>
        {options.map(([cle, nom]) => <label key={cle} className="flex min-h-11 min-w-11 cursor-pointer items-center gap-3">
          <input type="checkbox" checked={arret[cle]}
            onChange={event => regler({ [cle]: event.currentTarget.checked })} />
          {nom}
        </label>)}
        <button type="button" className={bouton} onClick={fermer}>Fermer</button>
      </div>
    </dialog>
  </div>;
}
