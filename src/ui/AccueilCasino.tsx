import { useEffect, useState } from 'react';
import { PageCasino } from './PageCasino';
import { storeJeu, type StoreJeu } from './store';
import { surPremiereEntreeCasino } from './store-casino';

/**
 * Page du casino avec l'accueil de la première visite : l'ouverture déclenche `entrerAuCasino` (jetons offerts une seule fois,
 * pastille retirée) et la salle affiche le cadeau de bienvenue. Les deux entrées (Menu et Carte) passent par ici ;
 * l'habillage de la page elle-même reste dans `PageCasino`.
 */
export function AccueilCasino({ retour, store = storeJeu }: { retour(): void; store?: StoreJeu }) {
  const [offerts, noter] = useState(0);
  // Le message vient du crochet de première entrée : l'effet n'écrit pas l'état lui-même, et le double passage du mode strict
  // ne perd rien (le second `entrerAuCasino` renvoie 0 sans rien signaler, le message du premier reste).
  useEffect(() => {
    const retirer = surPremiereEntreeCasino(noter);
    store.getState().entrerAuCasino();
    return retirer;
  }, [store]);
  return <PageCasino retour={retour} store={store} offerts={offerts} />;
}
