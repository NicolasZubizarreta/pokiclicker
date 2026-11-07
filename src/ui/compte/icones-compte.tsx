const faire = (chemin: string) => () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" aria-hidden="true" focusable="false" className="shrink-0">
    <path d={chemin} />
  </svg>
);

export const IconeAlerte = faire('M12 3 2 21h20zM12 10v5M12 18h.01');
export const IconeOeil = faire('M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z');
export const IconeValide = faire('m5 12 5 5 9-10');
export const IconeCorbeille = faire('M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6');
export const IconeCompte = faire('M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 21a8 8 0 0 1 16 0');
export const IconeReglage = faire('M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6h4V4zM6 14v6h4v-6z');
export const IconeParties = faire('M4 3h13l3 3v15H4zM8 3v6h8V3M8 21v-7h8v7');
export const IconeSortie = faire('M10 3H4v18h6M15 7l5 5-5 5M20 12H9');
export const IconeAjout = faire('M12 5v14M5 12h14');
export const IconeCrayon = faire('m16 3 5 5L8 21H3v-5zM13 6l5 5');
export const IconeDiamant = faire('M6 3h12l4 6-10 12L2 9zM2 9h20M9 3 7 9l5 12 5-12-2-6');
export const IconeNuage = faire('M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 19.5 10 4 4 0 0 1 19 18z');
export const IconeTelephone = faire('M6 2h12v20H6zM10 18h4');
