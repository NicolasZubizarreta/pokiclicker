import { kanto } from '../../core/regions';

export function nomZone(id: string) {
  if (!id) return 'Non disponible';
  try { return kanto.zone(id).nom; } catch { return id; }
}
export function nomRegion(id: string) {
  return id.charAt(0).toUpperCase() + id.slice(1);
}
export function duree(ms: number | null) {
  if (ms === null) return 'Non disponible';
  const minutes = Math.floor(ms / 60_000);
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`;
}
