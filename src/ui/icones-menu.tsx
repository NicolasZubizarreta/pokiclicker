import type { ReactNode } from 'react';

function Icone({ children }: { children: ReactNode }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" aria-hidden="true" focusable="false" className="shrink-0">
      {children}
    </svg>
  );
}

const chemins = {
  Monde: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3.5 3.5 3.5 14.5 0 18M12 3c-3.5 3.5-3.5 14.5 0 18',
  Pokedex: 'M5 3h14v18H5zM9 8h6M9 12h6M9 16h3',
  Badge: 'm12 2 3 4 5 1-1 5 1 5-5 1-3 4-3-4-5-1 1-5-1-5 5-1z',
  Stats: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  Guide: 'M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4zM8 9h8M8 13h6',
  // Engrenage : huit dents, moyeu rond.
  Reglages: 'M10.08 4.85L10.44 2.12L13.56 2.12L13.92 4.85L15.7 5.59L17.88 3.91L20.09 6.12L18.41 8.3L19.15 10.08L21.88 10.44L21.88 13.56L19.15 13.92L18.41 15.7L20.09 17.88L17.88 20.09L15.7 18.41L13.92 19.15L13.56 21.88L10.44 21.88L10.08 19.15L8.3 18.41L6.12 20.09L3.91 17.88L5.59 15.7L4.85 13.92L2.12 13.56L2.12 10.44L4.85 10.08L5.59 8.3L3.91 6.12L6.12 3.91L8.3 5.59zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  // Cible : le mannequin d'entraînement.
  Cible: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 11.5v1',
  Disque: 'M4 3h13l3 3v15H4zM8 3v6h8V3M8 21v-7h8v7',
  Sortie: 'M10 3H4v18h6M15 7l5 5-5 5M20 12H9',
  Chevron: 'm9 4 8 8-8 8',
  Retour: 'M15 4 7 12l8 8',
  // Machine à sous : corps, fenêtre à trois rouleaux, fente, levier avec sa boule.
  Casino: 'M5 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM6 7h8v5H6zM8.67 7v5M11.33 7v5M7 16h6M17 14h3V7M19 4h2v2h-2z',
  // Herbes hautes : deux feuilles sur une tige.
  Safari: 'M12 21V9M12 9C8 9 6 6 6 2c4 0 6 3 6 7zM12 14c4 0 6-3 6-7-4 0-6 3-6 7zM5 21h14',
  // Œuf fissuré : l'enclos de la pension.
  Pension: 'M12 3c-3.5 0-6 5-6 9.5A6 6 0 0 0 12 21a6 6 0 0 0 6-8.5C18 8 15.5 3 12 3zM8.5 13l2 2 2-2 2 2',
} as const;

const faire = (chemin: string) => () => <Icone><path d={chemin} /></Icone>;

export const IconeMonde = faire(chemins.Monde);
export const IconePokedex = faire(chemins.Pokedex);
export const IconeBadges = faire(chemins.Badge);
export const IconeStats = faire(chemins.Stats);
export const IconeGuide = faire(chemins.Guide);
export const IconeReglages = faire(chemins.Reglages);
export const IconeCible = faire(chemins.Cible);
export const IconeDisque = faire(chemins.Disque);
export const IconeSortie = faire(chemins.Sortie);
export const IconeChevron = faire(chemins.Chevron);
export const IconeRetour = faire(chemins.Retour);
export const IconeCasino = faire(chemins.Casino);
export const IconeSafari = faire(chemins.Safari);
export const IconePension = faire(chemins.Pension);
