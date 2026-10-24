import { useStore } from 'zustand';
import type { StoreJeu } from './store';

export function DialogueChen({ store }: { store: StoreJeu }) {
  const fin = useStore(store, etat => etat.finZone);
  const suite = useStore(store, etat => etat.suite);
  return <aside aria-label="Dialogue" className="cadre flex items-center gap-2 bg-surface p-4 lg:col-span-3">
    <div className="grow"><h2 className="font-titre text-xl text-lien">Prof. Chen</h2>
      {fin ? <p role="status" className="font-titre text-xl">{fin}</p>
        : <p>Les Rattata sont ici. Touche le Pokémon pour attaquer.</p>}
      <p className="mt-2 text-texte-doux">{suite && suite.raison !== 'La suite arrive bientôt.'
        ? `Suite : ${suite.nom} (verrouillée : ${suite.raison})` : 'La suite arrive bientôt.'}</p></div>
    <svg className="fleche-chen size-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6" /></svg>
  </aside>;
}
