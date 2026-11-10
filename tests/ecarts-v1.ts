// Écarts voulus avec la V1 (rapports de Nicolas du 28/10/2026, tickets AA, AB et AC). Les fixtures V1 restent la référence :
// ces écarts sont les seuls permis dans les tests de fidélité, et chacun est une décision, pas un oubli.
// Les pierres (cinq d'évolution et Pierre Stase) coûtent 8 000 de base et gardent l'inflation par badge.
export const ECARTS_V1: Record<string, { prix?: number; sansInflation?: boolean }> = {
  calcium: { prix: 20000 },
  fireStone: { prix: 8000 },
  waterStone: { prix: 8000 },
  leafStone: { prix: 8000 },
  thunderStone: { prix: 8000 },
  moonStone: { prix: 8000 },
  everstone: { prix: 8000 },
};

// Tickets AB et J : les gains V1 suivent le multiplicateur global ; la capture garde son facteur V1 de 2.
import { reglages } from '../src/core/reglages';

export const MULTIPLICATEUR_OR_V2 = reglages.recompenses.or.multiplicateur;
export const MULTIPLICATEUR_OR_CAPTURE_V1 = 2;

// Ticket W (10/11/2026) : la pénalité de niveau de la capture passe de 1 + niveau/25 (V1) à 1 + niveau/100, sans échec
// précédent (la pitié ne joue pas). Chance V2 attendue en pourcentage, plafonnée à 100 comme l'affichage de la V1.
export const DIVISEUR_NIVEAU_V1 = 25;
export function chanceCaptureAttendueV2(chanceV1Pourcent: number, niveau: number): number {
  const rapport = (1 + niveau / DIVISEUR_NIVEAU_V1) / (1 + niveau / reglages.capture.diviseurNiveau);
  return Math.min(100, chanceV1Pourcent * rapport);
}

// Ticket AB : à partir de la Centrale, les PV des ennemis sont multipliés par 0,8 (le multiplicateur de PV de la zone,
// pas les dégâts). Les zones d'avant, les zones 1 et 2 comprises, gardent la valeur de la V1.
export const PREMIERE_ZONE_ADOUCIE_V1 = 12;
export const COEFFICIENT_PV_ADOUCI_V2 = 0.8;

/** Multiplicateur de PV attendu en V2 pour une zone, à partir de la valeur de la V1 et de son numéro d'origine. */
export function multiplicateurPvAttendu(ancienId: number, valeurV1: number): number {
  return ancienId < PREMIERE_ZONE_ADOUCIE_V1 ? valeurV1
    : Math.round(valeurV1 * COEFFICIENT_PV_ADOUCI_V2 * 1e4) / 1e4;
}

/**
 * PV attendus en V2 d'un ennemi de la Ligue dont la V1 donne `pvV1`. Le jeu arrondit les PV de base puis les multiplie
 * par 4 (boss) : l'écart à `pvV1 × 0,8` va jusqu'à `ARRONDI_PV_BOSS_V2` PV, jamais plus.
 */
export const ARRONDI_PV_BOSS_V2 = 4;
export const pvAdoucisV2 = (pvV1: number): number => pvV1 * COEFFICIENT_PV_ADOUCI_V2;

export function prixAttendu(source: { id: string; prix: number; type: string; noBadgeInflation: boolean },
  badges: number, palier: boolean): number {
  const ecart = ECARTS_V1[source.id];
  const prix = ecart?.prix ?? source.prix;
  const sansInflation = ecart?.sansInflation ?? source.noBadgeInflation;
  const base = source.type === 'consumable' && !sansInflation ? Math.floor(prix * (1 + badges * 0.05)) : prix;
  return palier ? Math.floor(base * 0.85) : base;
}
