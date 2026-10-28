import type { ResultatCondition } from './conditions';
import { calculerOr, type Victoire } from './recompenses';
import { reglages } from './reglages';
import type { DonneesRegion, PokemonPossede } from './sauvegarde-types';
import { tirerSexe } from './sexe';

type EnnemiCapture = { capture: number; pv: number; pvMax: number; niveau: number };
type Inventaire = Readonly<Record<string, number>>;

export function chanceCapture(ennemi: EnnemiCapture, cle: string, actifs: readonly string[]): number {
  const balle = reglages.capture.balles.find((entree) => entree.cle === cle);
  if (!balle || ennemi.capture === 0 || ennemi.pv <= 0) return 0;
  const base = ennemi.capture / 255;
  const sante = ((3 * ennemi.pvMax) - (2 * ennemi.pv)) / (3 * ennemi.pvMax);
  const niveau = 1 + (ennemi.niveau / 25);
  let chance = (base * sante * balle.multiplicateur) / niveau;
  for (const bonus of reglages.capture.bonus) {
    if (actifs.includes(bonus.cle)) chance *= bonus.x;
  }
  if (balle.multiplicateur >= reglages.capture.multiplicateurCertain) chance = 1;
  return chance;
}

export function verifierLancer(
  etat: { ennemi: Pick<EnnemiCapture, 'capture' | 'pv'> | null; attenteMs: number; captureEnCours: boolean },
  inventaire: Inventaire, cle: string,
): ResultatCondition {
  if (!etat.ennemi || etat.attenteMs > 0 || etat.ennemi.pv <= 0) {
    return { ok: false, raison: 'Aucun Pokémon à capturer.' };
  }
  if (etat.ennemi.capture === 0) return { ok: false, raison: reglages.capture.raisonImpossible };
  if (etat.captureEnCours) return { ok: false, raison: 'Une capture est déjà en cours.' };
  const balles = reglages.capture.balles;
  if (!balles.some((balle) => (inventaire[balle.cle] ?? 0) > 0)) {
    return { ok: false, raison: "Tu n'as aucune balle." };
  }
  const balle = balles.find((entree) => entree.cle === cle);
  if (!balle) return { ok: false, raison: "Tu n'as aucune balle." };
  if (!((inventaire[cle] ?? 0) > 0)) return { ok: false, raison: `Tu n'as plus de ${balle.nom}.` };
  return { ok: true };
}

export function retirerBalle(inventaire: Inventaire, cle: string): Record<string, number> {
  const resultat = { ...inventaire };
  const quantite = inventaire[cle] ?? 0;
  if (reglages.capture.balles.some((balle) => balle.cle === cle) && quantite > 0) {
    resultat[cle] = quantite - 1;
  }
  return resultat;
}

export function appliquerCapture(
  region: DonneesRegion, prise: Victoire, actifs: readonly string[], alea: () => number, genererId: () => string,
): { region: DonneesRegion; destination: 'equipe' | 'pc'; bonbons: number } {
  const sexe = tirerSexe(prise.numero, alea);
  const pokemon: PokemonPossede = {
    uid: genererId(), numero: prise.numero, niveau: prise.niveau, shiny: prise.shiny, sexe,
    xp: 0, bonheur: 0, calcium: 0, pierreEternelle: false, favori: false,
  };
  const destination = region.equipe.length < reglages.equipe.taille ? 'equipe' : 'pc';
  const bonbons = prise.shiny ? reglages.recompenses.shiny.quantite : 0;
  const inventaire = { ...region.inventaire };
  if (prise.shiny) {
    const objet = reglages.recompenses.shiny.objet;
    inventaire[objet] = (inventaire[objet] ?? 0) + bonbons;
  }
  return {
    region: {
      ...region, [destination]: [...region[destination], pokemon], inventaire,
      argent: region.argent + calculerOr(prise, actifs) * reglages.recompenses.or.capture,
    },
    destination, bonbons,
  };
}
