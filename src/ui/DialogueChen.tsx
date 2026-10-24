import { useStore } from 'zustand';
import type { StoreJeu } from './store';

export function DialogueChen({ store }: { store: StoreJeu }) {
  const lieu = useStore(store, etat => etat.lieu);
  const precedente = useStore(store, etat => etat.zonePrecedente);
  const suivante = useStore(store, etat => etat.zoneSuivante);
  return <aside aria-label="Dialogue" className="cadre flex items-center gap-2 bg-surface p-4 lg:col-span-3">
    <div className="min-w-0 grow lg:flex lg:items-center lg:justify-between lg:gap-4"><div className="min-w-0"><h2 className="font-titre text-xl text-lien">Prof. Chen</h2>
      <p>{lieu?.sansCombat ? 'Choisis une zone pour partir à l’aventure.'
        : lieu?.id === 'kanto.route-1' ? 'Les Rattata sont ici. Touche le Pokémon pour attaquer.' : 'Touche le Pokémon pour attaquer.'}</p></div>
      <div className="mt-2 grid grid-cols-2 gap-2 lg:mt-0 lg:w-3/5">
        {([['Zone précédente', precedente], ['Zone suivante', suivante]] as const).map(([libelle, destination], index) =>
          destination && <div key={destination.id} className="min-w-0">
            <button type="button" disabled={!destination.ouverte}
              className={`cadre min-h-11 w-full px-2 py-1 text-base disabled:opacity-50 ${index === 1
                ? 'bg-action text-action-texte shadow-md enabled:hover:bg-action-survol enabled:active:translate-y-0.5'
                : 'bg-surface text-texte'}`}
              onClick={() => store.getState().allerVers(destination.id)}>{libelle} : {destination.nom}</button>
            {!destination.ouverte && <p className="mt-1 text-texte-doux">{destination.raison}</p>}
          </div>)}
      </div></div>
    <svg className="fleche-chen size-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6" /></svg>
  </aside>;
}
