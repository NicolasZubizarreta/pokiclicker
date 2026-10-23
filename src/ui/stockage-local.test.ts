import { describe, expect, it } from 'vitest';
import { creerStockageLocal } from './stockage-local';

function fauxStorage() {
  const valeurs = new Map<string, string>();
  return {
    get length() { return valeurs.size; },
    getItem: (cle: string) => valeurs.get(cle) ?? null,
    setItem: (cle: string, valeur: string) => { valeurs.set(cle, valeur); },
    removeItem: (cle: string) => { valeurs.delete(cle); },
    key: (index: number) => [...valeurs.keys()][index] ?? null,
  };
}
describe('stockage du navigateur', () => {
  it('lit, écrit, supprime et ne liste que les clés préfixées', () => {
    const cible = fauxStorage();
    cible.setItem('autre-application', 'intacte');
    const stockage = creerStockageLocal(cible);
    expect(stockage.lire('absente')).toBeNull();
    stockage.ecrire('pokiclicker:compte:local', 'sauvegarde');
    expect(stockage.lire('pokiclicker:compte:local')).toBe('sauvegarde');
    expect(stockage.cles()).toEqual(['pokiclicker:compte:local']);
    stockage.supprimer('pokiclicker:compte:local');
    expect(stockage.cles()).toEqual([]);
    expect(cible.getItem('autre-application')).toBe('intacte');
  });
  it('traduit exactement une erreur de quota', () => {
    const cible = fauxStorage();
    cible.setItem = () => { throw new Error('QuotaExceededError'); };
    const stockage = creerStockageLocal(cible);
    expect(() => stockage.ecrire('pokiclicker:test', 'test')).toThrowError(
      new Error("Impossible d'enregistrer : le stockage du navigateur est plein ou bloqué."));
    expect(stockage.cles()).toEqual([]);
  });
  it.each(['getItem', 'key', 'removeItem', 'length'] as const)('traduit les accès bloqués (%s)', methode => {
    const cible = fauxStorage();
    cible.setItem('pokiclicker:test', 'test');
    Object.defineProperty(cible, methode, methode === 'length'
      ? { get: () => { throw new Error('SecurityError'); } }
      : { value: () => { throw new Error('SecurityError'); } });
    const stockage = creerStockageLocal(cible);
    const action = methode === 'getItem' ? () => stockage.lire('pokiclicker:test')
      : methode === 'removeItem' ? () => stockage.supprimer('pokiclicker:test') : () => stockage.cles();
    expect(action).toThrow(methode === 'removeItem' ? "Impossible d'enregistrer" : 'Impossible de lire');
  });
});
