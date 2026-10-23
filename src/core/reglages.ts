import donnees from '../../data/reglages.json';

export type Bonus = { cle: string; x: number; arrondi?: boolean };

export const reglages: {
  combat: {
    clicBase: number; clicPartDps: number; pvParNiveau: number; pvBoss: number;
    chanceShiny: number; clicsMaxParSeconde: number; fenetreClicsMs: number; etapeBoss: number;
  };
  bonus: { dps: Bonus[]; clic: Bonus[] };
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
