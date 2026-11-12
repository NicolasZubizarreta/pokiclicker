import donnees from '../../data/succes.json';
import type { DonneesCompte, DonneesRegion } from './sauvegarde-types';

export const MESURES_SUCCES = ['pokedex', 'badges', 'eliminations', 'eclosions'] as const;
export type MesureSucces = typeof MESURES_SUCCES[number];
export type Mesures = Record<MesureSucces, number>;
export type DefinitionSucces = {
  id: string; nom: string; description: string; diamants: number; mesure: MesureSucces; seuil: number;
};

export function validerSucces(liste: unknown): DefinitionSucces[] {
  if (!Array.isArray(liste)) throw new Error('Liste des succès invalide');
  const ids = new Set<string>();
  return liste.map((entree: unknown) => {
    if (!entree || typeof entree !== 'object') throw new Error('Définition de succès invalide');
    const { id, nom, description, diamants, mesure, seuil } = entree as Record<string, unknown>;
    if (typeof id !== 'string' || !id.trim() || id.includes(':') || ids.has(id)) {
      throw new Error(`Identifiant de succès invalide : ${id}`);
    }
    ids.add(id);
    if (typeof nom !== 'string' || !nom.trim() || typeof description !== 'string' || !description.trim()) {
      throw new Error(`Texte de succès manquant : ${id}`);
    }
    if (typeof diamants !== 'number' || !Number.isInteger(diamants) || diamants < 0) {
      throw new Error(`Diamants du succès invalides : ${id}`);
    }
    if (typeof seuil !== 'number' || !Number.isInteger(seuil) || seuil < 1) {
      throw new Error(`Seuil du succès invalide : ${id}`);
    }
    if (!MESURES_SUCCES.includes(mesure as MesureSucces)) {
      throw new Error(`Mesure du succès inconnue : ${id}`);
    }
    return { id, nom, description, diamants, mesure, seuil };
  });
}

export function chargerSucces(): DefinitionSucces[] {
  return validerSucces(donnees.succes);
}

export const registreSucces = chargerSucces();

export function succesAccordes(registre: readonly DefinitionSucces[], compte: DonneesCompte,
  mesures: Mesures): { compte: DonneesCompte; nouveaux: DefinitionSucces[] } {
  const obtenus = new Set(compte.succes);
  const nouveaux = registre.filter(succes => {
    if (obtenus.has(succes.id) || !(mesures[succes.mesure] >= succes.seuil)) return false;
    obtenus.add(succes.id);
    return true;
  });
  if (!nouveaux.length) return { compte, nouveaux };
  return {
    compte: { ...compte, succes: [...compte.succes, ...nouveaux.map(succes => succes.id)],
      diamants: compte.diamants + nouveaux.reduce((total, succes) => total + succes.diamants, 0) },
    nouveaux,
  };
}

export function mesuresDe(region: DonneesRegion, pokedex: readonly number[]): Mesures {
  return {
    pokedex: pokedex.length, badges: region.badges.length, eliminations: region.statistiques.eliminations,
    eclosions: region.especesEcloses?.length ?? 0,
  };
}

export type PalierSucces = DefinitionSucces & { atteint: boolean; obtenu: boolean };

/** État des paliers d'une mesure (ex. `eclosions`) : `atteint` selon la mesure, `obtenu` selon les succès déjà crédités au compte. */
export function paliersDeMesure(registre: readonly DefinitionSucces[], mesure: MesureSucces,
  mesures: Mesures, compte: Pick<DonneesCompte, 'succes'>): PalierSucces[] {
  return registre.filter(succes => succes.mesure === mesure).sort((a, b) => a.seuil - b.seuil)
    .map(succes => ({ ...succes, atteint: mesures[mesure] >= succes.seuil, obtenu: compte.succes.includes(succes.id) }));
}
