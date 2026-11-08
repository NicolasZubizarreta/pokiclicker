import types from '../../data/types.json';
import nomsTypes from '../../data/types-noms.json';
import { multiplicateurType } from './combat';
import { chargerPokemon } from './pokemon';

type Efficacite = Record<string, Record<string, number>>;

export type FicheType = {
  type: string;
  /** Types que ce type attaque avec un multiplicateur supérieur à 1 / entre 0 et 1 / égal à 0. */
  attaque: { fort: string[]; peu: string[]; nul: string[] };
  /** Types dont l'attaque, sur ce type, a un multiplicateur supérieur à 1 / entre 0 et 1 / égal à 0. */
  defense: { faible: string[]; resiste: string[]; immunise: string[] };
};

/** Les types portés par au moins un Pokémon du jeu, dans l'ordre de `types-noms.json`. */
export function typesDuJeu(presents: Iterable<string> = chargerPokemon().liste.flatMap(p => p.types)): string[] {
  const ensemble = new Set(presents);
  return Object.keys(nomsTypes).filter(type => ensemble.has(type));
}

/** Multiplicateur d'une attaque d'un type sur un type : la règle du combat, pas une copie. */
export function multiplicateurPaire(attaque: string, defense: string, efficacite: Efficacite = types.efficacite): number {
  return multiplicateurType([attaque], [defense], efficacite);
}

export function ficheType(type: string, liste: readonly string[] = typesDuJeu(), efficacite: Efficacite = types.efficacite): FicheType {
  const fiche: FicheType = { type, attaque: { fort: [], peu: [], nul: [] }, defense: { faible: [], resiste: [], immunise: [] } };
  for (const autre of liste) {
    const sortant = multiplicateurPaire(type, autre, efficacite);
    (sortant > 1 ? fiche.attaque.fort : sortant === 0 ? fiche.attaque.nul : sortant < 1 ? fiche.attaque.peu : []).push(autre);
    const entrant = multiplicateurPaire(autre, type, efficacite);
    (entrant > 1 ? fiche.defense.faible : entrant === 0 ? fiche.defense.immunise : entrant < 1 ? fiche.defense.resiste : []).push(autre);
  }
  return fiche;
}
