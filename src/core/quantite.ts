import { reglages } from './reglages';

/** Plafond d'une quantité d'utilisation : le stock ou ce que le Pokémon peut recevoir, jamais plus que la limite de la boutique (99). */
export const plafondQuantite = (max: number): number => Math.max(1, Math.min(reglages.boutique.quantiteMax, Math.floor(max)));

/** − boucle : à 1, on passe au plafond. */
export const quantiteMoinsPlafond = (quantite: number, max: number): number =>
  quantite <= 1 ? plafondQuantite(max) : Math.min(quantite, plafondQuantite(max)) - 1;

/** + boucle : au plafond, on repasse à 1. */
export const quantitePlusPlafond = (quantite: number, max: number): number =>
  quantite >= plafondQuantite(max) ? 1 : quantite + 1;

/** +10 s'arrête au plafond. */
export const quantitePlusDixPlafond = (quantite: number, max: number): number =>
  Math.min(plafondQuantite(max), quantite + 10);
