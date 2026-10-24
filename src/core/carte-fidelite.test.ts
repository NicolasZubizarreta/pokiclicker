import { describe, expect, it } from 'vitest';
import fixture from '../../tests/fixtures/v1-zones.json';
import { kanto } from './regions';
import type { FormeCarte } from './monde';

type Geometrie =
  | { forme: 'rect'; x: number; y: number; l: number; h: number }
  | { forme: 'cercle'; x: number; y: number; r: number }
  | { forme: 'polygone'; points: number[][] };

function comparer(forme: FormeCarte, attendu: Geometrie) {
  expect(forme.forme).toBe(attendu.forme);
  if (forme.forme === 'rect' && attendu.forme === 'rect') {
    expect(forme.x).toBeCloseTo(attendu.x, 12);
    expect(forme.y).toBeCloseTo(attendu.y, 12);
    expect(forme.l).toBeCloseTo(attendu.l, 12);
    expect(forme.h).toBeCloseTo(attendu.h, 12);
  } else if (forme.forme === 'cercle' && attendu.forme === 'cercle') {
    expect(forme.x).toBeCloseTo(attendu.x, 12);
    expect(forme.y).toBeCloseTo(attendu.y, 12);
    expect(forme.r).toBeCloseTo(attendu.r, 12);
  } else if (forme.forme === 'polygone' && attendu.forme === 'polygone') {
    expect(forme.points).toHaveLength(attendu.points.length);
    attendu.points.forEach(([x, y], indice) => {
      expect(forme.points[indice]![0]).toBeCloseTo(x!, 12);
      expect(forme.points[indice]![1]).toBeCloseTo(y!, 12);
    });
  }
}

describe('fidélité de la carte de Kanto à la V1', () => {
  it.each(fixture.carte.map((v1, indice) => ({ ...v1, indice })))('conserve $name à l’indice $indice', (v1) => {
    const forme = kanto.carte.formes[v1.indice]!;
    const { largeur, hauteur } = fixture.image;
    const [x, y, a, b] = v1.coords as [number, number, number, number];
    expect(forme.nom).toBe(v1.name);
    expect(forme.teinte).toBe(v1.color);
    if (v1.type === 'rect') {
      comparer(forme, { forme: 'rect', x: x / largeur, y: y / hauteur, l: (a - x) / largeur, h: (b - y) / hauteur });
    } else if (v1.type === 'circle') {
      comparer(forme, { forme: 'cercle', x: x / largeur, y: y / hauteur, r: a / largeur });
    } else {
      expect(v1.type).toBe('polygon');
      const points = [];
      for (let i = 0; i < v1.coords.length; i += 2) {
        points.push([v1.coords[i]! / largeur, v1.coords[i + 1]! / hauteur]);
      }
      comparer(forme, { forme: 'polygone', points });
    }
    if (v1.zoneId === null) {
      expect(forme.zone).toBeNull();
    } else {
      expect(forme.zone).not.toBeNull();
      const zone = kanto.zone(forme.zone!);
      expect(zone.ancienId).toBe(v1.zoneId);
      // La V1 nomme la ville « Céladopole » et l'arène « Arène Cramois'Île » (sans « de ») sur la carte ; les zones V2 portent les noms de leurs arènes.
      if (forme.nom !== 'Céladopole' && forme.nom !== 'Arène Cramois\'Île') expect(forme.nom).toBe(zone.nom);
    }
  });

  it('conserve cinq exemples écrits depuis les pixels V1 (1920 × 1080)', () => {
    const exemples: { nom: string; geometrie: Geometrie }[] = [
      { nom: 'Route 1', geometrie: { forme: 'rect', x: 300 / 1920, y: 694 / 1080, l: 59 / 1920, h: 68 / 1080 } },
      { nom: "Arène d'Argenta", geometrie: { forme: 'cercle', x: 331 / 1920, y: 391 / 1080, r: 37 / 1920 } },
      { nom: 'Mont Sélénite', geometrie: { forme: 'polygone', points: [
        [607 / 1920, 307 / 1080], [652 / 1920, 307 / 1080], [652 / 1920, 353 / 1080], [607 / 1920, 353 / 1080],
      ] } },
      { nom: 'Caverne Azurée', geometrie: { forme: 'polygone', points: [
        [917 / 1920, 180 / 1080], [917 / 1920, 153 / 1080], [927 / 1920, 153 / 1080], [927 / 1920, 146 / 1080],
        [956 / 1920, 145 / 1080], [956 / 1920, 152 / 1080], [966 / 1920, 152 / 1080], [966 / 1920, 180 / 1080],
        [956 / 1920, 180 / 1080], [950 / 1920, 167 / 1080], [934 / 1920, 166 / 1080], [927 / 1920, 180 / 1080],
      ] } },
      { nom: 'Daran Ass', geometrie: { forme: 'rect', x: 308 / 1920, y: 428 / 1080, l: 44 / 1920, h: 46 / 1080 } },
    ];
    for (const exemple of exemples) {
      const forme = kanto.carte.formes.find((forme) => forme.nom === exemple.nom)!;
      comparer(forme, exemple.geometrie);
      if (exemple.nom === 'Daran Ass') expect(forme.zone).toBeNull();
    }
  });

  it('conserve l’ordre de dessin des chevauchements V1', () => {
    for (const [dessous, dessus] of [['Lavanville', 'Tour Pokémon'], ['Sylphe SARL', 'Arène de Safrania']]) {
      const indiceV1 = fixture.carte.findIndex((forme) => forme.name === dessous);
      const suivantV1 = fixture.carte.findIndex((forme) => forme.name === dessus);
      expect(indiceV1).toBeGreaterThanOrEqual(0);
      expect(suivantV1).toBeGreaterThan(indiceV1);
      expect(kanto.carte.formes.findIndex((forme) => forme.nom === dessous)).toBe(indiceV1);
      expect(kanto.carte.formes.findIndex((forme) => forme.nom === dessus)).toBe(suivantV1);
    }
  });

  it('compare exactement 24 formes dont deux sans zone', () => {
    expect(fixture.carte).toHaveLength(24);
    expect(kanto.carte.formes).toHaveLength(24);
    expect(fixture.carte.filter((forme) => forme.zoneId === null)).toHaveLength(2);
    expect(kanto.carte.formes.filter((forme) => forme.zone === null)).toHaveLength(2);
  });
});
