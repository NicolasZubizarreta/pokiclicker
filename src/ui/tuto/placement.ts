export type Rect = { x: number; y: number; w: number; h: number };
export type CoinChen = 'bas-droite' | 'haut-droite' | 'bas-gauche' | 'haut-gauche' | 'haut-centre';
export type EntreePlacement = {
  zone: Rect;
  cible: Rect | null;
  obstacles: readonly Rect[];
  marge: number;
  chen: { w: number; h: number };
  carte: { largeurMax: number; largeurMin: number; hauteur(largeur: number): number };
};
export type Placement = { carteEn: 'haut' | 'bas'; coinChen: CoinChen; carte: Rect; chen: Rect; masqueCible: boolean };

function recouvrement(a: Rect, b: Rect): number {
  return Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x))
    * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
}

export function placerTuto(e: EntreePlacement): Placement {
  const { zone, marge } = e;
  const cible = e.cible && { x: e.cible.x - 8, y: e.cible.y - 8, w: e.cible.w + 16, h: e.cible.h + 16 };
  let meilleur: Placement | undefined;
  let scoreMinimal = Infinity;
  let rang = 0;
  for (const carteEn of ['haut', 'bas'] as const) {
    for (const cote of ['gauche', 'droite'] as const) {
      for (const coinChen of ['bas-droite', 'haut-droite', 'bas-gauche', 'haut-gauche', 'haut-centre'] as const) {
        const droite = coinChen.endsWith('droite');
        const memeCote = coinChen.startsWith(carteEn);
        // Chen et la carte du même côté vertical : la carte cède la largeur de Chen et se range à l'opposé.
        if (memeCote && (coinChen === 'haut-centre' || (cote === 'droite') === droite)) continue;
        const chen = { ...e.chen, x: zone.x + (coinChen === 'haut-centre' ? (zone.w - e.chen.w) / 2 : droite ? zone.w - marge - e.chen.w : marge),
          y: zone.y + (coinChen.startsWith('haut') ? marge : zone.h - marge - e.chen.h) };
        const w = Math.max(0, Math.min(e.carte.largeurMax, zone.w - 2 * marge - (memeCote ? e.chen.w + marge : 0)));
        const h = e.carte.hauteur(w);
        const carte = { w, h, x: cote === 'gauche' ? zone.x + marge : zone.x + zone.w - marge - w,
          y: zone.y + (carteEn === 'haut' ? marge : zone.h - marge - h) };
        const aireCible = cible ? recouvrement(carte, cible) + recouvrement(chen, cible) : 0;
        const candidat = { carteEn, coinChen, carte, chen, masqueCible: aireCible > 0 };
        if (!cible) return candidat;
        // La carte arrête les appuis ; Chen est décoratif (les appuis le traversent) : il pèse moins.
        const score = 1000 * aireCible + e.obstacles.reduce((somme, o) => somme + recouvrement(carte, o) + 0.5 * recouvrement(chen, o), 0)
          + (w < e.carte.largeurMin ? 1_000_000 : 0) + rang++ * 0.001;
        if (score < scoreMinimal) { scoreMinimal = score; meilleur = candidat; }
      }
    }
  }
  return meilleur!;
}
