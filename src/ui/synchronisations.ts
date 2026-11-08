export const synchronisations = {
  ok: ['À jour', 'bg-succes-base'],
  'hors-ligne': ['Hors connexion', 'bg-alerte-base'],
  inactif: ['Synchronisation en attente', 'bg-info-base'],
  ailleurs: ['Partie ouverte sur un autre appareil', 'bg-info-base'],
  divergence: ['Mise à jour depuis l’autre appareil', 'bg-info-base'],
  refuse: ['Synchronisation refusée', 'bg-erreur-base'],
} as const;

/** Seuls les problèmes s'affichent : « à jour » et « en attente » ne disent rien d'utile au joueur. */
export const estProbleme = (etat: keyof typeof synchronisations) => etat !== 'ok' && etat !== 'inactif';
