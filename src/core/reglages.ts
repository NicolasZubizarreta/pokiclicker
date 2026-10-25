import donnees from '../../data/reglages.json';
import type { DonneesRegion, NouveauxChampsRegion, PreferencesCombat } from './sauvegarde-types';
import type { Rarete } from './monde';

export type Bonus = { cle: string; x: number; arrondi?: boolean };

export type ReglagesCapture = {
  balles: { cle: string; nom: string; image: string; multiplicateur: number }[];
  multiplicateurCertain: number; bonus: Bonus[];
  animationMs: number; reapparitionMs: number; raisonImpossible: string;
};

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
  badges: { ouvertureMs: number; claqueDelaiMs: number; claqueMs: number };
  pc: { zone: string; raison: string };
  shop: { zone: string; raison: string };
  sac: { zone: string; raison: string };
  boutique: { inflationParBadge: number; palierRemise: number; remise: number; quantiteMax: number; reportes: string[] };
  objetsActifs: {
    dureeMs: number;
    rechargeFauchageMs: number;
    temporises: Record<'xAttack' | 'xSpecial' | 'repel' | 'superRepel', {
      chrono: keyof DonneesRegion['chronos'];
      cle: string;
      message: string;
      pastille: string;
    }>;
    repousses: { cle: string; exclues: string[] }[];
    raretes: Record<Rarete | 'conseil-4' | 'maitre', string>;
  };
  interface: {
    sauvegardeAutoMs: number; annonceMs: number;
    // Calendrier V1 : legacy/js/game/save.js L759-797.
    vol: { poseMs: number; delaiOuvertureMs: number; volMs: number; fermetureMs: number; imageMs: number; images: number; pisteMs: number; traitsMs: number; fonduReduitMs: number; changerReduitMs: number; tailleDresseurRatio: number };
  };
  carte: { zoomMax: number; deblocageMs: number; seuilGlissementPx: number; diviseurMolette: number; rayonCiblePx: number };
  depart: { argent: number; etape: number; region: NouveauxChampsRegion; preferences: PreferencesCombat };
  combat: {
    autoClicIntervalleMs: number;
    minuteurBossMs: number;
    clicBase: number; clicPartDps: number; pvParNiveau: number; pvBoss: number;
    chanceShiny: number; clicsMaxParSeconde: number; fenetreClicsMs: number; etapeBoss: number;
  };
  bonus: { dps: Bonus[]; clic: Bonus[] };
  recompenses: ReglagesRecompenses;
  capture: ReglagesCapture;
  evolution: { animationMs: number; alternanceMs: number };
  delais: ReglagesDelais;
  boucle: { pasMs: number; rattrapageMaxMs: number; notificationMinMs: number };
  stats: {
    puissanceDiviseur: number;
    pv: { coefPv: number; coefDefense: number; coefDefenseSpe: number; constante: number };
  };
  degats: {
    calciumMax: number;
    diviseurNiveau: number;
    shiny: number;
    bonheurParPoint: number;
    pierreEternelle: number;
    calciumParBoost: number;
  };
} = donnees as typeof reglages;

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

const capture = reglages.capture;
if (!capture.raisonImpossible || !capture.balles.length
  || new Set(capture.balles.map((balle) => balle.cle)).size !== capture.balles.length
  || capture.balles.some((balle) => !balle.cle || !balle.nom || !balle.image
    || !Number.isFinite(balle.multiplicateur) || balle.multiplicateur <= 0)
  || [capture.multiplicateurCertain, capture.animationMs, capture.reapparitionMs]
    .some((valeur) => !Number.isFinite(valeur) || valeur <= 0)
  || capture.bonus.some((bonus) => !bonus.cle || !Number.isFinite(bonus.x) || bonus.x <= 0)) {
  throw new Error('Réglages de capture invalides');
}
if (typeof reglages.depart.preferences.autoAttaque !== 'boolean'
  || Object.values(reglages.depart.preferences.arretAuto).some((valeur) => typeof valeur !== 'boolean')) {
  throw new Error('Préférences de combat invalides');
}
