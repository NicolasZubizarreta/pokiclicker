import donnees from '../../data/reglages.json';

export const reglages: {
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
