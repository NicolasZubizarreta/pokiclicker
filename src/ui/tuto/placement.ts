export type Rect = { x: number; y: number; w: number; h: number };
export type EntreePlacement = {
  zone: Rect;
  cible: Rect | null;
  obstacles: readonly Rect[];
  marge: number;
  carte: { largeurMax: number; largeurMin: number; hauteur(largeur: number): number };
};
export type Placement = { carteEn: 'haut' | 'bas'; carte: Rect; masqueCible: boolean };

function recouvrement(a: Rect, b: Rect): number {
  return Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x))
    * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
}

/** Range la carte dans un coin de la zone utile : celui qui couvre le moins la cible, puis le moins d'éléments sur lesquels on appuie. */
export function placerTuto(e: EntreePlacement): Placement {
  const { zone, marge } = e;
  const cible = e.cible && { x: e.cible.x - 8, y: e.cible.y - 8, w: e.cible.w + 16, h: e.cible.h + 16 };
  let meilleur: Placement | undefined;
  let scoreMinimal = Infinity;
  let rang = 0;
  for (const carteEn of ['haut', 'bas'] as const) {
    for (const cote of ['gauche', 'droite'] as const) {
      const w = Math.max(0, Math.min(e.carte.largeurMax, zone.w - 2 * marge));
      const h = e.carte.hauteur(w);
      const carte = { w, h, x: cote === 'gauche' ? zone.x + marge : zone.x + zone.w - marge - w,
        y: zone.y + (carteEn === 'haut' ? marge : zone.h - marge - h) };
      const aireCible = cible ? recouvrement(carte, cible) : 0;
      const candidat = { carteEn, carte, masqueCible: aireCible > 0 };
      if (!cible) return candidat;
      const score = 1000 * aireCible + e.obstacles.reduce((somme, o) => somme + recouvrement(carte, o), 0)
        + (w < e.carte.largeurMin ? 1_000_000 : 0) + rang++ * 0.001;
      if (score < scoreMinimal) { scoreMinimal = score; meilleur = candidat; }
    }
  }
  return meilleur!;
}
