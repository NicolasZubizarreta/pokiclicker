import { expect, it } from 'vitest';
import { suiviVide } from '../core/suivi';
import { creerLectureSuivi, dateLocale } from './suivi-store';

it('utilise les composantes locales et complète le mois et le jour', () => {
  expect(dateLocale(new Date(2026, 0, 2, 0, 5).getTime())).toBe('2026-01-02');
  expect(dateLocale(new Date(2026, 11, 31, 23, 59).getTime())).toBe('2026-12-31');
});

it('garde la référence tant que le suivi ne change pas', () => {
  const lire = creerLectureSuivi();
  expect(lire({})).toBe(lire({}));
  const suivi = suiviVide();
  const avant = lire({ suivi });
  expect(lire({ suivi })).toBe(avant);
  expect(lire({ suivi: { ...suivi, captures: 1 } })).not.toBe(avant);
});
