import { describe, expect, it } from 'vitest';
import types from '../../data/types.json';
import { chargerPokemon, nomType } from './pokemon';

describe('nomType', () => {
  it('couvre les mêmes clés que data/types.json', () => {
    expect(Object.keys(types.efficacite).sort()).toEqual([
      'bug', 'dark', 'dragon', 'electric', 'fairy', 'fighting', 'fire', 'flying', 'ghost',
      'grass', 'ground', 'ice', 'normal', 'poison', 'psychic', 'rock', 'steel', 'water',
    ]);
    for (const cle of Object.keys(types.efficacite)) expect(nomType(cle)).toBeTruthy();
  });

  it.each([['grass', 'Plante'], ['electric', 'Électrik'], ['dark', 'Ténèbres']])(
    'traduit %s en %s',
    (cle, nom) => expect(nomType(cle)).toBe(nom),
  );

  it('signale clairement une clé inconnue en français', () => {
    expect(() => nomType('unknown')).toThrow('Type inconnu : unknown');
  });
});

describe('catalogue Pokémon', () => {
  it('charge les données et retrouve les Pokémon par numéro', () => {
    const catalogue = chargerPokemon();
    expect(catalogue.liste.length).toBeGreaterThanOrEqual(3);
    expect(catalogue.parNumero(1).nom).toBe('Bulbizarre');
    expect(catalogue.parNumero(25).types).toEqual(['electric']);
    expect(catalogue.parNumero(129).stats.attaque).toBe(10);
  });

  it('signale un numéro inconnu en français', () => {
    expect(() => chargerPokemon().parNumero(0)).toThrow('Pokémon inconnu : 0');
  });

  const bulbizarre = chargerPokemon().parNumero(1);
  it('rejette les numéros dupliqués ou décroissants', () => {
    for (const pokemon of [[bulbizarre, bulbizarre], [{ ...bulbizarre, numero: 2 }, bulbizarre]]) {
      expect(() => chargerPokemon({ version: 1, pokemon })).toThrow('uniques et croissants');
    }
  });

  it('rejette un nom vide', () => {
    expect(() => chargerPokemon({ version: 1, pokemon: [{ ...bulbizarre, nom: '  ' }] })).toThrow('Nom vide');
  });

  it.each([0, -1, 1.5, NaN])('rejette une stat non entière positive : %s', (pv) => {
    expect(() => chargerPokemon({
      version: 1, pokemon: [{ ...bulbizarre, stats: { ...bulbizarre.stats, pv } }],
    })).toThrow('Stats invalides');
  });
});
