import { describe, expect, it } from 'vitest';
import { calculerStatistiques } from './statistiques';
import { regionInitiale } from './sauvegarde';
import { validerEnveloppe } from './sauvegarde-validation';
import { reglages } from './reglages';

describe('statistiques V1', () => {
  it.each([undefined, {}, { eliminations: 12 }])('charge une sauvegarde aux compteurs incomplets : %j', statistiques => {
    const resultat = validerEnveloppe({ version: 3, niveau: 'region', id: 'kanto', revision: 1,
      ecritLe: '2026-11-02T00:00:00.000Z', donnees: { ...regionInitiale('kanto', 'kanto.bourg-palette'), statistiques } }, 'region');
    expect(resultat.donnees).toMatchObject({ statistiques: { eliminations: statistiques?.eliminations ?? 0, argentTotalGagne: 0 } });
  });
  it('reprend les sept libellés et les compteurs absents valent zéro', () => {
    const stats = calculerStatistiques();
    expect(stats.map(s => s.libelle)).toEqual(['Pokémon vaincus', 'Argent total', 'Dégâts clic', 'DPS équipe', 'Gains argent', 'Gains XP', 'Taux capture']);
    expect(stats.slice(0, 2).map(s => s.valeur)).toEqual([0, 0]);
    expect(stats.slice(2, 6).map(s => s.total)).toEqual(['5', '0.0', `x${reglages.recompenses.or.multiplicateur.toFixed(2)}`, 'x1.00']);
    expect(stats.slice(2).every(s => s.boosts?.length === 0)).toBe(true);
    expect(calculerStatistiques({ argent: 999, statistiques: { eliminations: 12 } })[1]!.valeur).toBe(0);
  });

  it('lit les compteurs cumulés et calcule les bonus sauvegardés sans cible', () => {
    const region = regionInitiale('kanto', 'kanto.bourg-palette');
    region.statistiques = { eliminations: 123, argentTotalGagne: 4567 };
    region.equipe = [{ uid: 'test', numero: 1, niveau: 5, xp: 0, shiny: false, bonheur: 0,
      pierreEternelle: false, calcium: 0, sexe: 'male', favori: false }];
    region.badges = ['roche', 'cascade', 'marais', 'ame', 'prisme'];
    region.ameliorations = ['amuletCoin', 'protein'];
    region.jalonsRecus = [10, 30];
    region.inventaire.omniExp = 1;
    region.chronos.finBoostAttaque = 2000;
    const stats = calculerStatistiques(region, 1000);
    expect(stats.slice(0, 2).map(s => s.valeur)).toEqual([123, 4567]);
    expect(stats[2]!.boosts).toContain('Attaque + (x1.5)');
    expect(stats[3]!.boosts).toEqual(['Collectionneur (x1.5)', 'Badge Cascade (x1.3)']);
    expect(Number(stats[3]!.total)).toBeCloseTo(Number(stats[3]!.base) * 1.5 * 1.3, 1);
    expect(stats[4]!.total).toBe(`x${(1.3 * 1.2 * reglages.recompenses.or.multiplicateur).toFixed(2)}`);
    expect(stats[5]!.total).toBe('x3.00');
    expect(stats[6]!.boosts).toEqual(['Badge Marais (x1.3)']);
    expect(calculerStatistiques(region, 2000)[2]!.boosts).not.toContain('Attaque + (x1.5)');
    region.equipe[0]!.oeuf = { pasRestants: 10, pasMax: 10 };
    expect(calculerStatistiques(region)[3]!.total).toBe('0.0');
  });
});
