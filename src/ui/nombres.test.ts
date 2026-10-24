import { expect, it } from 'vitest';
import { formaterDps } from './nombres';

it('affiche les DPS avec une décimale au plus, à la française', () => {
  expect(formaterDps(95.27399999999999)).toBe('95,3');
  expect(formaterDps(234)).toBe('234');
  expect(formaterDps(281.9232)).toBe('281,9');
});
