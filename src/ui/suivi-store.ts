import { lireSuivi, noterDepense, type Suivi, type CATEGORIES_DEPENSE } from '../core/suivi';
import type { DonneesRegion } from '../core/sauvegarde';

export function dateLocale(ms: number): string {
  const date = new Date(ms);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function creerLectureSuivi() {
  let source: Suivi | undefined;
  let valeur = lireSuivi({});
  return (region: { suivi?: Suivi }): Suivi => {
    if (region.suivi !== source) {
      source = region.suivi;
      valeur = lireSuivi(region);
    }
    return valeur;
  };
}

export function suivreDepense(avant: DonneesRegion, apres: DonneesRegion,
  categorie: (typeof CATEGORIES_DEPENSE)[number]): DonneesRegion {
  const montant = avant.argent - apres.argent;
  return montant > 0 ? { ...apres, suivi: noterDepense(lireSuivi(apres), categorie, montant) } : apres;
}
