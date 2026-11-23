import type { Rencontre } from '../core/suivi';

export function lignesRencontres(entree: Rencontre | undefined): { libelle: string; valeur: string }[] {
  return entree ? [
    { libelle: 'Rencontrés', valeur: String(entree.vus) },
    { libelle: 'Capturés', valeur: String(entree.captures) },
    { libelle: 'Depuis le dernier chromatique', valeur: String(entree.depuisShiny) },
  ] : [];
}
