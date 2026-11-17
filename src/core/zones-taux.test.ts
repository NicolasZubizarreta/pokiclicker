import { describe, expect, it } from 'vitest';
import zones from '../../data/regions/kanto/zones.json';

type Zone = { id: string; sauvages?: { pokemon: number; apparition: number }[] };
const liste = (Array.isArray(zones) ? zones : (zones as { zones: Zone[] }).zones) as Zone[];
const taux = (zone: string) => Object.fromEntries(liste.find(z => z.id === zone)!.sauvages!.map(s => [s.pokemon, s.apparition]));

describe('taux d\'apparition de Kanto', () => {
  it.each(liste.filter(zone => zone.sauvages?.length))('$id : les taux font 100 %', zone => {
    const somme = zone.sauvages!.reduce((total, sauvage) => total + sauvage.apparition, 0);
    expect(somme).toBeCloseTo(1, 9);
  });

  it('applique les taux du retour testeur du 17/11 (ticket T)', () => {
    expect(taux('kanto.pont-pepite')).toMatchObject({ 151: 0.005, 63: 0.305 });
    expect(taux('kanto.iles-ecume')).toMatchObject({ 144: 0.02, 86: 0.21, 90: 0.21, 98: 0.155, 116: 0.155, 73: 0.15, 87: 0.1 });
    expect(taux('kanto.caverne-azuree')).toMatchObject({ 150: 0.01, 47: 0.21, 64: 0.21, 26: 0.26, 148: 0.31 });
    expect(taux('kanto.route-victoire')).toMatchObject({ 146: 0.02, 67: 0.31, 75: 0.31, 42: 0.26, 149: 0.1 });
    expect(taux('kanto.centrale')[145]).toBe(0.02);
  });
});
