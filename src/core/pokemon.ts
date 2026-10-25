import donnees from '../../data/pokemon.json';
import nomsTypes from '../../data/types-noms.json';

export function nomType(cle: string): string {
  const nom = nomsTypes[cle as keyof typeof nomsTypes];
  if (!nom) throw new Error(`Type inconnu : ${cle}`);
  return nom;
}

export type StatsBase = {
  pv: number;
  attaque: number;
  defense: number;
  attaqueSpe: number;
  defenseSpe: number;
  vitesse: number;
};

export type Pokemon = {
  numero: number;
  nom: string;
  // Identifiants PokeAPI anglais en minuscules ; traduction à l'affichage ultérieurement.
  types: string[];
  stats: StatsBase;
  generation: number;
};

export type FichierPokemon = { version: number; pokemon: Pokemon[] };

export function chargerPokemon(fichier: FichierPokemon = donnees) {
  if (!Number.isInteger(fichier.version) || fichier.version <= 0 || !Array.isArray(fichier.pokemon)) {
    throw new Error('Fichier Pokémon invalide');
  }
  const index = new Map<number, Pokemon>();
  let precedent = 0;
  const clesStats: (keyof StatsBase)[] = ['pv', 'attaque', 'defense', 'attaqueSpe', 'defenseSpe', 'vitesse'];
  for (const pokemon of fichier.pokemon) {
    if (!Number.isInteger(pokemon.numero) || pokemon.numero <= precedent) {
      throw new Error('Les numéros des Pokémon doivent être uniques et croissants');
    }
    if (typeof pokemon.nom !== 'string' || !pokemon.nom.trim()) {
      throw new Error(`Nom vide pour le Pokémon n°${pokemon.numero}`);
    }
    if (clesStats.some((cle) => !Number.isInteger(pokemon.stats?.[cle]) || pokemon.stats[cle] <= 0)) {
      throw new Error(`Stats invalides pour le Pokémon n°${pokemon.numero}`);
    }
    index.set(pokemon.numero, pokemon);
    precedent = pokemon.numero;
  }
  return {
    liste: fichier.pokemon,
    parNumero(numero: number): Pokemon {
      const pokemon = index.get(numero);
      if (!pokemon) throw new Error(`Pokémon inconnu : ${numero}`);
      return pokemon;
    },
  };
}
