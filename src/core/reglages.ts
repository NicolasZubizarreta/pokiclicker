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
  interface: { sauvegardeAutoMs: number; annonceMs: number };
  depart: { argent: number; etape: number; region: NouveauxChampsRegion };
  combat: {
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
