// Écarts voulus avec la V1 (rapport de Nicolas du 28/10/2026, ticket AA). Les fixtures V1 restent la référence :
// ces écarts sont les seuls permis dans les tests de fidélité, et chacun est une décision, pas un oubli.
export const ECARTS_V1: Record<string, { prix?: number; sansInflation?: boolean }> = {
  calcium: { prix: 20000 },
  fireStone: { sansInflation: true },
  waterStone: { sansInflation: true },
  leafStone: { sansInflation: true },
  thunderStone: { sansInflation: true },
  moonStone: { sansInflation: true },
};

export function prixAttendu(source: { id: string; prix: number; type: string; noBadgeInflation: boolean },
  badges: number, palier: boolean): number {
  const ecart = ECARTS_V1[source.id];
  const prix = ecart?.prix ?? source.prix;
  const sansInflation = ecart?.sansInflation ?? source.noBadgeInflation;
  const base = source.type === 'consumable' && !sansInflation ? Math.floor(prix * (1 + badges * 0.05)) : prix;
  return palier ? Math.floor(base * 0.85) : base;
}
