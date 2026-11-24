import { expect, it } from 'vitest';
import { compterLignees, lignees, PALIERS_LIGNEES, validerPaliersLignees } from './lignees';
import { registreSucces } from './succes';

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
  expect(resultat.paliers.map(p => p.atteint)).toEqual(PALIERS_LIGNEES.map(() => true));
  expect(compterLignees(familles.slice(0, 5).flat()).paliers.map(p => p.atteint)).toEqual([true, false, false]);
});

it('fixe des paliers atteignables, avec un libellé, dont le dernier est le maximum réel', () => {
  const seuils = PALIERS_LIGNEES.map(p => p.seuil);
  expect(seuils).toEqual([...seuils].sort((a, b) => a - b));
  expect(seuils.at(-1)).toBe(lignees().length);
  PALIERS_LIGNEES.forEach(p => expect(p.libelle.trim()).not.toBe(''));
  // Chaque palier de la mesure « lignees » du registre des succès reste atteignable.
  registreSucces.filter(s => s.mesure === 'lignees').forEach(s => expect(s.seuil).toBeLessThanOrEqual(lignees().length));
});

it('refuse des paliers invalides', () => {
  expect(() => validerPaliersLignees([])).toThrow();
  expect(() => validerPaliersLignees([{ seuil: 5, libelle: 'a' }, { seuil: 5, libelle: 'b' }])).toThrow();
  expect(() => validerPaliersLignees([{ seuil: 5, libelle: ' ' }])).toThrow();
});
