import { describe, expect, it } from 'vitest';
import { lireCibles, validerCibles } from '../scripts/comparer-equilibrage.mjs';

const reference = () => JSON.parse(lireCibles());

describe('cibles proposées (ticket D)', () => {
  it('valide le schéma et toutes les zones de combat', () => {
    expect(validerCibles(lireCibles()).erreurs).toEqual([]);
  });

  it.each([
    ['zone inconnue', (c: ReturnType<typeof reference>) => { c.zones.inconnue = c.zones['kanto.route-1']; }],
    ['zone manquante', (c: ReturnType<typeof reference>) => { delete c.zones['kanto.route-1']; }],
    ['temps négatif', (c: ReturnType<typeof reference>) => { c.zones['kanto.route-1'].tempsVisMinutes = -1; }],
    ['temps non numérique', (c: ReturnType<typeof reference>) => { c.zones['kanto.route-1'].tempsVisMinutes = '1'; }],
    ['marge impossible', (c: ReturnType<typeof reference>) => { c.zones['kanto.route-1'].margeVisee = -2; }],
    ['marge non finie', (c: ReturnType<typeof reference>) => { c.zones['kanto.route-1'].margeVisee = Infinity; }],
    ['total incompatible', (c: ReturnType<typeof reference>) => { c.zones['kanto.route-1'].tempsVisMinutes = 100; }],
    ['tolérance négative', (c: ReturnType<typeof reference>) => { c.tolerance = -1; }],
    ['protocole invalide', (c: ReturnType<typeof reference>) => { c.protocole.starter = 2; }],
    ['bornes inversées', (c: ReturnType<typeof reference>) => { c.ligue.minMinutes = 100; }],
  ])('rejette %s sans simulation', (_nom, modifier) => {
    const cibles = reference();
    modifier(cibles);
    expect(validerCibles(cibles).erreurs.length).toBeGreaterThan(0);
  });

  it('signale les doublons dans le JSON brut', () => {
    const brut = lireCibles().replace('"zones": {', '"zones": { "kanto.route-1": {},');
    expect(validerCibles(brut).erreurs).toContain('Doublon : kanto.route-1');
  });

  it.each(['{', 'null', '[]'])('rejette un document invalide : %s', source => {
    expect(validerCibles(source).erreurs.length).toBeGreaterThan(0);
  });
});
