import * as casino from '../core/casino';
import * as voltorbe from '../core/voltorbe';
import type * as jeux from '../core/jeux-casino';
import { kanto } from '../core/regions';
import { etatMondeDe, type DonneesRegion } from '../core/sauvegarde';
import { lireSuivi, noterPartieCasino, type JEUX_SUIVIS } from '../core/suivi';

export type PartieSuivie = { jeu: (typeof JEUX_SUIVIS)[number]; mise: number };

export function suivrePartieCasino(avant: DonneesRegion,
  resultat: { region: DonneesRegion; termine?: boolean; fin?: casino.FinBlackjack | null }, partie?: PartieSuivie): DonneesRegion {
  const apres = resultat.region;
  if (resultat.termine && resultat.fin) {
    const mise = resultat.fin.engage;
    const dejaEngage = casino.vueBlackjack(avant)?.engage ?? 0;
    const gain = apres.jetons - avant.jetons + mise - dejaEngage;
    return { ...apres, suivi: noterPartieCasino(lireSuivi(apres), 'blackjack', { mise, gain }) };
  }
  if (!partie) return apres;
  const gain = apres.jetons - avant.jetons + partie.mise;
  return { ...apres, suivi: noterPartieCasino(lireSuivi(apres), partie.jeu, { mise: partie.mise, gain }) };
}

/** Fin d'une grille de Voltorbe Flip (perdue, encaissée ou terminée) : la partie entre dans le suivi (mise, gain total). */
export function noterFinVoltorbe<R extends { ok: boolean }>(resultat: R): R {
  const r = resultat as unknown as { ok: true; region: DonneesRegion; fin: voltorbe.FinVoltorbe | null } | { ok: false };
  if (!r.ok || !r.fin) return resultat;
  const suivi = noterPartieCasino(lireSuivi(r.region), 'voltorbe', { mise: r.fin.mise, gain: r.fin.gain });
  return { ...r, region: { ...r.region, suivi } } as unknown as R;
}

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
  jouerRoulette(mise: number, pari: jeux.PariRoulette): ReturnType<typeof jeux.jouerRoulette<DonneesRegion>>;
  /**
   * Carte visible du « plus ou moins » : celle de la sauvegarde si elle existe, sinon un tirage qui est aussitôt sauvegardé
   * (aucune mise n'est débitée avant le choix). Casino fermé : `{ ok: false }`.
   */
  carteVisiblePlusOuMoins(): { ok: true; carte: number } | { ok: false; raison: string };
  /** Joue la carte visible sauvegardée ; la carte tirée devient la nouvelle carte visible (sauvegardée avec le coup). */
  jouerPlusOuMoins(mise: number, choix: jeux.ChoixPlusOuMoins): ReturnType<typeof jeux.jouerPlusOuMoins<DonneesRegion>>;
  gratter(mise: number): ReturnType<typeof jeux.gratter<DonneesRegion>>;
  /** Voltorbe Flip : la mise est débitée au départ, la grille est sauvegardée jusqu'à l'encaissement ou au Voltorbe. */
  commencerVoltorbe(mise: number, niveau: number): ReturnType<typeof voltorbe.commencerVoltorbe<DonneesRegion>>;
  retournerVoltorbe(index: number): ReturnType<typeof voltorbe.retournerVoltorbe<DonneesRegion>>;
  encaisserVoltorbe(): ReturnType<typeof voltorbe.encaisserVoltorbe<DonneesRegion>>;
  /** Le ton « coin » de la V1, joué quand un gain est révélé (le casino de la V1 n'avait pas de son propre). Muet si le son est coupé. */
  sonnerCasino(): void;
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
  /** Carte visible du « plus ou moins » (1 à 13), `null` tant qu'aucune n'a été tirée. */
  plusOuMoinsCarte: number | null;
  /** Grille de Voltorbe Flip en cours (cartes cachées non révélées), 
ull sans partie. */
  voltorbe: voltorbe.VueVoltorbe | null;
  objets: ReturnType<typeof casino.objetsDuCasino>;
};

export function afficherCasino(region: DonneesRegion, precedent: AffichageCasino | null): AffichageCasino {
  const acces = casino.accesCasino(kanto, etatMondeDe(region));
  const affichage: AffichageCasino = {
    acces: { ouvert: acces.ok, raison: acces.ok ? null : acces.raison ?? null },
    jetons: region.jetons, nouveau: acces.ok && region.casinoVu !== true, blackjackEnCours: casino.vueBlackjack(region),
    plusOuMoinsCarte: region.plusOuMoinsCarte ?? null, voltorbe: voltorbe.vueVoltorbe(region),
    objets: casino.objetsDuCasino(region),
  };
  return JSON.stringify(affichage) === JSON.stringify(precedent) ? precedent! : affichage;
}
