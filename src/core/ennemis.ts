import type { Rarete, Zone } from './monde';
import { chargerPokemon } from './pokemon';
import { reglages } from './reglages';
import { statsDeCombat } from './stats';
import { chaineDesActifs, multiplicateurChaine } from './chaines';

const catalogue = chargerPokemon();
export type Ennemi = {
  numero: number; niveau: number; shiny: boolean; boss: boolean;
  capture: number; pv: number; pvMax: number; rarete: Rarete | null; fauche?: true; /** Lancers de balle ratés sur cet ennemi (pitié de la capture). */ echecs?: number;
};

export function creerEnnemi(zone: Zone, etape: number, alea: () => number,
  options: typeof reglages.combat = reglages.combat, actifs: readonly string[] = []): Ennemi {
  const ligue = zone.type === 'ligue';
  const boss = ligue || etape === options.etapeBoss;
  const adversaire = ligue && etape < zone.etapes ? zone.adversaires![etape - 1]! : zone.boss;
  let pool = zone.sauvages;
  let repousseActive = false;
  // La V1 tire le shiny avant l'espèce et le niveau ; le boss ne consomme aucun tirage.
  const bonusShiny = options.shiny.find(bonus => actifs.includes(bonus.cle));
  // Le tirage reste fait avant l'espèce (même suite de nombres au hasard) ; la chaîne ne joue qu'une fois l'espèce connue.
  const tirageShiny = boss ? null : alea();
  if (!boss) {
    const repousse = reglages.objetsActifs.repousses.find(r => actifs.includes(r.cle));
    if (repousse) {
      const filtre = pool.filter(s => !repousse.exclues.includes(s.rarete));
      if (filtre.length > 0) { pool = filtre; repousseActive = true; }
    }
  }
  let rencontre = pool[0]!;
  if (!boss) {
    // Repousse : le pool filtré ne totalise plus 1, le tirage se normalise sur sa somme (B-core-03).
    // Hors Repousse, le comportement de la zone (repli sur le premier) ne change pas.
    const tirage = alea() * (repousseActive ? pool.reduce((somme, sauvage) => somme + sauvage.apparition, 0) : 1);
    let cumul = 0;
    for (const sauvage of pool) {
      cumul += sauvage.apparition;
      if (cumul >= tirage) { rencontre = sauvage; break; }
    }
  }
  const numero = boss ? adversaire.pokemon : rencontre.pokemon;
  const niveau = boss ? adversaire.niveau
    : Math.floor(alea() * (zone.niveaux[1] - zone.niveaux[0] + 1)) + zone.niveaux[0];
  const chaine = chaineDesActifs(actifs);
  const facteurChaine = chaine && chaine.numero === numero ? multiplicateurChaine(chaine.longueur, options.chaines) : 1;
  const shiny = tirageShiny !== null && tirageShiny < options.chanceShiny * (bonusShiny?.x ?? 1) * facteurChaine;
  const pvMax = Math.floor(statsDeCombat(catalogue.parNumero(numero)).pv * niveau
    * options.pvParNiveau * zone.multiplicateurPv) * (boss ? options.pvBoss : 1);
  return { numero, niveau, shiny, boss, rarete: boss ? null : rencontre.rarete,
    capture: ligue ? 0 : boss ? adversaire.capture : rencontre.capture, pv: pvMax, pvMax };
}
