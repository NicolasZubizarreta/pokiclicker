import { calculerDpsEquipe, type MembreEquipe } from './combat';
import { creerEnnemi } from './ennemis';
import type { Zone } from './monde';
import { chargerPokemon } from './pokemon';
import { reglages } from './reglages';

export type ApercuBoss = {
  numero: number; niveau: number; pvMax: number; types: string[]; chronoMs: number;
  dps: number; secondesPourVaincre: number | null; assezRapide: boolean;
};

export function apercuBoss(zone: Zone, equipe: readonly MembreEquipe[], actifs: readonly string[],
  alea: () => number): ApercuBoss | null {
  if (zone.id === 'kanto.labo' || zone.id.startsWith('evenement:')
    || (zone.type !== 'ligue' && zone.etapes !== reglages.combat.etapeBoss)) return null;
  const boss = creerEnnemi(zone, zone.etapes, alea, reglages.combat, actifs);
  if (!boss.boss) return null;
  // Estimation du DPS automatique seul, sans les clics.
  const dps = calculerDpsEquipe(equipe, boss, actifs);
  const secondesPourVaincre = dps > 0 ? Math.ceil(boss.pvMax / dps) : null;
  const chronoMs = reglages.combat.minuteurBossMs;
  return { numero: boss.numero, niveau: boss.niveau, pvMax: boss.pvMax,
    types: [...chargerPokemon().parNumero(boss.numero).types], chronoMs, dps, secondesPourVaincre,
    assezRapide: secondesPourVaincre !== null && secondesPourVaincre * 1000 <= chronoMs };
}
