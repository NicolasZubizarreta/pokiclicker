import type { ChargeurRegion, Region } from '../core/region';
import { chargerKanto } from '../core/region-kanto';

const chargeurs = new Map<string, ChargeurRegion>([
  ['kanto', chargerKanto],
]);

export async function chargerRegion(id: string): Promise<Region> {
  const chargeur = chargeurs.get(id);
  if (!chargeur) throw new Error(`Région inconnue : ${id}`);
  return chargeur();
}
