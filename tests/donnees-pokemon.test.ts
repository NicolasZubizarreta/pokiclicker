import { expect, it } from 'vitest';
import { chargerPokemon } from '../src/core/pokemon';
import { statsDeCombat } from '../src/core/stats';
import reference from './fixtures/v1-stats.json';
import surcharges from '../data/surcharges-stats.json';

it('conserve les puissances et PV de la V1 pour les 151 Pokémon de Kanto', () => {
  const catalogue = chargerPokemon();
  for (let numero = 1; numero <= 151; numero++) {
    expect(statsDeCombat(catalogue.parNumero(numero))).toEqual(reference[String(numero) as keyof typeof reference]);
  }
});

it('conserve les PV des 151 Pokémon dans les surcharges', () => {
  expect(surcharges).toHaveLength(151);
  for (let numero = 1; numero <= 151; numero++) {
    expect(surcharges[numero - 1]).toMatchObject({
      pokemon: numero, pv: reference[String(numero) as keyof typeof reference].pv,
    });
  }
  expect(surcharges.filter((surcharge) => 'puissance' in surcharge).map((surcharge) => surcharge.pokemon))
    .toEqual([49, 51, 83, 84, 101, 103, 117, 129]);
});
