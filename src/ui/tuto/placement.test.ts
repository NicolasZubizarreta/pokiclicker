import { expect, it } from 'vitest';
import { placerTuto, type EntreePlacement, type Rect } from './placement';

const entree = (cible: Rect | null): EntreePlacement => ({
  zone: { x: 0, y: 0, w: 360, h: 700 }, cible, obstacles: [], marge: 12,
  chen: { w: 114, h: 96 }, carte: { largeurMax: 400, largeurMin: 180, hauteur: () => 120 },
});
const chevauche = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

it('place la carte en bas pour une cible en haut', () => {
  expect(placerTuto(entree({ x: 20, y: 20, w: 320, h: 40 })).carteEn).toBe('bas');
});
it('déplace Chen pour dégager la cible en bas à droite', () => {
  const e = entree({ x: 260, y: 610, w: 60, h: 50 });
  const p = placerTuto(e);
  expect(p.coinChen).not.toBe('bas-droite');
  expect(chevauche(p.chen, e.cible!)).toBe(false);
  expect(p.masqueCible).toBe(false);
});
it('préfère haut et bas-droite sans cible', () => {
  expect(placerTuto(entree(null))).toMatchObject({ carteEn: 'haut', coinChen: 'bas-droite', masqueCible: false });
});
it('dégage le centre sur téléphone et reste déterministe', () => {
  const e = entree({ x: 120, y: 300, w: 120, h: 100 });
  const p = placerTuto(e);
  expect(chevauche(p.carte, e.cible!)).toBe(false);
  expect(chevauche(p.chen, e.cible!)).toBe(false);
  expect(p.masqueCible).toBe(false);
  expect(placerTuto(e)).toEqual(p);
});
it('évite un obstacle quand une autre position est libre', () => {
  const e = entree({ x: 120, y: 300, w: 120, h: 100 });
  e.obstacles = [{ x: 20, y: 20, w: 320, h: 50 }];
  const p = placerTuto(e);
  expect(chevauche(p.carte, e.obstacles[0]!)).toBe(false);
  expect(chevauche(p.chen, e.obstacles[0]!)).toBe(false);
});
it('signale le masquage inévitable dans une petite zone', () => {
  const e = entree({ x: 0, y: 0, w: 140, h: 140 });
  e.zone = { x: 0, y: 0, w: 140, h: 140 };
  expect(placerTuto(e).masqueCible).toBe(true);
});
it('respecte les marges, le coin et la largeur disponible du même côté', () => {
  const e = entree({ x: 120, y: 300, w: 120, h: 100 });
  e.zone = { x: 50, y: 25, w: 360, h: 700 };
  e.obstacles = [{ x: 50, y: 600, w: 360, h: 125 }];
  const p = placerTuto(e);
  expect(p).toMatchObject({ carteEn: 'haut', coinChen: 'haut-droite',
    carte: { x: 62, y: 37, w: 210, h: 120 }, chen: { x: 284, y: 37, w: 114, h: 96 } });
});
