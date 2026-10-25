import donnees from '../../data/sexes.json';
import { chargerPokemon } from './pokemon';
import type { PokemonPossede } from './sauvegarde-types';

type Sexe = PokemonPossede['sexe'];
const catalogue = chargerPokemon();
const sexesFixes = new Map<number, Sexe>();
if (donnees.version !== 1) throw new Error('Version des sexes invalide');
for (const [liste, sexe] of [
  [donnees.sansSexe, 'sansSexe'], [donnees.toujoursMale, 'male'], [donnees.toujoursFemelle, 'femelle'],
] as const) {
  if (!Array.isArray(liste)) throw new Error('Liste de sexes invalide');
  for (const numero of liste) {
    catalogue.parNumero(numero);
    if (sexesFixes.has(numero)) throw new Error(`Listes de sexes non disjointes : ${numero}`);
    sexesFixes.set(numero, sexe);
  }
}

export function sexeEspece(numero: number): Sexe | 'aleatoire' {
  catalogue.parNumero(numero);
  return sexesFixes.get(numero) ?? 'aleatoire';
}

export function tirerSexe(numero: number, alea: () => number): Sexe {
  const sexe = sexeEspece(numero);
  return sexe === 'aleatoire' ? (alea() < 0.5 ? 'male' : 'femelle') : sexe;
}
