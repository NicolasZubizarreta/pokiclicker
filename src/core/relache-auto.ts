import { calculerOr, type Victoire } from './recompenses';
import { reglages } from './reglages';
import type { DonneesRegion } from './sauvegarde-types';

export function estDoublonCapture(pokedex: readonly number[], numero: number, shiny: boolean): boolean {
  return !shiny && pokedex.includes(numero);
}

export function capturerDoublon(region: DonneesRegion, prise: Victoire, actifs: readonly string[]): DonneesRegion {
  return { ...region, argent: region.argent + calculerOr(prise, actifs) * reglages.recompenses.or.capture };
}

export function doublonsEclos(especesAvant: readonly number[], eclosions: readonly { uid: string; numero: number; shiny: boolean }[]): string[] {
  const especes = new Set(especesAvant);
  const uids: string[] = [];
  for (const eclosion of eclosions) {
    if (!eclosion.shiny && especes.has(eclosion.numero)) uids.push(eclosion.uid);
    especes.add(eclosion.numero);
  }
  return uids;
}

export function retirerDeLEquipe(region: DonneesRegion, uids: readonly string[]): DonneesRegion {
  const equipe = region.equipe.filter(p => !uids.includes(p.uid));
  if (equipe.length === 0 && region.equipe.length > 0) equipe.push(region.equipe[region.equipe.length - 1]!);
  return { ...region, equipe };
}
