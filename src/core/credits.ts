import donnees from '../../data/credits.json';

export function planCredits(reduit: boolean) {
  const { titre, message, sections, temps, imagesFlottantes } = structuredClone(donnees);
  // Des millisecondes entières, sans perdre le reste de la division.
  const debut = (index: number) => Math.floor(index * temps.dureeMs / sections.length);
  return { titre, message, sections, temps,
    mode: reduit ? 'pages' as const : 'defilement' as const,
    imagesFlottantes: reduit ? null : imagesFlottantes,
    pages: reduit ? sections.map((section, index) => ({ section,
      debutMs: temps.delaiMs + debut(index), dureeMs: debut(index + 1) - debut(index) })) : [],
  };
}

export type RectangleCredits = { x: number; y: number; w: number; h: number };
export type ImageFlottante = RectangleCredits & { image: string; vieMs: number; opacite: number };

/** Les rectangles fournis sont les images encore actives ; l'appelant gère leur durée de vie. */
export function tirerImageFlottante(actifs: readonly Readonly<RectangleCredits>[],
  alea: () => number): ImageFlottante | null {
  const config = donnees.imagesFlottantes;
  if (actifs.length >= config.maximum) return null;
  const entier = (min: number, max: number) => min + Math.floor(alea() * (max - min + 1));
  const image = config.images[entier(0, config.images.length - 1)]!;
  const taille = entier(config.taillePourcent[0]!, config.taillePourcent[1]!);
  for (let essai = 0; essai < 10; essai++) {
    const x = entier(0, 100 - taille);
    const y = entier(0, 100 - taille);
    if (actifs.every(rect => x + taille <= rect.x || rect.x + rect.w <= x
      || y + taille <= rect.y || rect.y + rect.h <= y)) {
      return { image, x, y, w: taille, h: taille,
        vieMs: entier(config.vieMs[0]!, config.vieMs[1]!), opacite: config.opacite };
    }
  }
  return null;
}
