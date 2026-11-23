import { expect, it } from 'vitest';
import { lignesRencontres } from './rencontres';

it('ne déduit aucune rencontre des anciennes captures', () => {
  expect(lignesRencontres(undefined)).toEqual([]);
});

it('présente les trois compteurs, y compris zéro', () => {
  expect(lignesRencontres({ vus: 37, captures: 4, depuisShiny: 0 })).toEqual([
    { libelle: 'Rencontrés', valeur: '37' },
    { libelle: 'Capturés', valeur: '4' },
    { libelle: 'Depuis le dernier chromatique', valeur: '0' },
  ]);
});
