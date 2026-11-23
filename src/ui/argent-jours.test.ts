import { expect, it } from 'vitest';
import { joursRecents } from './argent-jours';

it('traverse le changement d’année et complète les jours absents', () => {
  const jours = joursRecents({ '2025-12-26': 99, '2025-12-27': 4, '2026-01-02': 7 }, new Date(2026, 0, 2));
  expect(jours.map(j => j.valeur)).toEqual([4, 0, 0, 0, 0, 0, 7]);
  expect(jours[6]).toEqual({ cle: '2026-01-02', libelle: 'ven.', valeur: 7 });
});
