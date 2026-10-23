import type { Stockage } from '../core/sauvegarde';

type StockageNavigateur = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'>;
export function creerStockageLocal(storage?: StockageNavigateur): Stockage {
  function acceder<T>(action: (cible: StockageNavigateur) => T, ecriture = false): T {
    try { return action(storage ?? window.localStorage); }
    catch {
      throw new Error(ecriture
        ? "Impossible d'enregistrer : le stockage du navigateur est plein ou bloqué."
        : 'Impossible de lire le stockage du navigateur : il est bloqué.');
    }
  }
  return {
    lire: cle => acceder(cible => cible.getItem(cle)),
    ecrire: (cle, valeur) => acceder(cible => cible.setItem(cle, valeur), true),
    supprimer: cle => acceder(cible => cible.removeItem(cle), true),
    cles: () => acceder(cible => {
      const cles: string[] = [];
      for (let i = 0; i < cible.length; i++) {
        const cle = cible.key(i);
        if (cle?.startsWith('pokiclicker:')) cles.push(cle);
      }
      return cles;
    }),
  };
}
