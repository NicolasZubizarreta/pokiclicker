import donneesPaliers from '../../data/lignees.json';
import { chargerEvolutions, evolutionsDirectes, lignee } from './evolution';

export type Lignee = [number, number, number];
export type PalierLignees = { seuil: number; libelle: string };

export function validerPaliersLignees(liste: unknown): PalierLignees[] {
  if (!Array.isArray(liste) || !liste.length) throw new Error('Paliers de lignées invalides');
  let precedent = 0;
  return liste.map((entree: unknown) => {
    const { seuil, libelle } = (entree ?? {}) as Record<string, unknown>;
    if (typeof seuil !== 'number' || !Number.isInteger(seuil) || seuil <= precedent) throw new Error(`Seuil de palier de lignées invalide : ${seuil}`);
    if (typeof libelle !== 'string' || !libelle.trim()) throw new Error(`Libellé du palier de lignées manquant : ${seuil}`);
    precedent = seuil;
    return { seuil, libelle };
  });
}

/** Paliers et libellés dans `data/lignees.json` ; le dernier palier est le nombre de lignées complètes possibles. */
export const PALIERS_LIGNEES = validerPaliersLignees(donneesPaliers.paliers);

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
    paliers: PALIERS_LIGNEES.map(({ seuil, libelle }) => ({ seuil, libelle, atteint: completes >= seuil })) };
}
