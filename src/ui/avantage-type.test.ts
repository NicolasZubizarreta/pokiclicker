import { expect, it } from 'vitest';
import type { CaseEquipe } from './store';
import { libelleMultiplicateur, moyenneAvantage, nature } from './avantage-type';

const membre: NonNullable<CaseEquipe> = { pokemon: { uid: 'a', numero: 1, niveau: 1, xp: 0, sexe: 'male', shiny: false,
  favori: false, bonheur: 0, calcium: 0, pierreEternelle: false }, dps: 1, xpMax: 100, multiplicateur: 2 };

it('calcule la moyenne sans les cases vides ni les œufs', () => {
  const oeuf = { ...membre, pokemon: { ...membre.pokemon, oeuf: { pasRestants: 1, pasMax: 10 } } };
  expect(moyenneAvantage([null, oeuf])).toBeNull();
  expect(moyenneAvantage([membre, null, oeuf, { ...membre, multiplicateur: 0.5 }])).toBe(1.25);
  expect(moyenneAvantage([])).toBeNull();
});

it('formate en français et classe les multiplicateurs', () => {
  expect([2, 0.5, 1.64, 1].map(libelleMultiplicateur)).toEqual(['×2', '×0,5', '×1,6', '×1']);
  expect([2, 0.5, 1].map(nature)).toEqual(['fort', 'faible', 'neutre']);
});
