import donnees from '../../data/reglages.json';
import type { NouveauxChampsRegion } from './sauvegarde-types';
import type { Rarete } from './monde';

export type Bonus = { cle: string; x: number; arrondi?: boolean };

export type ReglagesRecompenses = {
  niveauMax: number;
  or: {
    coefNiveau: number; exposant: number; boss: number;
    rarete: Partial<Record<Rarete, number>>;
    bonusAvantArrondi: Bonus[]; bonus: Bonus[]; shiny: number;
  };
  xp: { coefPv: number; boss: number; minimum: number; bonus: Bonus[] };
  shiny: { objet: string; quantite: number };
  maxXp: {
    coef: number; exposant: number;
    faible: { sous: number; x: number }; fort: { dessus: number; x: number };
  };
  bonheur: { gain: number; max: number; ecartMax: number };
};

export type ReglagesDelais = {
  ennemiSuivantMs: number;
  remplacements: { cle: string; ms: number }[];
  reducteurs: ({ cle: string; diviseur: number } | { cle: string; x: number })[];
};

export const reglages: {
  equipe: { taille: number; surnomMax: number };
  pc: { zone: string; raison: string };
  interface: {
    sauvegardeAutoMs: number; annonceMs: number;
    // Calendrier V1 : legacy/js/game/save.js L759-797.
    vol: { poseMs: number; delaiOuvertureMs: number; volMs: number; fermetureMs: number; imageMs: number; images: number; pisteMs: number; traitsMs: number; fonduReduitMs: number; changerReduitMs: number; tailleDresseurRatio: number };
  };
  carte: { zoomMax: number; deblocageMs: number; seuilGlissementPx: number; diviseurMolette: number; rayonCiblePx: number };
  depart: { argent: number; etape: number; region: NouveauxChampsRegion };
  combat: {
    minuteurBossMs: number;
    clicBase: number; clicPartDps: number; pvParNiveau: number; pvBoss: number;
    chanceShiny: number; clicsMaxParSeconde: number; fenetreClicsMs: number; etapeBoss: number;
  };
  bonus: { dps: Bonus[]; clic: Bonus[] };
  recompenses: ReglagesRecompenses;
  delais: ReglagesDelais;
  boucle: { pasMs: number; rattrapageMaxMs: number; notificationMinMs: number };
  stats: {
    puissanceDiviseur: number;
    pv: { coefPv: number; coefDefense: number; coefDefenseSpe: number; constante: number };
  };
  degats: {
    diviseurNiveau: number;
    shiny: number;
    bonheurParPoint: number;
    pierreEternelle: number;
    calciumParBoost: number;
  };
} = donnees;

for (const valeur of Object.values(reglages.equipe)) {
  if (!Number.isSafeInteger(valeur) || valeur <= 0) throw new Error('Réglages d’équipe invalides');
}

if (!reglages.pc.zone || !reglages.pc.raison) throw new Error('Réglages du PC invalides');

if (!Number.isFinite(reglages.combat.minuteurBossMs) || reglages.combat.minuteurBossMs <= 0) {
  throw new Error('Minuteur de boss invalide');
}

for (const valeur of Object.values(reglages.interface.vol)) {
  if (!Number.isFinite(valeur) || valeur <= 0) throw new Error('Réglages de vol invalides');
}
for (const valeur of Object.values(reglages.carte)) {
  if (!Number.isFinite(valeur) || valeur <= 0) throw new Error('Réglages de carte invalides');
}
