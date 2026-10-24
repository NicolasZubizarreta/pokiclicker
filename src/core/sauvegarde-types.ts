export const VERSION_ACTUELLE = 2;
export const ERREUR_VERSION = "Cette sauvegarde vient d'une version plus récente du jeu.";

export type Niveau = 'compte' | 'partie' | 'region';
export type Enveloppe<D> = {
  version: number; niveau: Niveau; id: string; revision: number; ecritLe: string; donnees: D;
};
export type PokemonPossede = {
  uid: string; numero: number; niveau: number; xp: number; shiny: boolean;
  bonheur: number; pierreEternelle: boolean; calcium: number; surnom?: string;
  sexe: 'male' | 'femelle' | 'sansSexe'; favori: boolean;
  oeuf?: { pasRestants: number; pasMax: number };
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
  pc: PokemonPossede[]; ameliorations: string[]; jalonsRecus: number[]; starterId: number | null;
  statistiques: { eliminations: number; argentTotalGagne: number };
  chronos: {
    finRepousse: number; finSuperRepousse: number; finBoostAttaque: number;
    finBoostAttaqueSpeciale: number; rechargeFauchage: number;
  };
  pension: { parents: PokemonPossede[]; oeufs: PokemonPossede[]; emplacementsOeuf: number };
  jetons: number;
  arretAuto: {
    commun: boolean; peuCommun: boolean; rare: boolean; tresRare: boolean;
    legendaire: boolean; shiny: boolean; nouveau: boolean;
  };
};
export type NouveauxChampsRegion = Pick<DonneesRegion, 'pc' | 'ameliorations' | 'jalonsRecus'
  | 'starterId' | 'statistiques' | 'chronos' | 'pension' | 'jetons' | 'arretAuto'>;
export interface Stockage {
  lire(cle: string): string | null;
  ecrire(cle: string, valeur: string): void;
  supprimer(cle: string): void;
  cles(): string[];
}
