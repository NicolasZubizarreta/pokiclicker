import * as casino from '../core/casino';
import { kanto } from '../core/regions';
import { etatMondeDe, type DonneesRegion } from '../core/sauvegarde';

export type ActionsCasino = {
  acheterJetons(jetons?: number): ReturnType<typeof casino.acheterJetons<DonneesRegion>>;
  echangerJetons(jetons?: number): ReturnType<typeof casino.echangerJetons<DonneesRegion>>;
  jouerMachine(mise: number): ReturnType<typeof casino.jouerMachine<DonneesRegion>>;
  jouerPileOuFace(mise: number, choix: casino.Face): ReturnType<typeof casino.jouerPileOuFace<DonneesRegion>>;
  distribuerBlackjack(mise: number): ReturnType<typeof casino.distribuer<DonneesRegion>>;
  tirerBlackjack(): ReturnType<typeof casino.tirerCarte<DonneesRegion>>;
  resterBlackjack(): ReturnType<typeof casino.rester<DonneesRegion>>;
  doublerBlackjack(): ReturnType<typeof casino.doubler<DonneesRegion>>;
  separerBlackjack(): ReturnType<typeof casino.separer<DonneesRegion>>;
  assurerBlackjack(): ReturnType<typeof casino.assurer<DonneesRegion>>;
  refuserAssuranceBlackjack(): ReturnType<typeof casino.refuserAssurance<DonneesRegion>>;
  abandonnerBlackjack(): ReturnType<typeof casino.abandonner<DonneesRegion>>;
  acheterAuCasino(id: string): ReturnType<typeof casino.acheterAuCasino<DonneesRegion>>;
  /**
   * Ouverture de la page du casino : la première fois, offre les jetons de `premiereEntree` (une seule fois, sauvegardé)
   * et renvoie leur nombre ; ensuite, ou si le casino est fermé, renvoie 0.
   */
  entrerAuCasino(): { offerts: number };
};

const ecouteursPremiereEntree = new Set<(offerts: number) => void>();
/**
 * Crochet unique de la première entrée au casino, pour le mini-tuto (ticket E) : `surPremiereEntreeCasino(() => ouvrirTuto())`.
 * Appelé une seule fois par partie, juste après le cadeau, avec le nombre de jetons offerts ; renvoie la fonction qui retire l'écouteur.
 */
export function surPremiereEntreeCasino(ecouteur: (offerts: number) => void): () => void {
  ecouteursPremiereEntree.add(ecouteur);
  return () => { ecouteursPremiereEntree.delete(ecouteur); };
}
export function signalerPremiereEntreeCasino(offerts: number): void {
  for (const ecouteur of ecouteursPremiereEntree) {
    try { ecouteur(offerts); } catch { /* un tuto en erreur ne doit pas gêner le jeu */ }
  }
}

export type AffichageCasino = {
  acces: { ouvert: boolean; raison: string | null };
  jetons: number;
  /** Casino ouvert et jamais visité : la pastille de rappel est affichée (menu, Carte). */
  nouveau: boolean;
  /** Main en cours, sans la carte cachée du croupier. */
  blackjackEnCours: casino.VueBlackjack | null;
  objets: ReturnType<typeof casino.objetsDuCasino>;
};

export function afficherCasino(region: DonneesRegion, precedent: AffichageCasino | null): AffichageCasino {
  const acces = casino.accesCasino(kanto, etatMondeDe(region));
  const affichage: AffichageCasino = {
    acces: { ouvert: acces.ok, raison: acces.ok ? null : acces.raison ?? null },
    jetons: region.jetons, nouveau: acces.ok && region.casinoVu !== true, blackjackEnCours: casino.vueBlackjack(region),
    objets: casino.objetsDuCasino(region),
  };
  return JSON.stringify(affichage) === JSON.stringify(precedent) ? precedent! : affichage;
}
