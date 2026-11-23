import * as safari from '../core/safari';
import { etatMondeDe, type DonneesRegion } from '../core/sauvegarde';

/** Résultat d'une action du Parc Safari vu par l'interface : un message à afficher, et le bilan quand la visite se termine. */
export type ResultatActionSafari = { ok: true; message: string; fin: safari.FinSafari | null; numero?: number } | { ok: false; raison: string };

export type ActionsSafari = {
  /** Paie l'entrée et commence une visite (une visite en cours se reprend sans repayer). */
  entrerAuSafari(): ResultatActionSafari;
  avancerSafari(): ResultatActionSafari;
  lancerBalleSafari(): ResultatActionSafari;
  jeterAppatSafari(): ResultatActionSafari;
  jeterRocheSafari(): ResultatActionSafari;
  quitterSafari(): ResultatActionSafari;
};

export type AffichageSafari = {
  acces: { ouvert: boolean; raison: string | null };
  prix: number;
  /** Visite en cours (pas, balles, Pokémon rencontré), `null` sans visite. */
  visite: safari.VueSafari | null;
};

export function afficherSafari(region: DonneesRegion, precedent: AffichageSafari | null): AffichageSafari {
  const acces = safari.accesSafari(etatMondeDe(region));
  const affichage: AffichageSafari = {
    acces: { ouvert: acces.ok, raison: acces.ok ? null : acces.raison ?? null }, prix: safari.prixEntreeSafari(), visite: safari.vueSafari(region),
  };
  return JSON.stringify(affichage) === JSON.stringify(precedent) ? precedent! : affichage;
}
