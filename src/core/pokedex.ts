import type { Pokemon } from './pokemon';
import type { DonneesRegion } from './sauvegarde-types';

export function ajouterAuxVus(vus: readonly number[], numero: number): readonly number[] {
  return ajouterAuPokedex(vus, numero);
}

export function completerVus(vus: readonly number[], pokedex: readonly number[]): readonly number[] {
  return pokedex.reduce<readonly number[]>((resultat, numero) => ajouterAuxVus(resultat, numero), vus);
}

export function etatPokedex(numero: number, captures: ReadonlySet<number>, vus: ReadonlySet<number>): 'capture' | 'vu' | 'inconnu' {
  return captures.has(numero) ? 'capture' : vus.has(numero) ? 'vu' : 'inconnu';
}

export function vusDeKanto(vus: readonly number[], catalogue: { readonly liste: readonly Pick<Pokemon, 'numero'>[] }): Set<number> {
  return pokedexDeKanto(vus, catalogue).captures;
}

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
