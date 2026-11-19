/** Bornes techniques larges pour les collections sans catalogue fini (PC, drapeaux…). */
export const LISTE_MAX = 10_000;

export const PLAFOND_ARGENT = 999_999_999;
export const PLAFOND_JETONS = 999_999;

export const ajouterArgent = (argent: number, gain: number): number => Math.min(PLAFOND_ARGENT, argent + gain);
export const ajouterJetons = (jetons: number, gain: number): number => Math.min(PLAFOND_JETONS, jetons + gain);
