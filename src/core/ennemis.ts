import type { Rarete, Zone } from './monde';
import { chargerPokemon } from './pokemon';
import { reglages } from './reglages';
import { statsDeCombat } from './stats';

const catalogue = chargerPokemon();
export type Ennemi = {
  numero: number; niveau: number; shiny: boolean; boss: boolean;
  capture: number; pv: number; pvMax: number; rarete: Rarete | null; fauche?: true;
};

export function creerEnnemi(zone: Zone, etape: number, alea: () => number,
  options: typeof reglages.combat = reglages.combat, actifs: readonly string[] = []): Ennemi {
  const ligue = zone.type === 'ligue';
  const boss = ligue || etape === options.etapeBoss;
  const adversaire = ligue && etape < zone.etapes ? zone.adversaires![etape - 1]! : zone.boss;
  let pool = zone.sauvages;
  // La V1 tire le shiny avant l'espèce et le niveau ; le boss ne consomme aucun tirage.
  const bonusShiny = options.shiny.find(bonus => actifs.includes(bonus.cle));
  const shiny = !boss && alea() < options.chanceShiny * (bonusShiny?.x ?? 1);
  if (!boss) {
    const repousse = reglages.objetsActifs.repousses.find(r => actifs.includes(r.cle));
    if (repousse) {
      const filtre = pool.filter(s => !repousse.exclues.includes(s.rarete));
      if (filtre.length > 0) pool = filtre;
    }
  }
  let rencontre = pool[0]!;
  if (!boss) {
    const tirage = alea();
    let cumul = 0;
    for (const sauvage of pool) {
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
