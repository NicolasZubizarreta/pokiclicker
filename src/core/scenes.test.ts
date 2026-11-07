import { describe, expect, it } from 'vitest';
import { chargerScenes, partieUtile, ratioUtile } from './scenes';

const fichier = (recadrage?: unknown) => ({
  version: 1,
  scenes: [{ id: 'kanto.test', image: 'decors/test.webp', ratio: [16, 9], formes: [], ...(recadrage ? { recadrage } : {}) }],
});

describe('recadrage des scènes', () => {
  it('sans recadrage, la partie utile est l’image entière et le ratio celui de l’image', () => {
    const [scene] = chargerScenes(fichier());
    expect(partieUtile(scene!)).toEqual({ x: 0, y: 0, l: 1, h: 1 });
    expect(ratioUtile(scene!)).toBeCloseTo(16 / 9, 6);
  });

  it('avec recadrage, le ratio suit la partie conservée', () => {
    const [scene] = chargerScenes(fichier({ x: 0.25, y: 0, l: 0.5, h: 1 }));
    expect(ratioUtile(scene!)).toBeCloseTo(8 / 9, 6);
  });

  it('refuse un recadrage vide ou hors de l’image', () => {
    expect(() => chargerScenes(fichier({ x: 0.6, y: 0, l: 0.5, h: 1 }))).toThrow(/Scène invalide \(kanto\.test\)/);
    expect(() => chargerScenes(fichier({ x: 0, y: 0, l: 0, h: 1 }))).toThrow(/Scène invalide/);
  });

  it('les lieux d’intro de Kanto sont recadrés sur leur partie utile, plus étroite que l’image entière', () => {
    const scenes = chargerScenes();
    for (const id of ['kanto.chez-maman', 'kanto.chez-blue', 'kanto.labo']) {
      const scene = scenes.find(s => s.id === id)!;
      expect(scene.recadrage, id).toBeDefined();
      expect(partieUtile(scene).l * partieUtile(scene).h, id).toBeLessThan(1);
    }
  });
});
