import taillesImages from '../../public/img/tailles.json';

export type TaillesImages = Record<string, { largeur: number; hauteur: number }>;
type PropsImage = {
  src: string;
  genre: 'decor' | 'sprite';
  alt: string;
  largeurDisponible?: number;
  tailles?: TaillesImages;
  className?: string;
  couvrir?: boolean;
};

export function facteurEntier(largeurDisponible: number, tailleNative: number): number {
  if (!Number.isFinite(largeurDisponible) || !Number.isFinite(tailleNative)
    || largeurDisponible <= 0 || tailleNative <= 0) {
    throw new Error('La largeur disponible et la taille native doivent être positives et finies.');
  }
  return Math.max(1, Math.floor(largeurDisponible / tailleNative));
}

/** Vrai si l’image figure au registre des tailles (un décor encore absent, ex. Bourg Palette avant le ticket P, ne plante pas l’écran). */
export const imageConnue = (src: string, tailles: TaillesImages = taillesImages): boolean => src.replace(/^\//, '') in tailles;

export function Image({ src, genre, alt, largeurDisponible, tailles = taillesImages, className = '', couvrir = false }: PropsImage) {
  const dimensions = tailles[src.replace(/^\//, '')];
  if (!dimensions) {
    if (import.meta.env.DEV) throw new Error(`Image inconnue : ${src}. Lance le script de traitement des images.`);
    return null;
  }
  const facteur = genre === 'sprite' && largeurDisponible !== undefined
    ? facteurEntier(largeurDisponible, dimensions.largeur) : 1;
  return <img src={src} alt={alt} width={dimensions.largeur * facteur} height={dimensions.hauteur * facteur}
    decoding="async" loading={genre === 'decor' ? 'eager' : undefined}
    className={`${genre === 'decor' ? `aspect-video ${couvrir ? 'object-cover' : 'object-contain'}` : 'image-rendering-pixelated'} ${className}`} />;
}
