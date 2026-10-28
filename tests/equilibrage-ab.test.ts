import { describe, expect, it, vi } from 'vitest';
import { frequencesLegendaires, jouerParcours, tableauComparaison, tableauParcours } from '../scripts/simuler-parcours.mjs';
import * as clics from '../src/core/clics';
import * as clock from '../src/core/clock';
import * as combat from '../src/core/combat';
import * as boutique from '../src/core/boutique';
import * as capture from '../src/core/capture';
import * as ennemis from '../src/core/ennemis';
import * as evolution from '../src/core/evolution';
import * as ligue from '../src/core/ligue';
import * as loop from '../src/core/loop';
import * as objetsActifs from '../src/core/objets-actifs';
import * as pokedex from '../src/core/pokedex';
import * as pokemon from '../src/core/pokemon';
import * as progression from '../src/core/progression';
import * as recompenses from '../src/core/recompenses';
import * as regions from '../src/core/regions';
import * as reglages from '../src/core/reglages';
import * as sauvegarde from '../src/core/sauvegarde';
import * as starter from '../src/core/starter';
import * as stats from '../src/core/stats';
import type { PokemonPossede } from '../src/core/sauvegarde';

// Les mêmes modules que ceux que le script charge par Vite : le test les passe déjà chargés.
const coeur = {
  combat, clics, loop, clock, recompenses, capture, progression, boutique, objetsActifs, evolution, pokedex, regions,
  sauvegarde, starter, ligue, reglages, pokemon, ennemis, stats,
};

interface ZoneSimulee {
  id: string; victoire: boolean; premierEssai: 'victoire' | 'echec' | null; pvBoss: number | null;
  depense: number; gagne: number; boosters: number; margeAvecClics: number | null;
}
interface ResultatSimulation { fin: string; zones: ZoneSimulee[]; ameliorations: string[]; totalDepense: number }
type Lancer = (coeur: unknown, options?: Record<string, unknown>) => ResultatSimulation;
const jouer = jouerParcours as unknown as Lancer;

describe('simulateur de parcours (ticket AB)', () => {
  it('joue la Route 1 et la Forêt de Jade avec la vraie boucle et produit un tableau par zone', () => {
    const resultat = jouer(coeur, { jusquA: 'kanto.foret-de-jade', clics: 7 });
    expect(resultat.zones.map(zone => zone.id)).toEqual(['kanto.route-1', 'kanto.foret-de-jade']);
    expect(resultat.zones.every(zone => zone.victoire)).toBe(true);
    expect(resultat.fin).toContain('kanto.foret-de-jade');
    const tableau = (tableauParcours as unknown as (r: ResultatSimulation, m: unknown) => string)(resultat, coeur);
    expect(tableau).toContain('| Route 1 |');
    expect(tableau.split('\n')[0]).toContain('Argent gagné');
  });

  it('est déterministe pour une même graine', () => {
    const options = { jusquA: 'kanto.foret-de-jade', clics: 7, graine: 3 };
    expect(jouer(coeur, options)).toEqual(jouer(coeur, options));
  });

  it('rend le multiplicateur d’argent à son état après une simulation « avant »', () => {
    const valeur = reglages.reglages.recompenses.or.multiplicateur;
    jouer(coeur, { jusquA: 'kanto.route-1', avant: true });
    expect(reglages.reglages.recompenses.or.multiplicateur).toBe(valeur);
  });

  it('compare les marges « à équipe égale » : 0 % avant la Centrale, -20 % à partir d’elle', () => {
    const resultat = (pvTour: number, pvCentrale: number) => ({
      zones: [
        { nom: 'Tour Pokémon', pvBoss: pvTour, margeAvecClics: pvTour / 1000 },
        { nom: 'Centrale', pvBoss: pvCentrale, margeAvecClics: pvCentrale / 1000 },
      ],
    });
    const comparer = tableauComparaison as unknown as (a: unknown, b: unknown) => string;
    const lignes = comparer(resultat(500, 1000), resultat(500, 800)).split('\n');
    const colonnes = (nom: string) => lignes.find(ligne => ligne.startsWith(`| ${nom} |`))!.split('|').map(c => c.trim());
    expect(colonnes('Tour Pokémon').at(-2)).toBe('+0 %');
    expect(colonnes('Centrale').at(-2)).toBe('-20 %');
  });

  it('n’achète aucune amélioration ni aucun booster sans bonus', () => {
    const resultat = jouer(coeur, { jusquA: 'kanto.foret-de-jade', sansBonus: true });
    expect(resultat.ameliorations).toEqual([]);
    expect(resultat.zones.reduce((somme, zone) => somme + zone.boosters, 0)).toBe(0);
  });

  it('mesure les légendaires dans la statistique sur 10 000 rencontres', () => {
    const lignes = (frequencesLegendaires as unknown as (m: unknown, o: { rencontres: number }) => {
      zone: string; pokemon: number; attendu: number; observe: number; dansLaStatistique: boolean;
    }[])(coeur, { rencontres: 10000 });
    expect(lignes.map(ligne => ligne.pokemon).sort((a, b) => a - b)).toEqual([144, 145, 146, 150, 151]);
    for (const ligne of lignes) {
      expect(ligne.dansLaStatistique).toBe(true);
      expect(ligne.observe).toBeGreaterThan(ligne.attendu * 0.7);
      expect(ligne.observe).toBeLessThan(ligne.attendu * 1.3);
    }
  });
});

describe('argent ×2 et sauvegarde existante (ticket AB)', () => {
  it('charge une sauvegarde existante sans toucher à son argent ni à ses niveaux, et sans l’écrire', () => {
    const stockage = sauvegarde.creerStockageMemoire();
    const horloge = clock.creerHorlogeSimulee(Date.UTC(2026, 9, 28));
    const jeu = sauvegarde.creerGestionnaire({ stockage, horloge, genererId: () => 'partie-ab' });
    const partie = jeu.creerPartie('Ancienne partie');
    const joueur: PokemonPossede = { uid: 'a', numero: 6, niveau: 57, xp: 12, shiny: false, bonheur: 0,
      pierreEternelle: false, calcium: 0, sexe: 'male', favori: false };
    const region = { ...sauvegarde.regionInitiale('kanto', 'kanto.route-1'), argent: 123456, equipe: [joueur] };
    jeu.ecrireRegion(partie.id, 'kanto', region);
    const avant = stockage.cles().map(cle => [cle, stockage.lire(cle)]);
    const ecrire = vi.spyOn(stockage, 'ecrire');
    const charge = jeu.chargerRegion(partie.id, 'kanto')!;
    expect(charge.donnees.argent).toBe(123456);
    expect(charge.donnees.equipe.map(membre => membre.niveau)).toEqual([57]);
    expect(ecrire).not.toHaveBeenCalled();
    expect(stockage.cles().map(cle => [cle, stockage.lire(cle)])).toEqual(avant);
    const autre = sauvegarde.creerGestionnaire({ stockage: sauvegarde.creerStockageMemoire(), horloge, genererId: () => 'partie-ab-2' });
    const copie = autre.importerPartie(jeu.exporterPartie(partie.id));
    expect(autre.chargerRegion(copie.id, 'kanto')!.donnees.argent).toBe(123456);
  });

  it('applique le ×2 une seule fois sur l’or d’un ennemi, d’un boss et d’un chromatique', () => {
    const { or } = reglages.reglages.recompenses;
    expect(or.multiplicateur).toBe(2);
    expect(or.capture).toBe(2);
    const sansMultiplicateur = { ...reglages.reglages.recompenses, or: { ...or, multiplicateur: 1 } };
    for (const victoire of [
      { numero: 19, niveau: 10, rarete: 'commun' as const, shiny: false, boss: false },
      { numero: 19, niveau: 10, rarete: null, shiny: false, boss: true },
      { numero: 19, niveau: 10, rarete: 'commun' as const, shiny: true, boss: false },
    ]) {
      expect(recompenses.calculerOr(victoire, [])).toBe(recompenses.calculerOr(victoire, [], sansMultiplicateur) * 2);
    }
  });
});
