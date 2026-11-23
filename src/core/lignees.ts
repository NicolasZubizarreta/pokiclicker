import { chargerEvolutions, evolutionsDirectes, lignee } from './evolution';

export type Lignee = [number, number, number];
export const SEUILS_LIGNEES = [10, 25, 50] as const;

export function lignees(): Lignee[] {
  const donnees = chargerEvolutions();
  // Chaque chemin complet de trois stades compte ; les branches à deux stades
  // (Évoli compris) sont exclues, même si la famille contient trois descendants.
  return [...new Set([...donnees.niveau, ...donnees.pierre].map(e => e.vers))]
    .filter(numero => evolutionsDirectes(numero).length === 0)
    .map(lignee).filter((chemin): chemin is Lignee => chemin.length === 3)
    .sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
}

export function compterLignees(pokedex: readonly number[]) {
  const familles = lignees();
  const captures = new Set(pokedex);
  const completes = familles.filter(famille => famille.every(numero => captures.has(numero))).length;
  return { completes, total: familles.length,
    paliers: SEUILS_LIGNEES.map(seuil => ({ seuil, atteint: completes >= seuil })) };
}
