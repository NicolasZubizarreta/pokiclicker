import { expect, it } from 'vitest';
import { formaterDuree, formaterTempsBoss } from './duree';

it('affiche les minutes entières et les dixièmes de seconde du boss', () => {
  expect(formaterDuree(59_999)).toBe("moins d'une minute");
  expect(formaterDuree(60_000)).toBe('1 min');
  expect(formaterDuree(754 * 60_000)).toBe('12 h 34 min');
  expect(formaterTempsBoss(null)).toBe('—');
  expect(formaterTempsBoss(12_399)).toBe('12,4 s');
});
