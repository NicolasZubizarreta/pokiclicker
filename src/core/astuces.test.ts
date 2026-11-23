import { expect, it } from 'vitest';
import { chargerAstuces, tirerAstuce } from './astuces';

it('charge des astuces uniques et courtes', () => {
  const astuces = chargerAstuces();
  expect(astuces.length).toBeGreaterThanOrEqual(30);
  expect(new Set(astuces).size).toBe(astuces.length);
  expect(astuces.every(texte => texte.length <= 110)).toBe(true);
  expect(tirerAstuce(() => 0)).toBe(astuces[0]);
  expect(tirerAstuce(() => 0.999)).toBe(astuces.at(-1));
});
it('refuse les données mal formées', () => {
  for (const source of [null, {}, { version: 2, astuces: [] }, { version: 1, astuces: [] },
    { version: 1, astuces: Array(30).fill('Doublon') },
    { version: 1, astuces: [...chargerAstuces(), 'a'.repeat(111)] }]) {
    expect(() => chargerAstuces(source)).toThrow();
  }
});
