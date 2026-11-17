import type { DonneesRegion } from './sauvegarde-types';
import { noterEclosion } from './pension';

export function especesShiny(region: Pick<DonneesRegion, 'especesShiny'>): readonly number[] {
  return region.especesShiny ?? [];
}

export function especesEclosesShiny(region: Pick<DonneesRegion, 'especesEclosesShiny'>): readonly number[] {
  return region.especesEclosesShiny ?? [];
}

/** Inscrit une obtention dans ses collections, sans modifier la région reçue. */
export function noterObtention(region: DonneesRegion, numero: number, attributs: { shiny?: boolean; eclos?: boolean }): DonneesRegion {
  let suivante = attributs.eclos ? noterEclosion(region, numero) : region;
  if (attributs.shiny) {
    if (!especesShiny(suivante).includes(numero)) suivante = { ...suivante, especesShiny: [...especesShiny(suivante), numero] };
    if (attributs.eclos && !especesEclosesShiny(suivante).includes(numero)) {
      suivante = { ...suivante, especesEclosesShiny: [...especesEclosesShiny(suivante), numero] };
    }
  }
  return suivante;
}
