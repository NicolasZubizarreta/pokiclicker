import { useEffect, useId, useRef } from 'react';
import { useStore } from 'zustand';
import { storeJeu, type StoreJeu } from './store';
import { formaterDps, formaterNombre } from './nombres';

export function Mannequin({ store = storeJeu }: { store?: StoreJeu }) {
  const mesure = useStore(store, etat => etat.mannequin);
  const actif = useStore(store, etat => Boolean(etat.zone && etat.ennemi && !etat.evenement));
  const dialogue = useRef<HTMLDialogElement>(null);
  const bouton = useRef<HTMLButtonElement>(null);
  const titre = useId();
  const fermer = () => { store.getState().arreterMannequin(); dialogue.current?.close(); };
  useEffect(() => () => store.getState().arreterMannequin(), [store]);
  return <>
    <button ref={bouton} type="button" className="plaque min-h-11 min-w-11 px-4" disabled={!actif} aria-describedby={!actif ? `${titre}-raison` : undefined} onClick={() => dialogue.current?.showModal()}>Mannequin</button>
    {!actif && <span id={`${titre}-raison`} className="text-base text-texte-doux">Disponible pendant un combat.</span>}
    <dialog ref={dialogue} aria-labelledby={titre} className="fiche-pokemon cadre w-full max-w-lg bg-surface p-4 text-base text-texte tabular-nums"
      onClose={() => { store.getState().arreterMannequin(); bouton.current?.focus(); }} onCancel={event => { event.preventDefault(); fermer(); }} onPointerDown={event => { if (event.target === event.currentTarget) fermer(); }}>
      <h2 id={titre} className="font-titre text-xl">Mannequin d'entraînement</h2>
      <p>Un sac de sable de 30 s pour mesurer tes dégâts. Le combat est en pause et rien ne compte pour ta progression.</p>
      {!mesure || mesure.restantMs === 0 ? <>
        {mesure && <><p>DPS équipe {formaterDps(mesure.dpsEquipe)}</p><p>DPS clic {formaterDps(mesure.dpsClic)}</p><p>DPS total {formaterDps(mesure.dpsTotal)}</p></>}
        <button className="plaque min-h-11 px-4" onClick={() => store.getState().lancerMannequin()}>{mesure ? 'Recommencer' : 'Lancer'}</button>
      </> : <>
        <p>Temps restant : {Math.ceil(mesure.restantMs / 1000)} s</p><p>Dégâts : {formaterNombre(mesure.degats)}</p>
        <button className="plaque min-h-16 w-full" onPointerDown={event => { if (event.button === 0) { event.preventDefault(); store.getState().frapperMannequin(); } }} onClick={event => { if (event.detail === 0) store.getState().frapperMannequin(); }}>Frapper</button>
      </>}
      <button className="plaque min-h-11 px-4" onClick={fermer}>Fermer</button>
    </dialog>
  </>;
}
