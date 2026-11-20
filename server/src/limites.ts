export const LIMITES = {
  maxParties: 20,
  maxRegions: 20,
  // Une vraie partie intensive (PC de plusieurs milliers de Pokémon, ~150 octets chacun) ne doit jamais être refusée à l'écriture.
  corpsSauvegardeOctets: 12 * 1024 * 1024,
  corpsArchiveOctets: 22 * 1024 * 1024,
  corpsParDefautOctets: 100 * 1024,
  verrouAppareilSecondes: 120,
  conservationSuppressionJours: 30,
  toleranceHorlogeMinutes: 5,
  enveloppeOctets: 3_000_000,
  texteCaracteres: 100,
  versionEnveloppe: 1000,
  revision: 2_147_483_647,
  debitRequetes: 60,
  debitFenetreMs: 60_000,
  debitSeuilPurge: 1000,
  lotsParPartie: 5,
} as const;
