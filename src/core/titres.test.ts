import { expect, it } from 'vitest';
import { chargerTitres, compteursDe, titresObtenus } from './titres';
import { suiviVide } from './suivi';
import { chargerPokemon } from './pokemon';
it('déduit les titres et utilise le total du catalogue', () => {
  const c = compteursDe({ suivi: suiviVide(), pokedexTotal: 0, tempsJeuMs: 0 });
  expect(titresObtenus(c).map(t => t.id)).toEqual(['dresseur']);
  expect(titresObtenus({ ...c, especes: chargerPokemon().liste.length }).some(t => t.id === 'pokedex-complet')).toBe(true);
  expect(() => chargerTitres({ version: 1, titres: [chargerTitres()[0], chargerTitres()[0]] })).toThrow();
});
