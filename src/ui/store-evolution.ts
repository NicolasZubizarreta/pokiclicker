import { evolutionDisponible } from '../core/evolution';
import { chargerPokemon } from '../core/pokemon';
import { reglages } from '../core/reglages';
import { nomAffiche } from './affichage-pokemon';

type PokemonPossede = Parameters<typeof evolutionDisponible>[0];

export function annonceEvolution(equipe: PokemonPossede[], vues: string[]): { id: string; texte: string } | null {
  const pokemon = equipe.find(pokemon => evolutionDisponible(pokemon) !== null
    && !vues.includes(`evolution:${pokemon.uid}:${pokemon.numero}`));
  return pokemon ? { id: `evolution:${pokemon.uid}:${pokemon.numero}`, texte: `${nomAffiche(pokemon)} peut évoluer !` } : null;
}

export type EvolutionAffichee = { uid: string; ancien: number; nouveau: number };

export function afficherEvolution(evolution: EvolutionAffichee | null, finMs: number,
  tempsJeuMs: number): EvolutionAffichee | null {
  return tempsJeuMs < finMs ? evolution : null;
}

/** Clé d'un Pokémon prêt à évoluer : un « Plus tard » ne vaut que pour cette espèce. */
export const cleEvolution = (pokemon: { uid: string; numero: number }): string => `${pokemon.uid}:${pokemon.numero}`;

/** Premier Pokémon de l'équipe prêt à évoluer par niveau et pas encore refusé ; la file d'attente est l'équipe elle-même. */
export function prochaineEvolutionAuto(equipe: PokemonPossede[], refusees: ReadonlySet<string>): PokemonPossede | null {
  return equipe.find(pokemon => evolutionDisponible(pokemon) !== null && !refusees.has(cleEvolution(pokemon))) ?? null;
}

export type PhaseEvolution = 'proposition' | 'animation' | 'fin';
/** Fenêtre d'évolution : `pokemon` est le Pokémon avant l'évolution, `vers` l'espèce cible. */
export type ModalEvolution = {
  uid: string; phase: PhaseEvolution; pokemon: PokemonPossede; nom: string; vers: number; pierre: string | null;
  nomAncien: string; nomNouveau: string;
};

export function proposerModal(pokemon: PokemonPossede, vers: number, pierre: string | null = null): ModalEvolution {
  const catalogue = chargerPokemon();
  return { uid: pokemon.uid, phase: 'proposition', pokemon, nom: nomAffiche(pokemon), vers, pierre,
    nomAncien: catalogue.parNumero(pokemon.numero).nom, nomNouveau: catalogue.parNumero(vers).nom };
}

/** L'animation se termine seule à la fin exacte de sa durée. */
export function phaseModal(modal: ModalEvolution | null, finMs: number, tempsJeuMs: number): ModalEvolution | null {
  return modal && modal.phase === 'animation' && tempsJeuMs >= finMs ? { ...modal, phase: 'fin' } : modal;
}

export function texteModal(modele: string, valeurs: { nom?: string; ancien?: string; nouveau?: string }): string {
  return modele.replace('{nom}', valeurs.nom ?? '').replace('{ancien}', valeurs.ancien ?? '').replace('{nouveau}', valeurs.nouveau ?? '');
}
export const messagesEvolution = reglages.evolution.messages;
