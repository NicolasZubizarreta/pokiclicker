import { chargerPokemon } from '../core/pokemon';
import { pokedexDeKanto } from '../core/pokedex';
import type { Suivi } from '../core/suivi';
import { formaterDuree } from './duree';
import { formaterNombre } from './nombres';

const catalogue = chargerPokemon();

export function bilanJoueur({ suivi, tempsJeuMs, pokedex, especesShiny, badges }: {
  suivi: Suivi; tempsJeuMs: number; pokedex: readonly number[];
  especesShiny?: readonly number[]; badges: { obtenus: number; total: number };
}) {
  const { nombre, total } = pokedexDeKanto(pokedex, catalogue);
  return [
    { libelle: 'Temps de jeu', valeur: formaterDuree(tempsJeuMs) },
    { libelle: 'Pokémon dans le Pokédex', valeur: `${nombre} sur ${total}` },
    { libelle: 'Chromatiques', valeur: formaterNombre(especesShiny?.length ?? suivi.capturesShiny) },
    { libelle: 'Badges obtenus', valeur: `${badges.obtenus} sur ${badges.total}` },
  ];
}
