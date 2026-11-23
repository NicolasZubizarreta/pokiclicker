import { expect, it } from 'vitest';
import { compterLignees, lignees } from './lignees';

it('inclut les chemins par niveau et pierre et exclut les familles à deux stades', () => {
  const familles = lignees();
  expect(familles).toContainEqual([1, 2, 3]);
  expect(familles).toContainEqual([43, 44, 45]);
  expect(familles.some(f => f.includes(133) || f.includes(25))).toBe(false);
  expect(familles.map(f => f[0])).toEqual(familles.map(f => f[0]).sort((a, b) => a - b));
});

it('compte uniquement les chemins complets sans compter les doublons', () => {
  expect(compterLignees([1, 2, 2]).completes).toBe(0);
  expect(compterLignees([1, 2, 3, 3]).completes).toBe(1);
  const familles = lignees();
  const resultat = compterLignees(familles.flat());
  expect(resultat.total).toBe(familles.length);
  expect(resultat.completes).toBe(familles.length);
  expect(resultat.paliers).toEqual([10, 25, 50].map(seuil => ({ seuil, atteint: familles.length >= seuil })));
  expect(compterLignees(familles.slice(0, 10).flat()).paliers[0]?.atteint).toBe(true);
});
