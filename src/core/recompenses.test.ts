import { describe, expect, it } from 'vitest';
import {
  appliquerVictoire, calculerMaxXp, calculerOr, calculerXp, delaiEnnemiSuivant,
} from './recompenses';
import type { Victoire } from './recompenses';
import { reglages } from './reglages';
import type { DonneesRegion, PokemonPossede } from './sauvegarde-types';

const victoire: Victoire = { numero: 1, niveau: 2, shiny: false, boss: false, rarete: 'commun' };

function pokemon(champs: Partial<PokemonPossede> = {}): PokemonPossede {
  return {
    uid: 'bulbizarre', numero: 1, niveau: 1, xp: 0, shiny: false,
    bonheur: 0, pierreEternelle: false, calcium: 0, sexe: 'male', favori: false,
    ...champs,
  };
}

function region(equipe: PokemonPossede[]): DonneesRegion {
  return {
    ...structuredClone(reglages.depart.region),
    regionId: 'kanto', zoneId: 'route-1', etape: 1, equipe,
    badges: [], bossVaincus: [], objetsCles: [], quetes: [], drapeaux: [],
    evenementsJoues: [], argent: 10, inventaire: {}, ligueGagnee: 0,
  };
}

describe('Récompenses de victoire', () => {
  it('gagne un seul niveau et conserve le surplus malgré un énorme gain', () => {
    const v = { ...victoire, niveau: 100, boss: true, rarete: null };
    const resultat = appliquerVictoire(region([pokemon({ xp: 3 })]), v);
    expect(resultat.region.equipe[0]).toMatchObject({
      niveau: 2, xp: 3 + calculerXp(v) - calculerMaxXp(1, 1),
    });
    expect(resultat.region.equipe[0]?.xp).toBeGreaterThan(calculerMaxXp(1, 2));
    expect(resultat.montees).toEqual([{ uid: 'bulbizarre', niveau: 2 }]);
    expect(resultat.bonbons).toBe(0);
  });

  it('passe de 99 à 100 et remet son XP à zéro', () => {
    const resultat = appliquerVictoire(region([pokemon({ niveau: 99, xp: calculerMaxXp(1, 99) - 1 })]), victoire);
    expect(resultat.region.equipe[0]).toMatchObject({ niveau: 100, xp: 0 });
    expect(resultat.montees).toEqual([{ uid: 'bulbizarre', niveau: 100 }]);
    expect(calculerMaxXp(1, 100)).toBe(0);
  });

  it('ne donne pas d’XP à un membre au niveau maximal', () => {
    const resultat = appliquerVictoire(region([pokemon({ niveau: 100, xp: 7 })]), victoire);
    expect(resultat.region.equipe[0]).toMatchObject({ niveau: 100, xp: 7 });
    expect(resultat.montees).toEqual([]);
  });

  it('donne du bonheur aux œufs sans leur donner d’XP', () => {
    const resultat = appliquerVictoire(region([pokemon({
      xp: 7, oeuf: { pasRestants: 10, pasMax: 20 },
    })]), victoire);
    expect(resultat.region.equipe[0]).toMatchObject({ niveau: 1, xp: 7, bonheur: 1 });
    expect(resultat.montees).toEqual([]);
  });

  it.each([
    { ecart: 25, bonheur: 1 },
    { ecart: 26, bonheur: 0 },
  ])('accorde $bonheur point de bonheur pour un écart de $ecart niveaux', ({ ecart, bonheur }) => {
    const resultat = appliquerVictoire(region([pokemon({ niveau: victoire.niveau + ecart })]), victoire);
    expect(resultat.region.equipe[0]?.bonheur).toBe(bonheur);
  });

  it('évalue l’écart de bonheur après la montée de niveau', () => {
    const niveau = victoire.niveau + reglages.recompenses.bonheur.ecartMax;
    const resultat = appliquerVictoire(region([pokemon({ niveau, xp: calculerMaxXp(1, niveau) - 1 })]), victoire);
    expect(resultat.region.equipe[0]).toMatchObject({ niveau: niveau + 1, bonheur: 0 });
  });

  it('plafonne le bonheur à 255', () => {
    const resultat = appliquerVictoire(region([
      pokemon({ bonheur: 254 }), pokemon({ uid: 'autre', bonheur: 255 }),
    ]), victoire);
    expect(resultat.region.equipe.map((membre) => membre.bonheur)).toEqual([255, 255]);
  });

  it.each([undefined, 2])('ajoute cinq bonbons pour un shiny avec un stock initial de %s', (stock) => {
    const entree = region([]);
    if (stock !== undefined) entree.inventaire.bonbon = stock;
    const resultat = appliquerVictoire(entree, { ...victoire, shiny: true });
    expect(resultat.bonbons).toBe(5);
    expect(resultat.region.inventaire.bonbon).toBe((stock ?? 0) + 5);
    expect(resultat.or).toBe(calculerOr(victoire) * 5);
  });

  it('met à jour l’argent et les statistiques sans muter la région d’entrée', () => {
    const entree = region([pokemon(), pokemon({ uid: 'oeuf', oeuf: { pasRestants: 10, pasMax: 20 } })]);
    entree.statistiques = { eliminations: 4, argentTotalGagne: 30 };
    entree.inventaire.bonbon = 2;
    const avant = structuredClone(entree);
    const resultat = appliquerVictoire(entree, { ...victoire, shiny: true });
    expect(entree).toEqual(avant);
    expect(resultat.region).not.toBe(entree);
    expect(resultat.region.equipe).not.toBe(entree.equipe);
    resultat.region.equipe.forEach((membre, index) => expect(membre).not.toBe(entree.equipe[index]));
    expect(resultat.region.argent).toBe(10 + resultat.or);
    expect(resultat.region.statistiques).toEqual({ eliminations: 5, argentTotalGagne: 30 + resultat.or });
    expect(resultat.xp).toBe(calculerXp(victoire));
  });

  it('calcule l’or d’un commun au niveau 2', () => {
    expect(calculerOr(victoire)).toBe(Math.floor(2 * 4 + Math.pow(2, 1.4)));
  });
});

describe('Délai avant l’ennemi suivant', () => {
  it.each([
    { nom: 'à pied', actifs: [], ms: 2000 },
    { nom: 'avec les Chaussures', actifs: ['objet:runningShoes'], ms: 1000 },
    { nom: 'avec la Bicyclette', actifs: ['objet:bicycle'], ms: 500 },
    { nom: 'avec Bicyclette prioritaire sur Chaussures', actifs: ['objet:runningShoes', 'objet:bicycle'], ms: 500 },
    { nom: 'avec Terre', actifs: ['badge:terre'], ms: 1666 },
    {
      nom: 'avec Bicyclette, Terre et jalon 50',
      actifs: ['jalon:50', 'badge:terre', 'objet:bicycle'],
      ms: Math.floor(Math.floor(500 / 1.2) * 0.9),
    },
  ])('calcule le délai $nom', ({ actifs, ms }) => {
    expect(delaiEnnemiSuivant(actifs)).toBe(ms);
  });
});
