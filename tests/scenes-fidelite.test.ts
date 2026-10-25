import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import donnees from '../data/regions/kanto/scenes.json';
import { chargerScenes } from '../src/core/scenes';

const lignes = readFileSync('legacy/js/ui/update.js', 'utf8').split(/\r?\n/);

describe('scènes fidèles à la V1', () => {
  it('recalcule chaque rectangle et chaque sommet depuis les pixels V1', () => {
    const scenes = chargerScenes();
    const sources = [
      ['kanto.chez-maman', 0, 314, 1166, 656, -17],
      ['kanto.labo', 0, 334, 2048, 2048, 0],
      ['kanto.chez-blue', 0, 362, 1230, 692, 88],
      ['kanto.bourg-palette', 0, 447, 2048, 2048, 0],
      ['kanto.bourg-palette', 1, 450, 2048, 2048, 0],
      ['kanto.bourg-palette', 2, 453, 2048, 2048, 0],
      ['kanto.bourg-palette', 3, 460, 2048, 2048, 0],
      ['kanto.bourg-palette', 4, 437, 2048, 2048, 0],
    ] as const;
    expect(scenes).toHaveLength(4);
    expect(scenes.reduce((total, scene) => total + scene.formes.length, 0)).toBe(sources.length);
    for (const [id, index, ligne, largeur, hauteur, decalage] of sources) {
      const forme = scenes.find(scene => scene.id === id)!.formes[index]!;
      const source = lignes[ligne - 1]!;
      if (forme.forme === 'rect') {
        const pixels = (attribut: string) => Number(source.match(new RegExp(` ${attribut}="(\\d+)"`))![1]);
        expect(forme.x).toBeCloseTo((pixels('x') + decalage) / largeur, 9);
        expect(forme.y).toBeCloseTo(pixels('y') / hauteur, 9);
        expect(forme.l).toBeCloseTo(pixels('width') / largeur, 9);
        expect(forme.h).toBeCloseTo(pixels('height') / hauteur, 9);
      } else {
        const points = source.match(/points="([^"]+)"/)![1]!.split(' ').map(point => point.split(',').map(Number));
        expect(forme.points).toHaveLength(points.length);
        points.forEach(([x, y], i) => {
          expect(forme.points[i]![0]).toBeCloseTo((x! + decalage) / largeur, 9);
          expect(forme.points[i]![1]).toBeCloseTo(y! / hauteur, 9);
        });
      }
    }
  });

  it('conserve les images, ratios, bulles et destinations', () => {
    const scenes = chargerScenes();
    expect(scenes.map(scene => [scene.id, scene.image, scene.ratio])).toEqual([
      ['kanto.bourg-palette', 'scenes/bourg-palette.webp', [1, 1]],
      ['kanto.chez-maman', 'decors/chez-maman.webp', [16, 9]],
      ['kanto.chez-blue', 'decors/chez-blue.webp', [16, 9]],
      ['kanto.labo', 'scenes/labo.webp', [1, 1]],
    ]);
    expect(scenes[1]!.bulle).toBe("Il n'y a rien à faire ici, sortons.");
    expect(scenes[2]!.bulle).toBe('Eh pourquoi il a le droit à une maison en 3D lui ?');
    expect(scenes[0]!.formes.map(forme => forme.zone)).toEqual([
      'kanto.chez-maman', 'kanto.chez-blue', 'kanto.pension', 'kanto.labo', null,
    ]);
    for (const scene of scenes.slice(1)) expect(scene.formes[0]!.zone).toBe('kanto.bourg-palette');
  });

  it('ne modifie pas les entrées et retourne des données indépendantes', () => {
    const entree = structuredClone(donnees);
    const avant = structuredClone(entree);
    const scenes = chargerScenes(entree);
    expect(entree).toEqual(avant);
    scenes[0]!.ratio[0] = 9;
    scenes[0]!.formes[0]!.nom = 'modifié';
    expect(entree).toEqual(avant);
  });
});

describe('validation des scènes', () => {
  it.each([
    ['version', (d: typeof donnees) => { d.version = 2; }],
    ['doublon', (d: typeof donnees) => { d.scenes.push(structuredClone(d.scenes[0]!)); }],
    ['ratio', (d: typeof donnees) => { d.scenes[0]!.ratio[0] = 0; }],
    ['image', (d: typeof donnees) => { d.scenes[0]!.image = ''; }],
    ['nom', (d: typeof donnees) => { d.scenes[0]!.formes[0]!.nom = ''; }],
    ['teinte', (d: typeof donnees) => { d.scenes[0]!.formes[0]!.teinte = ''; }],
  ])('refuse %s avec un diagnostic contextualisé', (_nom, modifier) => {
    const entree = structuredClone(donnees);
    modifier(entree);
    expect(() => chargerScenes(entree)).toThrow(/^Scène invalide \([^)]+\) : /);
  });

  it.each([null, [], {}, { version: 1, scenes: [null] }])('refuse une structure invalide : %j', entree => {
    expect(() => chargerScenes(entree)).toThrow(/^Scène invalide \([^)]+\) : /);
  });

  it.each([
    { x: -0.1 }, { x: NaN }, { x: Infinity }, { x: 1, l: 0.1 }, { h: 0 },
    { forme: 'cercle' }, { inconnu: true }, { zone: 2 },
    { forme: 'polygone', points: [[0, 0], [1, 1]] },
    { forme: 'polygone', points: [[0, 0], [1, 0], [0, 2]] },
  ])('refuse une forme invalide : %j', modification => {
    const entree = structuredClone(donnees);
    Object.assign(entree.scenes[0]!.formes[0]!, modification);
    expect(() => chargerScenes(entree)).toThrow(/^Scène invalide \(kanto.bourg-palette\) : /);
  });
});
