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
  Reglages: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2',
  Disque: 'M4 3h13l3 3v15H4zM8 3v6h8V3M8 21v-7h8v7',
  Sortie: 'M10 3H4v18h6M15 7l5 5-5 5M20 12H9',
  Chevron: 'm9 4 8 8-8 8',
  Retour: 'M15 4 7 12l8 8',
} as const;

const faire = (chemin: string) => () => <Icone><path d={chemin} /></Icone>;

export const IconeMonde = faire(chemins.Monde);
export const IconePokedex = faire(chemins.Pokedex);
export const IconeBadges = faire(chemins.Badge);
export const IconeStats = faire(chemins.Stats);
export const IconeGuide = faire(chemins.Guide);
export const IconeReglages = faire(chemins.Reglages);
export const IconeDisque = faire(chemins.Disque);
export const IconeSortie = faire(chemins.Sortie);
export const IconeChevron = faire(chemins.Chevron);
export const IconeRetour = faire(chemins.Retour);
