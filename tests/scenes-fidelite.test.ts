import { describe, expect, it } from 'vitest';
import donnees from '../data/regions/kanto/scenes.json';
import { chargerScenes } from '../src/core/scenes';

describe('scènes fidèles à la V1', () => {
  it('garde les zones cliquables de la V1 (une par lieu), toutes à l\'intérieur de l\'image 16:9', () => {
    const scenes = chargerScenes().filter(scene => scene.id !== 'kanto.route-de-ronflex');
    expect(scenes).toHaveLength(4);
    expect(scenes.map(scene => scene.formes.length)).toEqual([5, 1, 1, 1]);
    for (const scene of scenes) {
      for (const forme of scene.formes) {
        const points = forme.forme === 'rect'
          ? [[forme.x, forme.y], [forme.x + forme.l, forme.y + forme.h]]
          : forme.points;
        for (const [x, y] of points) {
          const nom = `${scene.id} ${forme.nom}`;
          expect(x, nom).toBeGreaterThanOrEqual(0);
          expect(x, nom).toBeLessThanOrEqual(1);
          expect(y, nom).toBeGreaterThanOrEqual(0);
          expect(y, nom).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it('conserve les images, ratios, bulles et destinations', () => {
    const scenes = chargerScenes().filter(scene => scene.id !== 'kanto.route-de-ronflex');
    expect(scenes.map(scene => [scene.id, scene.image, scene.ratio])).toEqual([
      ['kanto.bourg-palette', 'decors/bourg-palette.webp', [16, 9]],
      ['kanto.chez-maman', 'decors/chez-maman.webp', [16, 9]],
      ['kanto.chez-blue', 'decors/chez-blue.webp', [16, 9]],
      ['kanto.labo', 'decors/labo.webp', [16, 9]],
    ]);
    expect(scenes[1]!.bulle).toBe("Il n'y a rien à faire ici, sortons.");
    expect(scenes[2]!.bulle).toBeUndefined();
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
