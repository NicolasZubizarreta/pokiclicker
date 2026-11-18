import type { chargerMonde } from './monde';
import type { Scene } from './scenes';

export type Region = {
  id: string;
  monde: ReturnType<typeof chargerMonde>;
  scenes: Scene[];
  positionsCarte: Record<string, { x: number; y: number }>;
};

export type ChargeurRegion = () => Promise<Region>;
