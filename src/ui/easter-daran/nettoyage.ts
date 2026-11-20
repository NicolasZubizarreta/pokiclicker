import type { DonneesRegion, PokemonPossede } from '../../core/sauvegarde-types';
import { reglages } from '../../core/reglages';

export const DRAPEAU_DARAN = 'daran-anniversaire-22';
/** Valeur de remise à niveau : l’âge de Daran. */
export const VALEUR_ANNIVERSAIRE = 22;
export type ResumeNettoyage = {
  argent: number;
  jetons: number;
  objetsRamenes: number;
  pokemonNiveauRamene: number;
  pokemonCalciumRamene: number;
  pokemonBonheurRamene: number;
};

/** Nettoie une seule fois la région, sans modifier l’entrée ni les possessions conservées. */
export function nettoyerRegionDaran(region: DonneesRegion): { region: DonneesRegion; resume: ResumeNettoyage } | null {
  if (region.drapeaux.includes(DRAPEAU_DARAN)) return null;

  const resume: ResumeNettoyage = {
    argent: region.argent, jetons: region.jetons,
    objetsRamenes: Object.keys(region.inventaire).length,
    pokemonNiveauRamene: 0, pokemonCalciumRamene: 0, pokemonBonheurRamene: 0,
  };
  function nettoyerPokemon(pokemon: PokemonPossede): PokemonPossede {
    const niveau = Math.min(pokemon.niveau, reglages.recompenses.niveauMax);
    const calcium = Math.min(pokemon.calcium, reglages.degats.calciumMax);
    const bonheur = Math.min(pokemon.bonheur, reglages.recompenses.bonheur.max);
    const niveauBaisse = niveau < pokemon.niveau;
    if (niveauBaisse) resume.pokemonNiveauRamene++;
    if (calcium < pokemon.calcium) resume.pokemonCalciumRamene++;
    if (bonheur < pokemon.bonheur) resume.pokemonBonheurRamene++;
    if (!niveauBaisse && calcium === pokemon.calcium && bonheur === pokemon.bonheur) return pokemon;
    return { ...pokemon, niveau, calcium, bonheur, xp: niveauBaisse ? 0 : pokemon.xp };
  }

  return {
    region: {
      ...region, argent: VALEUR_ANNIVERSAIRE, jetons: VALEUR_ANNIVERSAIRE,
      inventaire: Object.fromEntries(Object.keys(region.inventaire).map(cle => [cle, VALEUR_ANNIVERSAIRE])),
      equipe: region.equipe.map(nettoyerPokemon),
      pc: region.pc.map(nettoyerPokemon),
      pension: { ...region.pension,
        parents: region.pension.parents.map(nettoyerPokemon),
        oeufs: region.pension.oeufs.map(nettoyerPokemon) },
      drapeaux: [...region.drapeaux, DRAPEAU_DARAN],
    },
    resume,
  };
}
