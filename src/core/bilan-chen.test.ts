import { describe, expect, it } from 'vitest';
import { bilanPokedex, messageBilan, ZONES_CITEES } from './bilan-chen';
import type { zonesDeEspece } from './zones-espece';

const catalogue = { liste: [1, 2, 3, 4, 5, 6].map(numero => ({ numero })) };
const zones = (table: Record<number, string[]>): typeof zonesDeEspece => numero =>
  ({ zones: (table[numero] ?? []).map(id => ({ id, nom: id.toUpperCase() })) }) as ReturnType<typeof zonesDeEspece>;

describe('bilan du Pokédex par Chen', () => {
  it('regroupe les espèces manquantes par première zone, les plus fournies d\'abord', () => {
    const bilan = bilanPokedex([1], catalogue, zones({ 2: ['b'], 3: ['b'], 4: ['a'], 5: ['c', 'a'] }));
    expect(bilan).toMatchObject({ nombre: 1, total: 6, manquantes: 5, sansZone: 1 });
    expect(bilan.zones.map(z => [z.id, z.manquantes])).toEqual([['b', 2], ['a', 1], ['c', 1]]);
  });
  it('ne cite que quelques zones', () => {
    const table = { 1: ['a'], 2: ['b'], 3: ['c'], 4: ['d'] };
    expect(bilanPokedex([], { liste: [1, 2, 3, 4].map(numero => ({ numero })) }, zones(table)).zones).toHaveLength(ZONES_CITEES);
  });
  it('dit le nombre, les zones et les espèces sans zone sauvage', () => {
    const texte = messageBilan(bilanPokedex([1], catalogue, zones({ 2: ['b'], 3: ['b'], 4: ['a'], 5: ['a'] })));
    expect(texte).toMatch(/1 espèces sur 6/);
    expect(texte).toMatch(/B \(2\)/);
    expect(texte).toMatch(/1 espèce\(s\) ne se trouvent pas/);
    expect(texte).not.toMatch(/\{/);
  });
  it('félicite un Pokédex complet', () => {
    const texte = messageBilan(bilanPokedex([1, 2, 3, 4, 5, 6], catalogue, zones({})));
    expect(texte).toMatch(/6 espèces sur 6/);
    expect(texte).not.toMatch(/manque/);
  });
});
