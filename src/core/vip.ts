import donnees from '../../data/casino-vip.json';

/**
 * Niveau de fidélité du casino (ticket F) : le total misé en jetons (compté dans le suivi) fait monter des niveaux,
 * du plus bas au plus haut ; chaque niveau donne une remise sur la boutique de jetons. Seuils et remises : `data/casino-vip.json`.
 */
export type NiveauVip = { id: string; nom: string; mises: number; remisePourCent: number };

export function chargerVip(source: unknown = donnees): NiveauVip[] {
  const niveaux = (source as { version?: number; niveaux?: NiveauVip[] } | null)?.niveaux;
  if ((source as { version?: number } | null)?.version !== 1 || !Array.isArray(niveaux) || !niveaux.length) throw new Error('Niveaux VIP invalides');
  let precedent = 0;
  for (const n of niveaux) {
    if (!n || typeof n.id !== 'string' || !n.id || typeof n.nom !== 'string' || !n.nom
      || !Number.isSafeInteger(n.mises) || n.mises <= precedent
      || !Number.isSafeInteger(n.remisePourCent) || n.remisePourCent < 0 || n.remisePourCent > 50) throw new Error('Niveau VIP invalide');
    precedent = n.mises;
  }
  if (new Set(niveaux.map(n => n.id)).size !== niveaux.length) throw new Error('Niveaux VIP en double');
  return niveaux.map(n => ({ ...n }));
}

export const NIVEAUX_VIP = chargerVip();

export type EtatVip = { niveau: NiveauVip | null; remisePourCent: number; suivant: NiveauVip | null; restant: number };

/** Niveau atteint pour un total misé, remise correspondante et distance au niveau suivant. */
export function etatVip(mises: number, niveaux: readonly NiveauVip[] = NIVEAUX_VIP): EtatVip {
  const total = Number.isFinite(mises) ? Math.max(0, mises) : 0;
  const atteints = niveaux.filter(n => total >= n.mises);
  const niveau = atteints.at(-1) ?? null;
  const suivant = niveaux.find(n => total < n.mises) ?? null;
  return { niveau, remisePourCent: niveau?.remisePourCent ?? 0, suivant, restant: suivant ? suivant.mises - total : 0 };
}

/** Prix après remise, arrondi à l'entier supérieur (jamais gratuit, jamais sous 1). */
export const prixAvecRemise = (prix: number, remisePourCent: number): number =>
  Math.max(1, Math.ceil(prix * (100 - remisePourCent) / 100));
