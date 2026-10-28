// Écarts voulus avec la V1 (rapports de Nicolas du 28/10/2026, tickets AA et AC). Les fixtures V1 restent la référence :
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

export function prixAttendu(source: { id: string; prix: number; type: string; noBadgeInflation: boolean },
  badges: number, palier: boolean): number {
  const ecart = ECARTS_V1[source.id];
  const prix = ecart?.prix ?? source.prix;
  const sansInflation = ecart?.sansInflation ?? source.noBadgeInflation;
  const base = source.type === 'consumable' && !sansInflation ? Math.floor(prix * (1 + badges * 0.05)) : prix;
  return palier ? Math.floor(base * 0.85) : base;
}
