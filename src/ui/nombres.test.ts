import { expect, it } from 'vitest';
import { formaterDps, jetonsTexte } from './nombres';

it('arrondit les DPS sans décimale superflue', () => {
  expect(formaterDps(95.27399999999999)).toBe('95');
  expect(formaterDps(234)).toBe('234');
  expect(formaterDps(281.9232)).toBe('282');
});

it('accorde « jeton » : 0 et 1 au singulier, 2 et plus au pluriel', () => {
  expect(jetonsTexte(0)).toBe('0 jeton');
  expect(jetonsTexte(1)).toBe('1 jeton');
  expect(jetonsTexte(2)).toBe('2 jetons');
  expect(jetonsTexte(12345)).toBe('12 345 jetons');
});
