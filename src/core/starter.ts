import type { DonneesRegion } from './sauvegarde-types';
import { tirerSexe } from './sexe';

type Pokemon = DonneesRegion['equipe'][number];

export function tirerStarters(alea: () => number, chance: number): Record<1 | 4 | 7, boolean> {
  return { 1: alea() < chance, 4: alea() < chance, 7: alea() < chance };
}

export function creerStarter(
  numero: number, shiny: boolean, alea: () => number, genererId: () => string,
): Pokemon {
  return {
    uid: genererId(), numero, niveau: 5, xp: 0, shiny,
    bonheur: 0, pierreEternelle: false, calcium: 0,
    sexe: tirerSexe(numero, alea), favori: false,
  };
}

export function choisirStarter(region: DonneesRegion, pokemon: Pokemon): DonneesRegion {
  return {
    ...region,
    equipe: [pokemon],
    starterId: pokemon.numero,
    drapeaux: region.drapeaux.includes('starter-choisi')
      ? [...region.drapeaux] : [...region.drapeaux, 'starter-choisi'],
  };
}
