import type { ReactNode } from 'react';

export function IconeObjet({ image, nom, taille }: { image: string | null; nom: string; taille?: 'petite' }) {
  const classe = `image-rendering-pixelated shrink-0 ${taille === 'petite' ? 'size-8' : 'h-12 w-12'}`;
  return image !== null
    ? <img src={image} alt="" width={taille === 'petite' ? 32 : 48} height={taille === 'petite' ? 32 : 48} className={classe} />
    : <svg role="img" aria-label={nom} focusable="false" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" className={classe}>
      <path d="m12 3 9 5v9l-9 5-9-5V8zM3 8l9 5 9-5M12 13v9M8 5l9 5" />
    </svg>;
}

function Icone({ children }: { children: ReactNode }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" aria-hidden="true" focusable="false" className="shrink-0">
      {children}
    </svg>
  );
}

export function Combat() {
  return <Icone><path d="m3 3 5 1 12 14-3 3L4 8zM21 3l-5 1-5 6m-3 5-5 5m12-1 5-5M4 14l6 6" /></Icone>;
}

export function IconeBadge() {
  return <Icone><path d="m12 2 3 4 5 1-1 5 1 5-5 1-3 4-3-4-5-1 1-5-1-5 5-1z" /><circle cx="12" cy="12" r="4" /></Icone>;
}

export function IconeCadenas() {
  return <svg viewBox="0 0 24 24" className="inline size-4" fill="none" stroke="currentColor" aria-hidden="true" focusable="false">
    <path d="M7 10V7a5 5 0 0 1 10 0v3M5 10h14v12H5z" />
  </svg>;
}

export function Equipe() {
  return <Icone><path d="M4 3h6v6H4zM14 3h6v6h-6zM4 15h6v6H4zM14 15h6v6h-6z" /></Icone>;
}

export function Shop() {
  return <Icone><path d="M4 8h16v13H4zM8 8V3h8v5M4 13h16M10 12v3h4v-3" /></Icone>;
}

export function Carte() {
  return <Icone><path d="m2 5 6-3 8 3 6-3v17l-6 3-8-3-6 3zM8 2v17M16 5v17" /></Icone>;
}

export function PC() {
  return <Icone><path d="M3 4h18v12H3zM9 20h6M12 16v4" /></Icone>;
}

export function Radar() {
  return <Icone><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4.5" /><path d="m12 12 6.4-6.4" /><circle cx="15.5" cy="15.5" r="1" className="fill-current" /></Icone>;
}

export function Crayon() {
  return <Icone><path d="m4 20 1-5L16 4l4 4L9 19zM14 6l4 4" /></Icone>;
}

/** Petite pokéball posée à côté du nom d'une espèce déjà capturée (Pokédex, Radar, ennemi). */
export function PastilleCapture() {
  return <svg role="img" aria-label="Déjà capturé" focusable="false" viewBox="0 0 24 24"
    className="ms-1 inline size-5 shrink-0 align-text-bottom" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 12a10 10 0 0 1 20 0z" className="fill-erreur-base" />
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" />
    <circle cx="12" cy="12" r="3.5" className="fill-surface" />
  </svg>;
}

export function Plus() {
  return <Icone><path d="M3 10h3v4H3zM10 10h3v4h-3zM17 10h3v4h-3z" /></Icone>;
}
