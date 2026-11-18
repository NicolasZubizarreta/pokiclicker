import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { calculerObjectifs, listeFenetre, objectifAffiche, objectifs } from '../core/objectifs';
import type { Page } from './Navigation';
import type { StoreJeu } from './store';

export function ObjectifPermanent({ store, aller }: { store: StoreJeu; aller?: (page: Page) => void }) {
  const zone = useStore(store, e => e.zone);
  const zoneSuivante = useStore(store, e => e.zoneSuivante);
  const argent = useStore(store, e => e.argent);
  const boutique = useStore(store, e => e.boutique);
  const progression = useStore(store, e => e.progression);
  const pension = useStore(store, e => e.pension);
  const resultat = useMemo(() => calculerObjectifs({ zone, zoneSuivante, argent, progression,
    boutique: { ouverte: boutique.acces.ouvert, objets: boutique.objets },
    pension: { ouverte: pension.acces.ouvert, parents: pension.parents.length, oeufs: pension.oeufs.length, especesEcloses: pension.especesEcloses.length },
  }), [zone, zoneSuivante, argent, boutique, progression, pension]);
  const [compteur, fixerCompteur] = useState(0);
  const liste = listeFenetre(resultat);
  const nombre = liste.filter(o => o.applicable && !o.fait).length;
  useEffect(() => {
    if (nombre <= 1) return;
    const intervalle = setInterval(() => fixerCompteur(n => n + 1), objectifs.alternanceMs);
    return () => clearInterval(intervalle);
  }, [nombre]);
  const affiche = objectifAffiche(compteur, resultat);
  const dialogue = useRef<HTMLDialogElement>(null);
  const bouton = useRef<HTMLButtonElement>(null);
  const titre = useId();
  const fermer = () => dialogue.current?.close();
  if (!affiche) return null;
  return <>
    <button ref={bouton} type="button" aria-label={`Objectifs : ${affiche.texte}`}
      className="cadre absolute top-4 right-4 z-20 min-h-11 max-w-1/3 bg-surface/82 px-3 py-2 text-right text-sm font-bold tabular-nums text-neutre-50 lg:text-base"
      onClick={() => dialogue.current?.showModal()}><span aria-hidden="true" className="block text-xs font-normal text-texte-doux">Objectifs</span><span className="line-clamp-3">{affiche.texte}</span></button>
    <dialog ref={dialogue} aria-labelledby={titre} className="fiche-pokemon cadre w-full max-w-3xl bg-surface p-0 text-base text-texte"
      onClose={() => bouton.current?.focus()} onCancel={e => { e.preventDefault(); fermer(); }}>
      <div className="fiche-contenu grid min-w-0 gap-4 p-4 lg:p-8">
        <header className="flex items-start justify-between gap-4">
          <h2 id={titre} className="font-titre text-xl">Objectifs</h2>
          <button type="button" aria-label="Fermer" onClick={fermer} className="cadre grid min-h-11 min-w-11 place-items-center bg-surface">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
          </button>
        </header>
        <p>Ce que tu peux viser maintenant.</p>
        <ul className="grid gap-4">{liste.map(o => <li key={o.id} className="flex flex-wrap items-center gap-2">
          <p className="grow">{o.texte}</p>
          <span className={`flex items-center gap-1 ${o.fait ? 'text-succes-texte' : 'text-texte-doux'}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5"><path d={o.fait ? 'm5 12 4 4L19 6' : 'M12 5v9m0 3v2'} fill="none" stroke="currentColor" strokeWidth="2" /></svg>
            {o.fait ? 'Fait' : 'À faire'}
          </span>
          {!o.fait && o.cible && aller && <button type="button" className="cadre min-h-11 bg-surface-2 px-4" onClick={() => { fermer(); aller(o.cible as Page); }}>Y aller</button>}
        </li>)}</ul>
      </div>
    </dialog>
  </>;
}
