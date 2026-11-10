import type { ReactNode } from 'react';

/** Tracé de l'icône Fauchage : celui du bouton du combat, repris pour la CT Fauchage du Shop (aucune image d'objet n'existe). */
const TRACE_FAUCHAGE = 'M12 20.5C6 16.5 3 13 3 9a4.5 4.5 0 0 1 9-1.2A4.5 4.5 0 0 1 21 9c0 4-3 7.5-9 11.5zM10.5 11l1.7-1.3v5.8M10.5 15.5h3.4';
const TRACE_REPLI = 'm12 3 9 5v9l-9 5-9-5V8zM3 8l9 5 9-5M12 13v9M8 5l9 5';
/** Objets sans image dont une icône du jeu existe déjà ; les autres retombent sur l'icône de repli. */
const TRACES_SANS_IMAGE: Record<string, string> = { falseSwipe: TRACE_FAUCHAGE };

export function IconeObjet({ image, nom, taille, id }: { image: string | null; nom: string; taille?: 'petite'; id?: string }) {
  const classe = `image-rendering-pixelated shrink-0 ${taille === 'petite' ? 'size-8' : 'h-12 w-12'}`;
  if (image !== null) return <img src={image} alt="" width={taille === 'petite' ? 32 : 48} height={taille === 'petite' ? 32 : 48} className={classe} />;
  const trace = id ? TRACES_SANS_IMAGE[id] : undefined;
  return <svg role="img" aria-label={nom} focusable="false" viewBox="0 0 24 24" data-icone-repli={trace ? undefined : ''}
    fill="none" stroke="currentColor" strokeWidth="2" className={classe}>
    <path d={trace ?? TRACE_REPLI} />
  </svg>;
}

function Icone({ children, taille = 24 }: { children: ReactNode; taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" aria-hidden="true" focusable="false" className="shrink-0">
      {children}
    </svg>
  );
}

export function Combat() {
  return <Icone><path d="m3 3 5 1 12 14-3 3L4 8zM21 3l-5 1-5 6m-3 5-5 5m12-1 5-5M4 14l6 6" /></Icone>;
}

export function AutoAttaque() {
  return <Icone><path d="m13 2-9 12h7l-1 8 10-13h-7z" /></Icone>;
}

export function ArretAuto() {
  return <Icone><path d="M8 3h8l5 5v8l-5 5H8l-5-5V8zM9 8v8M15 8v8" /></Icone>;
}

export function ReglagesArret() {
  return <Icone><path d="M4 6h16M4 12h16M4 18h16M8 3v6M16 9v6M10 15v6" /></Icone>;
}

export function AutoClic() {
  return <Icone><path d="m5 3 14 10-7 1-3 7zM15 3v4M19 6l3-2" /></Icone>;
}

/** Cœur marqué « 1 » : le Fauchage laisse l'ennemi à 1 PV. */
export function Fauchage({ taille }: { taille?: number } = {}) {
  return <Icone taille={taille}><path d={TRACE_FAUCHAGE} /></Icone>;
}

export function Sac() {
  return <Icone><path d="M8 6V3h8v3M6 6h12l3 15H3zM7 13h10v5H7z" /></Icone>;
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

export function Menu() {
  return <Icone><path d="M3 5h18v2H3zM3 11h18v2H3zM3 17h18v2H3z" /></Icone>;
}
