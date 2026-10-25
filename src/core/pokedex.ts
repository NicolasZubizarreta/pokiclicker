import type { Pokemon } from './pokemon';
import type { DonneesRegion } from './sauvegarde-types';

export function ajouterAuPokedex(pokedex: readonly number[], numero: number): readonly number[] {
  return pokedex.includes(numero) ? pokedex : [...pokedex, numero];
}

export function completerPokedex(pokedex: readonly number[], region: DonneesRegion): readonly number[] {
  let resultat = pokedex;
  for (const pokemon of [...region.equipe, ...region.pc, ...region.pension.parents]) {
    if (pokemon.oeuf === undefined && Number.isInteger(pokemon.numero)
      && pokemon.numero >= 1 && pokemon.numero <= 151) {
      resultat = ajouterAuPokedex(resultat, pokemon.numero);
    }
  }
  return resultat;
}

export function pokedexDeKanto(
  pokedex: readonly number[],
  catalogue: { readonly liste: readonly Pick<Pokemon, 'numero'>[] },
): { captures: Set<number>; nombre: number; total: number } {
  const numeros = new Set(catalogue.liste.map(pokemon => pokemon.numero));
  const captures = new Set(pokedex.filter(numero => numeros.has(numero)));
  return { captures, nombre: captures.size, total: numeros.size };
}
