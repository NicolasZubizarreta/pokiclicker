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

// Ticket B (11/11/2026) : la machine à sous rendait 162 % en V1 (trois Magicarpe seuls : 137 %). Nicolas a choisi l'option 2 :
// poids V1 gardés, gains Magicarpe ×2, Baie ×15, Staross ×25, Pikachu ×50, 7 ×500, exactement deux Baies ×3 (rendu 91,2 %).
// Les tirages restent ceux de la V1 ; seul le gain change.
export const GAINS_MACHINE_V2: Record<string, number> = { '7': 500, Pikachu: 50, Staross: 25, Baie: 15, Magicarpe: 2 };
export const GAIN_DEUX_BAIES_V2 = 3;

// Ticket B, blackjack (11/11/2026) : à la demande de Nicolas (« un vrai blackjack avec les vraies chances »), le blackjack de la V1
// (un paquet de 52 par main, deux cartes visibles, tirer ou rester) est remplacé par les règles du casino : sabot de 6 paquets
// remélangé sous 25 % de cartes, carte cachée du croupier, blackjack naturel ×2,5, doubler, séparer (4 mains), assurance, abandon.
// Les anciennes sauvegardes (paquet de 52 par main) restent lisibles et sont converties à la première action.
export const BLACKJACK_V2 = { paquets: 6, gainNaturel: 2.5, maxMains: 4, remelangeSous: 0.25 } as const;

/** Gain attendu en V2 pour un tirage (symboles de la V1) et une mise. */
export function gainMachineAttenduV2(symboles: readonly string[], mise = 1): number {
  if (symboles[0] === symboles[1] && symboles[1] === symboles[2]) return mise * (GAINS_MACHINE_V2[symboles[0]!] ?? 0);
  return symboles.filter(s => s === 'Baie').length === 2 ? mise * GAIN_DEUX_BAIES_V2 : 0;
}
// Ticket D (12/11/2026) : deux règles de pension absentes de la V1, choisies par Nicolas. (1) Un Pokémon né d'un œuf reçoit une
// marque d'éclosion : +5 % de dégâts propres, en facteur comme le Calcium, une fois par Pokémon, jamais par capture ni achat.
// (2) Les espèces différentes écloses (sur 151) donnent des succès à 10, 50, 100 et 151, crédités une fois par compte.
export const ECARTS_ECLOSION_V1 = { marqueDegats: 0.05, paliers: [10, 50, 100, 151] } as const;
