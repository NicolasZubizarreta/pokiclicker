import type { reglages } from '../core/reglages';

export type CleRarete = keyof typeof reglages.objetsActifs.raretes;

/**
 * Couple de jetons sémantiques (fond + texte) de chaque rareté, table unique pour toute l'interface.
 * La couleur ne porte jamais seule l'information : le libellé de `reglages.objetsActifs.raretes`
 * reste toujours affiché. Contrastes texte/fond relevés dans design/tokens.css, thèmes clair et sombre :
 * neutre 5,2 / 6,9 ; succès 7,1 / 8,4 ; info 7,9 / 9,9 ; alerte 7,1 / 10,0 ; erreur 8,9 / 9,0 (minimum visé : 4,5).
 */
export const classesRarete: Record<CleRarete, string> = {
  'commun': 'bg-surface-2 text-texte-doux',
  'peu-commun': 'bg-succes-fond text-succes-texte',
  'rare': 'bg-info-fond text-info-texte',
  'tres-rare': 'bg-alerte-fond text-alerte-texte',
  'legendaire': 'bg-erreur-fond text-erreur-texte',
  'conseil-4': 'bg-alerte-fond text-alerte-texte',
  'maitre': 'bg-alerte-fond text-alerte-texte',
};
