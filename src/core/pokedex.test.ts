import { describe, expect, it } from 'vitest';
import { ajouterAuPokedex, completerPokedex, pokedexDeKanto } from './pokedex';
import { chargerPokemon } from './pokemon';
import type { DonneesRegion, PokemonPossede } from './sauvegarde-types';

function pokemon(numero: number, oeuf = false): PokemonPossede {
  return {
    uid: String(numero), numero, niveau: 1, xp: 0, shiny: false,
    bonheur: 0, pierreEternelle: false, calcium: 0, sexe: 'sansSexe', favori: false,
    ...(oeuf ? { oeuf: { pasRestants: 1, pasMax: 1 } } : {}),
  };
}

function geler(valeur: object): void {
  Object.values(valeur).forEach(enfant => {
    if (enfant !== null && typeof enfant === 'object') geler(enfant);
  });
  Object.freeze(valeur);
}

function region(): DonneesRegion {
  return {
    regionId: 'kanto', zoneId: 'kanto.bourg-palette', etape: 0,
    equipe: [pokemon(1), pokemon(4, true), pokemon(0)],
    pc: [pokemon(25), pokemon(7, true), pokemon(152)],
    pension: {
      parents: [pokemon(151), pokemon(39, true), pokemon(1.5)],
      oeufs: [pokemon(10)], emplacementsOeuf: 1,
    },
    badges: [], bossVaincus: [], objetsCles: [], quetes: [], drapeaux: [],
    evenementsJoues: [], argent: 0, inventaire: {}, ligueGagnee: 0,
    ameliorations: [], jalonsRecus: [], starterId: null,
    statistiques: { eliminations: 0, argentTotalGagne: 0 },
    chronos: {
      finRepousse: 0, finSuperRepousse: 0, finBoostAttaque: 0,
      finBoostAttaqueSpeciale: 0, rechargeFauchage: 0,
    },
    jetons: 0,
    arretAuto: {
      commun: false, peuCommun: false, rare: false, tresRare: false,
      legendaire: false, shiny: false, nouveau: false,
    },
  };
}

describe('Pokédex', () => {
  it('conserve la référence pour un doublon et ajoute dans l’ordre d’arrivée', () => {
    const entree = Object.freeze([25, 1]);
    expect(ajouterAuPokedex(entree, 25)).toBe(entree);
    const resultat = ajouterAuPokedex(entree, 7);
    expect(resultat).not.toBe(entree);
    expect(resultat).toEqual([25, 1, 7]);
    expect(entree).toEqual([25, 1]);
  });

  it('complète depuis les trois lieux sans œufs ni numéros invalides, sans mutation', () => {
    const entree = Object.freeze([150, 25]);
    const donnees = region();
    const avant = structuredClone(donnees);
    geler(donnees);
    const resultat = completerPokedex(entree, donnees);
    expect(resultat).toEqual([150, 25, 1, 151]);
    expect(entree).toEqual([150, 25]);
    expect(donnees).toEqual(avant);
    expect(completerPokedex(Object.freeze(resultat), donnees)).toBe(resultat);
  });

  it('compte chaque espèce du catalogue une fois et ignore les numéros hors Kanto', () => {
    const entree = Object.freeze([1, 25, 25, 200]);
    const catalogue = chargerPokemon();
    geler(catalogue);
    expect(pokedexDeKanto(entree, catalogue)).toEqual({
      captures: new Set([1, 25]), nombre: 2, total: 151,
    });
    expect(pokedexDeKanto(Object.freeze([-1, 0, 1.5, 152, 200]), catalogue).nombre).toBe(0);
    expect(entree).toEqual([1, 25, 25, 200]);
  });

  it('utilise les numéros et la taille du catalogue fourni', () => {
    const catalogue = chargerPokemon();
    const extrait = { ...catalogue, liste: catalogue.liste.slice(0, 1) };
    geler(extrait);
    expect(pokedexDeKanto(Object.freeze([1, 25]), extrait)).toEqual({
      captures: new Set([1]), nombre: 1, total: 1,
    });
  });
});
