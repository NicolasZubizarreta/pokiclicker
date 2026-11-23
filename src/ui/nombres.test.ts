import { expect, it } from 'vitest';
import { formaterDps } from './nombres';

it('arrondit les DPS sans décimale superflue', () => {
  expect(formaterDps(95.27399999999999)).toBe('95');
  expect(formaterDps(234)).toBe('234');
  expect(formaterDps(281.9232)).toBe('282');
});
