import surchargesParDefaut from '../../data/surcharges-stats.json';
import { chargerPokemon } from './pokemon';
import type { Pokemon, StatsBase } from './pokemon';
import { reglages } from './reglages';

export type SurchargeStats = { pokemon: number; puissance?: number; pv?: number; raison?: string };

export function puissanceDeBase(stats: StatsBase): number {
  return Math.floor((stats.pv + stats.attaque + stats.defense + stats.attaqueSpe + stats.defenseSpe + stats.vitesse)
    / reglages.stats.puissanceDiviseur);
}

export function pvDeBase(stats: StatsBase): number {
  const { coefPv, coefDefense, coefDefenseSpe, constante } = reglages.stats.pv;
  return Math.floor(coefPv * stats.pv + coefDefense * stats.defense + coefDefenseSpe * stats.defenseSpe + constante);
}

export function statsDeCombat(pokemon: Pokemon, surcharges: SurchargeStats[] = surchargesParDefaut) {
  const surcharge = surcharges.find((valeur) => valeur.pokemon === pokemon.numero);
  return {
    puissance: surcharge?.puissance ?? puissanceDeBase(pokemon.stats),
    pv: surcharge?.pv ?? pvDeBase(pokemon.stats),
  };
}

type EntreeDps = {
  numero: number;
  niveau: number;
  shiny?: boolean;
  bonheur?: number;
  pierreEternelle?: boolean;
  calcium?: number;
  multiplicateurType?: number;
};

const catalogueParDefaut = chargerPokemon();

export function calculerDps(
  entree: EntreeDps,
  catalogue: Pick<ReturnType<typeof chargerPokemon>, 'parNumero'> = catalogueParDefaut,
  surcharges: SurchargeStats[] = surchargesParDefaut,
): number {
  const { puissance } = statsDeCombat(catalogue.parNumero(entree.numero), surcharges);
  const bonus = reglages.degats;
  return puissance * entree.niveau / bonus.diviseurNiveau
    * (entree.multiplicateurType ?? 1)
    * (entree.shiny ? bonus.shiny : 1)
    * (1 + (entree.bonheur ?? 0) * bonus.bonheurParPoint)
    * (entree.pierreEternelle ? bonus.pierreEternelle : 1)
    * (1 + (entree.calcium ?? 0) * bonus.calciumParBoost);
}
