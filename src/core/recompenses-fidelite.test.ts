import { describe, expect, it } from 'vitest';
import references from '../../tests/fixtures/v1-recompenses.json';
import { appliquerVictoire, calculerMaxXp, calculerOr, calculerXp,
  delaiEnnemiSuivant } from './recompenses';
import type { Victoire } from './recompenses';
import { regionInitiale } from './sauvegarde';
import type { PokemonPossede } from './sauvegarde-types';

const raretes: Record<string, Victoire['rarete']> = {
  Commun: 'commun', 'Peu Commun': 'peu-commun', Rare: 'rare',
  'Très Rare': 'tres-rare', Légendaire: 'legendaire',
};

describe('Fidélité stricte des récompenses à la V1', () => {
  it.each(references.scenarios)('$nom', (scenario) => {
    const rarete = scenario.ennemi.rarete === null ? null : raretes[scenario.ennemi.rarete];
    if (rarete === undefined) throw new Error(`Rareté V1 inconnue : ${scenario.ennemi.rarete}`);
    const victoire: Victoire = { ...scenario.ennemi, rarete };
    const regionAvant = regionInitiale('kanto', 'kanto.route-1');
    regionAvant.argent = 0;
    regionAvant.inventaire = {};
    regionAvant.statistiques = { eliminations: 0, argentTotalGagne: 0 };
    regionAvant.equipe = scenario.equipeAvant.map((membre, index): PokemonPossede => ({
      uid: `membre-${index}`, numero: membre.numero, niveau: membre.niveau,
      xp: membre.xp, shiny: false, bonheur: membre.bonheur, pierreEternelle: false,
      calcium: 0, sexe: 'sansSexe', favori: false,
      ...(membre.oeuf ? { oeuf: { pasRestants: 5, pasMax: 5 } } : {}),
    }));

    expect(calculerOr(victoire, scenario.actifs)).toEqual(scenario.or);
    expect(calculerXp(victoire, scenario.actifs)).toEqual(scenario.xpMembre);
    const { region, bonbons } = appliquerVictoire(regionAvant, victoire, scenario.actifs);
    expect(region.equipe.map(({ niveau, xp, bonheur }) => ({ niveau, xp, bonheur })))
      .toEqual(scenario.equipeApres);
    expect(region.argent).toEqual(scenario.or);
    expect(bonbons).toEqual(scenario.bonbons);
    expect(region.inventaire.bonbon ?? 0).toEqual(scenario.bonbons);
    expect(region.statistiques.eliminations).toEqual(scenario.eliminations);
    expect(region.statistiques.argentTotalGagne).toEqual(scenario.argentTotalGagne);
  });

  it('reproduit les seuils des 151 Pokémon aux niveaux 1 à 99 et le plafond au niveau 100', () => {
    const maxXp: Record<string, number[]> = references.maxXp;
    const ecarts: { numero: number; niveau: number; attendu: number | undefined; obtenu: number }[] = [];
    for (let numero = 1; numero <= 151; numero++) {
      for (let niveau = 1; niveau <= 100; niveau++) {
        const attendu = niveau === 100 ? 0 : maxXp[numero]?.[niveau - 1];
        const obtenu = calculerMaxXp(numero, niveau);
        if (obtenu !== attendu) ecarts.push({ numero, niveau, attendu, obtenu });
      }
    }
    expect(ecarts, `Premier écart de seuil XP : ${JSON.stringify(ecarts[0])}`).toEqual([]);
  });

  it.each(references.delais)('reproduit le délai V1 : $nom', ({ actifs, delaiMs }) => {
    expect(delaiEnnemiSuivant(actifs)).toEqual(delaiMs);
  });

  it('vérifie en sentinelle les 22 scénarios, 151 séries de 99 seuils et 6 délais', () => {
    expect(references.scenarios).toHaveLength(22);
    expect(Object.keys(references.maxXp)).toHaveLength(151);
    expect(Object.values(references.maxXp).map((seuils) => seuils.length))
      .toEqual(Array(151).fill(99));
    expect(references.delais).toHaveLength(6);
  });
});
