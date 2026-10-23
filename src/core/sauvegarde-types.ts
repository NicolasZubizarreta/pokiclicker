export const VERSION_ACTUELLE = 1;
export const ERREUR_VERSION = "Cette sauvegarde vient d'une version plus récente du jeu.";

export type Niveau = 'compte' | 'partie' | 'region';
export type Enveloppe<D> = {
  version: number; niveau: Niveau; id: string; revision: number; ecritLe: string; donnees: D;
};
export type PokemonPossede = {
  uid: string; numero: number; niveau: number; xp: number; shiny: boolean;
  bonheur: number; pierreEternelle: boolean; calcium: number; surnom?: string;
};
export type DonneesCompte = {
  diamants: number; succes: string[]; skins: string[];
  preferences: { sombre?: boolean; sonActive?: boolean };
};
export type DonneesPartie = {
  nom: string; regionCourante: string; regionsDebloquees: string[]; pokedexNational: number[];
  pcGlobal: PokemonPossede[]; drapeaux: string[];
  statistiques: { victoires: number; argentTotalGagne: number };
};
export type DonneesRegion = {
  regionId: string; zoneId: string; etape: number; equipe: PokemonPossede[];
  badges: string[]; bossVaincus: string[]; objetsCles: string[]; quetes: string[];
  drapeaux: string[]; evenementsJoues: string[]; argent: number;
  inventaire: Record<string, number>; ligueGagnee: number;
};
export interface Stockage {
  lire(cle: string): string | null;
  ecrire(cle: string, valeur: string): void;
  supprimer(cle: string): void;
  cles(): string[];
}
