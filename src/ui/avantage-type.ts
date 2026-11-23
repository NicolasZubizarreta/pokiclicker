import type { CaseEquipe } from './store';

export function moyenneAvantage(cases: CaseEquipe[]): number | null {
  const membres = cases.filter(membre => membre !== null && !membre.pokemon.oeuf);
  return membres.length ? membres.reduce((total, membre) => total + membre!.multiplicateur, 0) / membres.length : null;
}

export function libelleMultiplicateur(m: number): string {
  return `×${m.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}`;
}

export function nature(m: number): 'fort' | 'faible' | 'neutre' {
  return m > 1 ? 'fort' : m < 1 ? 'faible' : 'neutre';
}

export const couleursAvantage = { fort: 'text-succes-base', faible: 'text-erreur-base', neutre: 'text-texte-doux' };
