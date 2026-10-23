import { describe, expect, it } from 'vitest';
import { construireEntree } from '../scripts/lib/pokeapi.mjs';
import bulbizarre from './fixtures/pokeapi/bulbizarre.json';
import magicarpe from './fixtures/pokeapi/magicarpe.json';

describe('conversion PokeAPI sans réseau', () => {
  it('construit Bulbizarre et trie ses types par emplacement', () => {
    expect(construireEntree(bulbizarre.pokemon, bulbizarre.espece)).toEqual({
      numero: 1, nom: 'Bulbizarre', types: ['grass', 'poison'], generation: 1,
      stats: { pv: 45, attaque: 49, defense: 49, attaqueSpe: 65, defenseSpe: 65, vitesse: 45 },
    });
  });

  it('construit Magicarpe avec son nom français', () => {
    expect(construireEntree(magicarpe.pokemon, magicarpe.espece)).toEqual({
      numero: 129, nom: 'Magicarpe', types: ['water'], generation: 1,
      stats: { pv: 20, attaque: 10, defense: 55, attaqueSpe: 15, defenseSpe: 20, vitesse: 80 },
    });
  });

  it('refuse un nom français absent ou vide', () => {
    for (const names of [[], [{ name: ' ', language: { name: 'fr' } }]]) {
      expect(() => construireEntree(magicarpe.pokemon, { ...magicarpe.espece, names }))
        .toThrow('Pas de nom français pour le Pokémon n°129');
    }
  });

  it.each(['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix'])('convertit la génération %s', (romain) => {
    const rang = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix'].indexOf(romain) + 1;
    expect(construireEntree(bulbizarre.pokemon, {
      ...bulbizarre.espece, generation: { name: `generation-${romain}` },
    }).generation).toBe(rang);
  });

  it('rejette les réponses invalides en nommant le numéro', () => {
    for (const pokemon of [
      { ...magicarpe.pokemon, stats: [] },
      { ...magicarpe.pokemon, types: [] },
      { ...magicarpe.pokemon, stats: magicarpe.pokemon.stats.map((stat) => ({ ...stat, base_stat: 0 })) },
    ]) {
      expect(() => construireEntree(pokemon, magicarpe.espece)).toThrow('Réponse invalide pour le Pokémon n°129');
    }
    expect(() => construireEntree(magicarpe.pokemon, { ...magicarpe.espece, id: 1 }))
      .toThrow('Réponse invalide pour le Pokémon n°129');
  });

  it('ne modifie pas les réponses et produit des octets identiques', () => {
    const avant = JSON.stringify(bulbizarre);
    const premier = JSON.stringify(construireEntree(bulbizarre.pokemon, bulbizarre.espece));
    const second = JSON.stringify(construireEntree(bulbizarre.pokemon, bulbizarre.espece));
    expect(premier).toBe(second);
    expect(JSON.stringify(bulbizarre)).toBe(avant);
  });
});
