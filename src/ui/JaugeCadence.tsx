import { useEffect, useState } from 'react';
import { storeJeu, type StoreJeu } from './store';

export function JaugeCadence({ store = storeJeu }: { store?: StoreJeu }) {
  const [cadence, definir] = useState({ actuelle: 0, maximum: 0 });
  useEffect(() => {
    const lire = () => { if (!document.hidden) definir(store.getState().lireCadence()); };
    lire();
    const intervalle = setInterval(lire, 250);
    return () => clearInterval(intervalle);
  }, [store]);
  return cadence.actuelle > 0 ? <span aria-hidden="true" className="pointer-events-none absolute bottom-2 left-2 text-sm tabular-nums text-texte-doux">{cadence.actuelle} / {cadence.maximum} clics par seconde{cadence.actuelle >= cadence.maximum ? ', maximum' : ''}</span> : null;
}
