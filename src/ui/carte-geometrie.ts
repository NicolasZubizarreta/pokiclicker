import type { FormeCarte } from '../core/monde';
import { reglages } from '../core/reglages';

export type Point = { x: number; y: number };
export type Vue = { x: number; y: number; largeur: number; hauteur: number };

/** Coordonnées en unités du viewBox 0 0 16 9. */
export function centreForme(forme: FormeCarte): Point {
  if (forme.forme === 'cercle') return { x: forme.x * 16, y: forme.y * 9 };
  if (forme.forme === 'rect') return { x: (forme.x + forme.l / 2) * 16, y: (forme.y + forme.h / 2) * 9 };
  // V1 : milieu de la boîte englobante, save.js L717-760.
  const xs = forme.points.map(([x]) => x);
  const ys = forme.points.map(([, y]) => y);
  return { x: (Math.min(...xs) + Math.max(...xs)) * 8, y: (Math.min(...ys) + Math.max(...ys)) * 4.5 };
}

export function attributsSvg(forme: FormeCarte) {
  if (forme.forme === 'rect') return { x: forme.x * 16, y: forme.y * 9, width: forme.l * 16, height: forme.h * 9 };
  if (forme.forme === 'cercle') return { cx: forme.x * 16, cy: forme.y * 9, r: forme.r * 16 };
  return { points: forme.points.map(([x, y]) => `${x * 16},${y * 9}`).join(' ') };
}

export function rayonCible(pxParUnite: number): number {
  return 22 / pxParUnite;
}

export function vueInitiale(): Vue {
  return { x: 0, y: 0, largeur: 16, hauteur: 9 };
}

/** Préserve le ratio de l'image et borne le zoom ainsi que la position. */
export function borner(vue: Vue): Vue {
  const zoom = Math.max(1, Math.min(reglages.carte.zoomMax, 16 / vue.largeur));
  const largeur = 16 / zoom;
  const hauteur = 9 / zoom;
  return {
    x: Math.max(0, Math.min(16 - largeur, vue.x)),
    y: Math.max(0, Math.min(9 - hauteur, vue.y)),
    largeur, hauteur,
  };
}

/** Facteur multiplicatif ; le point reste à la même position dans la vue. */
export function zoomer(vue: Vue, facteur: number, point: Point): Vue {
  const zoom = Math.max(1, Math.min(reglages.carte.zoomMax, 16 / vue.largeur * facteur));
  const largeur = 16 / zoom;
  const hauteur = 9 / zoom;
  return borner({
    x: point.x - (point.x - vue.x) * largeur / vue.largeur,
    y: point.y - (point.y - vue.y) * hauteur / vue.hauteur,
    largeur, hauteur,
  });
}

/** Déplacement en unités du viewBox. */
export function deplacer(vue: Vue, dx: number, dy: number): Vue {
  return borner({ ...vue, x: vue.x + dx, y: vue.y + dy });
}
