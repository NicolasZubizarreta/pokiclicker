import { describe, expect, it } from 'vitest';
import kanto from '../../data/regions/kanto/zones.json';
import type { FormeCarte } from '../core/monde';
import { reglages } from '../core/reglages';
import { attributsSvg, borner, centreForme, deplacer, positionFiche, rayonCible, vueInitiale, zoomer } from './carte-geometrie';

describe('position de la fiche', () => {
  const carte = { largeur: 800, hauteur: 450 };
  const fiche = { largeur: 200, hauteur: 100 };
  it('se place au-dessus par défaut', () => {
    expect(positionFiche({ x: 8, y: 4.5 }, vueInitiale(), carte, fiche, 8)).toEqual({ x: 300, y: 117 });
  });
  it('bascule en dessous si le haut manque de place', () => {
    expect(positionFiche({ x: 8, y: 1 }, vueInitiale(), carte, fiche, 8)).toEqual({ x: 300, y: 58 });
  });
  it('borne les côtés et le bas, même pour une zone hors vue', () => {
    expect(positionFiche({ x: -4, y: 20 }, vueInitiale(), carte, fiche, 8)).toEqual({ x: 8, y: 342 });
    expect(positionFiche({ x: 16, y: 4.5 }, vueInitiale(), carte, fiche, 8)).toEqual({ x: 592, y: 117 });
  });
  it('tient compte du zoom et du déplacement de la vue', () => {
    expect(positionFiche({ x: 6, y: 4 }, { x: 4, y: 2, largeur: 8, hauteur: 4.5 }, carte, fiche, 8)).toEqual({ x: 100, y: 92 });
  });
});

describe('géométrie de la carte', () => {
  it('centre les vraies formes de Kanto dans le viewBox', () => {
    const formes = kanto.carte.formes as FormeCarte[];
    for (const type of ['rect', 'cercle', 'polygone'] as const) {
      const forme = formes.find(f => f.forme === type)!;
      expect(forme).toBeDefined();
      if (forme.forme === 'rect') {
        expect(centreForme(forme)).toEqual({ x: (forme.x + forme.l / 2) * 16, y: (forme.y + forme.h / 2) * 9 });
      } else if (forme.forme === 'cercle') {
        expect(centreForme(forme)).toEqual({ x: forme.x * 16, y: forme.y * 9 });
      } else {
        const xs = forme.points.map(p => p[0]).sort((a, b) => a - b);
        const ys = forme.points.map(p => p[1]).sort((a, b) => a - b);
        expect(centreForme(forme)).toEqual({ x: (xs[0]! + xs[xs.length - 1]!) * 8, y: (ys[0]! + ys[ys.length - 1]!) * 4.5 });
      }
    }
  });

  it('convertit tous les attributs SVG et le rayon de toucher', () => {
    const base = { zone: null, nom: 'test', teinte: 'route' };
    expect(attributsSvg({ ...base, forme: 'rect', x: 0.25, y: 0.5, l: 0.5, h: 0.25 })).toEqual({ x: 4, y: 4.5, width: 8, height: 2.25 });
    expect(attributsSvg({ ...base, forme: 'cercle', x: 0.25, y: 0.5, r: 0.125 })).toEqual({ cx: 4, cy: 4.5, r: 2 });
    const polygone: FormeCarte = { ...base, forme: 'polygone', points: [[0, 0], [1, 0], [0, 1]] };
    expect(attributsSvg(polygone)).toEqual({ points: '0,0 16,0 0,9' });
    expect(centreForme(polygone)).toEqual({ x: 8, y: 4.5 });
    expect(rayonCible(2)).toBe(reglages.carte.rayonCiblePx / 2);
    expect(rayonCible(44)).toBe(reglages.carte.rayonCiblePx / 44);
  });

  it('zoome autour du point sans modifier la vue reçue', () => {
    const vue = vueInitiale();
    expect(zoomer(vue, 2, { x: 4, y: 3 })).toEqual({ x: 2, y: 1.5, largeur: 8, hauteur: 4.5 });
    expect(vue).toEqual({ x: 0, y: 0, largeur: 16, hauteur: 9 });
    expect(zoomer(zoomer(vue, 2, { x: 4, y: 3 }), 0.5, { x: 4, y: 3 })).toEqual(vue);
  });

  it('borne le zoom à 1–6 et garde toute la vue dans l’image', () => {
    for (const facteur of [0.01, 0.5, 1, 2, 6, 100]) {
      for (const point of [{ x: 0, y: 0 }, { x: 16, y: 9 }, { x: -20, y: 40 }]) {
        const vue = zoomer(vueInitiale(), facteur, point);
        expect(16 / vue.largeur).toBeGreaterThanOrEqual(1);
        expect(16 / vue.largeur).toBeLessThanOrEqual(6);
        expect(vue.largeur / vue.hauteur).toBeCloseTo(16 / 9);
        expect(vue.x).toBeGreaterThanOrEqual(0);
        expect(vue.y).toBeGreaterThanOrEqual(0);
        expect(vue.x + vue.largeur).toBeLessThanOrEqual(16);
        expect(vue.y + vue.hauteur).toBeLessThanOrEqual(9);
      }
    }
    expect(zoomer(vueInitiale(), 100, { x: 8, y: 4.5 }).largeur).toBe(16 / 6);
  });

  it('borne les déplacements et les dimensions', () => {
    const vue = { x: 4, y: 2, largeur: 8, hauteur: 4.5 };
    expect(deplacer(vue, 1, 0.5)).toEqual({ ...vue, x: 5, y: 2.5 });
    expect(deplacer(vue, -100, -100)).toEqual({ ...vue, x: 0, y: 0 });
    expect(deplacer(vue, 100, 100)).toEqual({ ...vue, x: 8, y: 4.5 });
    expect(borner({ x: -1, y: 20, largeur: 32, hauteur: 18 })).toEqual(vueInitiale());
    expect(borner({ x: 20, y: -1, largeur: 1.6, hauteur: 0.9 })).toEqual({ x: 16 - 16 / 6, y: 0, largeur: 16 / 6, hauteur: 9 / 6 });
  });
});
