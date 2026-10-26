import { describe, expect, it, vi } from 'vitest';
import donnees from '../../data/credits.json';
import { planCredits, tirerImageFlottante } from './credits';

describe('crédits', () => {
  it('reprend les textes et les temps extraits de la V1', () => {
    const plan = planCredits(false);
    expect(plan).toMatchObject({ titre: donnees.titre, message: donnees.message,
      sections: donnees.sections, temps: donnees.temps,
      imagesFlottantes: donnees.imagesFlottantes, mode: 'defilement', pages: [] });
    expect(plan.imagesFlottantes?.images).not.toContain('img/kanto/background/Pantheon.png');
  });

  it('répartit les 110 secondes entre les sections en mouvement réduit', () => {
    const plan = planCredits(true);
    expect(plan.mode).toBe('pages');
    expect(plan.imagesFlottantes).toBeNull();
    expect(plan.pages.map(page => page.section)).toEqual(donnees.sections);
    expect(plan.pages.reduce((total, page) => total + page.dureeMs, 0)).toBe(donnees.temps.dureeMs);
    plan.pages.forEach((page, index) => {
      expect(page.debutMs).toBe(donnees.temps.delaiMs
        + plan.pages.slice(0, index).reduce((total, precedente) => total + precedente.dureeMs, 0));
    });
  });

  it('renvoie des plans indépendants sans modifier les données', () => {
    const avant = structuredClone(donnees);
    const plan = planCredits(false);
    plan.sections[0]!.lignes.push('modifié');
    plan.temps.dureeMs = 1;
    plan.imagesFlottantes!.images.length = 0;
    const pages = planCredits(true);
    pages.pages[0]!.section.lignes.length = 0;
    expect(donnees).toEqual(avant);
    expect(planCredits(false).sections).toEqual(avant.sections);
  });

  it.each([0, 1 - Number.EPSILON])('respecte les bornes V1 avec un tirage à %s', valeur => {
    const haut = valeur > 0;
    const alea = vi.fn(() => valeur);
    const image = tirerImageFlottante([], alea);
    const taille = donnees.imagesFlottantes.taillePourcent[haut ? 1 : 0]!;
    expect(image).toEqual({ image: donnees.imagesFlottantes.images[haut
      ? donnees.imagesFlottantes.images.length - 1 : 0],
    x: haut ? 100 - taille : 0, y: haut ? 100 - taille : 0,
    w: taille, h: taille, vieMs: donnees.imagesFlottantes.vieMs[haut ? 1 : 0],
    opacite: donnees.imagesFlottantes.opacite });
    expect(alea).toHaveBeenCalledTimes(5);
  });

  it('ne tire rien quand trois images sont actives', () => {
    const alea = vi.fn(() => 0);
    expect(tirerImageFlottante(Array.from({ length: 3 }, () => ({ x: 0, y: 0, w: 8, h: 8 })), alea))
      .toBeNull();
    expect(alea).not.toHaveBeenCalled();
  });

  it('abandonne après dix placements en collision sans modifier les rectangles', () => {
    const actifs = Object.freeze([Object.freeze({ x: 0, y: 0, w: 100, h: 100 })]);
    const alea = vi.fn(() => 0);
    expect(tirerImageFlottante(actifs, alea)).toBeNull();
    expect(alea).toHaveBeenCalledTimes(22);
    expect(actifs).toEqual([{ x: 0, y: 0, w: 100, h: 100 }]);
  });

  it('réessaie après une collision et accepte les bords contigus', () => {
    const valeurs = [0, 0, 0, 0, 0.09, 0, 0];
    const alea = () => valeurs.shift()!;
    const actifs = Object.freeze([Object.freeze({ x: 0, y: 0, w: 8, h: 8 })]);
    expect(tirerImageFlottante(actifs, alea)).toMatchObject({ x: 8, y: 0, w: 8, h: 8 });
    expect(valeurs).toEqual([]);
  });
});
