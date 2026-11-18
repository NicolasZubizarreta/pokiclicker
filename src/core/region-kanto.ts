import { chargerMonde } from './monde';
import type { FichierZones } from './monde';
import type { ChargeurRegion } from './region';
import { chargerScenes } from './scenes';

export const chargerKanto: ChargeurRegion = async () => {
  const [zones, scenes, positions] = await Promise.all([
    import('../../data/regions/kanto/zones.json'),
    import('../../data/regions/kanto/scenes.json'),
    import('../../data/regions/kanto/carte-positions.json'),
  ]);
  return {
    id: 'kanto',
    monde: chargerMonde(zones.default as FichierZones),
    scenes: chargerScenes(scenes.default),
    positionsCarte: positions.default as Record<string, { x: number; y: number }>,
  };
};
