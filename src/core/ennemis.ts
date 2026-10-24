import type { Rarete, Zone } from './monde';
import { chargerPokemon } from './pokemon';
import { reglages } from './reglages';
import { statsDeCombat } from './stats';

const catalogue = chargerPokemon();
export type Ennemi = {
  numero: number; niveau: number; shiny: boolean; boss: boolean;
  capture: number; pv: number; pvMax: number; rarete: Rarete | null;
};

export function creerEnnemi(zone: Zone, etape: number, alea: () => number,
  options: typeof reglages.combat = reglages.combat): Ennemi {
  const ligue = zone.type === 'ligue';
  const boss = ligue || etape === options.etapeBoss;
  const adversaire = ligue && etape < options.etapeBoss ? zone.adversaires![etape - 1]! : zone.boss;
  let rencontre = zone.sauvages[0]!;
  // La V1 tire le shiny avant l'espèce et le niveau ; le boss ne consomme aucun tirage.
  const shiny = !boss && alea() < options.chanceShiny;
  if (!boss) {
    const tirage = alea();
    let cumul = 0;
    for (const sauvage of zone.sauvages) {
      cumul += sauvage.apparition;
      if (cumul >= tirage) { rencontre = sauvage; break; }
    }
  }
  const numero = boss ? adversaire.pokemon : rencontre.pokemon;
  const niveau = boss ? adversaire.niveau
    : Math.floor(alea() * (zone.niveaux[1] - zone.niveaux[0] + 1)) + zone.niveaux[0];
  const pvMax = Math.floor(statsDeCombat(catalogue.parNumero(numero)).pv * niveau
    * options.pvParNiveau * zone.multiplicateurPv) * (boss ? options.pvBoss : 1);
  return { numero, niveau, shiny, boss, rarete: boss ? null : rencontre.rarete,
    capture: ligue ? 0 : boss ? adversaire.capture : rencontre.capture, pv: pvMax, pvMax };
}
