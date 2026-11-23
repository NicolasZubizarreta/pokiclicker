import type { CSSProperties } from 'react';
import { useStore } from 'zustand';
import { skinsEquipes, type DefinitionSkin } from '../core/skins';
import { storeJeu, type StoreJeu } from './store';

/** Le skin équipé dans une catégorie, ou undefined : l'interface ne s'habille que de skins possédés et connus. */
export function useSkin(categorie: string, store: StoreJeu = storeJeu): DefinitionSkin | undefined {
  const compte = useStore(store, e => e.compte);
  return skinsEquipes(compte)[categorie];
}

/** Les achats et équipements du jeu en cours, pour la boutique du compte. */
export const boutiqueJeu = {
  acheter: (id: string) => storeJeu.getState().acheterSkin(id),
  equiper: (categorie: string, id: string | null) => storeJeu.getState().equiperSkin(categorie, id),
};

/** Classe et couleur (variable CSS --skin) d'un skin ; vide quand aucun skin n'est équipé. */
export function attributsSkin(skin: DefinitionSkin | undefined): { className: string; style: CSSProperties } {
  return skin ? { className: `skin-${skin.categorie}`, style: { '--skin': `var(${skin.jeton})` } as CSSProperties } : { className: '', style: {} };
}
