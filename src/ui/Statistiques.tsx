import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from 'zustand';
import { storeJeu } from './store';

export function Statistiques({ fermer }: { fermer(): void }) {
  const statistiques = useStore(storeJeu, etat => etat.statistiques);
  const dialogue = useRef<HTMLDialogElement>(null);
  const titre = useId();
  useEffect(() => {
    const origine = document.activeElement;
    const fenetre = dialogue.current!;
    fenetre.showModal();
    fenetre.querySelector('button')?.focus();
    return () => {
      fenetre.close();
      if (origine instanceof HTMLElement && origine.isConnected) origine.focus();
    };
  }, []);
  return createPortal(<dialog ref={dialogue} aria-labelledby={titre}
    className="guide-fenetre cadre w-full max-w-3xl bg-surface p-0 text-base text-texte"
    onCancel={event => { event.preventDefault(); fermer(); }}
    onPointerDown={event => { if (event.target === event.currentTarget) fermer(); }}>
    <header className="flex shrink-0 items-center justify-between gap-4 p-4">
      <h2 id={titre} className="font-titre text-xl font-semibold">Statistiques</h2>
      <button type="button" onClick={fermer} aria-label="Fermer les statistiques"
        className="min-h-11 min-w-11 bg-surface-2 text-xl hover:bg-selection">×</button>
    </header>
    <div data-stats-contenu className="fiche-contenu grid min-w-0 gap-2 px-4 pb-4">
      {statistiques.map(stat => <section key={stat.libelle} aria-label={stat.libelle} className="bg-surface-2 p-4">
        <h3 className="font-bold">{stat.libelle}</h3>
        {stat.valeur !== undefined ? <p className="text-xl text-region-accent">{stat.valeur.toLocaleString('fr-FR')}{stat.unite}</p>
          : <dl className="space-y-2">
            {stat.base !== undefined && <div className="flex flex-wrap justify-between gap-2"><dt>{stat.libelleBase ?? 'Base'} :</dt><dd>{stat.base}</dd></div>}
            <div><dt className="text-texte-doux">{stat.total === undefined ? 'Boosts passifs' : 'Boosts'} :</dt><dd>{stat.boosts?.join(', ') || 'Aucun'}</dd></div>
            {stat.total !== undefined && <div className="flex justify-between gap-2 font-bold"><dt>Total :</dt><dd className="text-region-accent">{stat.total}</dd></div>}
          </dl>}
      </section>)}
    </div>
  </dialog>, document.body);
}
