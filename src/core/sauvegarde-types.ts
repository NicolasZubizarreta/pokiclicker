export const VERSION_ACTUELLE = 4;
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
  /** Marque d'éclosion : posée à la naissance d'un œuf (jamais par capture ni achat), +5 % de dégâts propres. Absent = pas de marque. */
  marqueEclosion?: boolean;
};
export type ReglagesArret = {
  actif: boolean; commun: boolean; peuCommun: boolean; rare: boolean; tresRare: boolean;
  legendaire: boolean; shiny: boolean; nouveau: boolean;
};
export type PreferencesCombat = { autoAttaque: boolean; autoClicLie: boolean; arretAuto: ReglagesArret };
export type DonneesCompte = {
  diamants: number; succes: string[]; skins: string[];
  preferences: { sombre?: boolean; sonActive?: boolean } & Partial<PreferencesCombat>;
};
export type DonneesPartie = {
  nom: string; regionCourante: string; regionsDebloquees: string[]; pokedexNational: number[];
  vus: number[];
  pcGlobal: PokemonPossede[]; drapeaux: string[];
  statistiques: { victoires: number; argentTotalGagne: number; tempsJeuMs?: number };
};
/** Main de blackjack d'avant le sabot de 6 paquets (un paquet de 52 par main, sans carte cachée). Lue puis convertie à la première action. */
export type MainBlackjackAncienne = { mise: number; paquet: string[]; joueur: string[]; croupier: string[] };
export type StatutMainBlackjack = 'en-cours' | 'reste' | 'depasse' | 'abandon';
export type MainJoueurBlackjack = {
  cartes: string[];
  /** Jetons engagés sur cette main (doublés si elle est doublée). */
  mise: number;
  separee: boolean;
  doublee: boolean;
  statut: StatutMainBlackjack;
};
/** Main en cours : le sabot vit à part (sabotBlackjack de la région). La carte cachée du croupier est croupier[1]. */
export type MainBlackjack = {
  /** « assurance » : le croupier montre un As, le joueur doit accepter ou refuser l'assurance avant tout autre choix. */
  phase: 'assurance' | 'jeu';
  mains: MainJoueurBlackjack[];
  active: number;
  croupier: string[];
  /** Jetons misés en assurance (0 si refusée ou pas encore proposée). */
  assurance: number;
};
export type DonneesRegion = {
  regionId: string; zoneId: string; etape: number; equipe: PokemonPossede[];
  badges: string[]; bossVaincus: string[]; objetsCles: string[]; quetes: string[];
  drapeaux: string[]; evenementsJoues: string[]; argent: number;
  evenementEnCours?: { id: string; etape: number; file: string[] };
  diplomeLe?: string;
  /** Annonces de déblocage déjà affichées (`data/deblocages.json`). Absent dans une sauvegarde ancienne : alors tout ce qui est ouvert au chargement compte comme vu. */
  annoncesVues?: string[];
  /** Le joueur est déjà entré au casino : le cadeau de la première entrée est donné et la pastille est retirée. Absent = jamais entré. */
  casinoVu?: boolean;
  inventaire: Record<string, number>; ligueGagnee: number;
  pc: PokemonPossede[]; ameliorations: string[]; jalonsRecus: number[]; starterId: number | null;
  statistiques: { eliminations: number; argentTotalGagne: number };
  chronos: {
    finRepousse: number; finSuperRepousse: number; finBoostAttaque: number;
    finBoostAttaqueSpeciale: number; rechargeFauchage: number;
  };
  pension: { parents: PokemonPossede[]; oeufs: PokemonPossede[]; emplacementsOeuf: number };
  jetons: number;
  blackjackEnCours?: MainBlackjack | MainBlackjackAncienne;
  /** Sabot de blackjack (cartes restantes, la prochaine en premier), conservé entre les mains. */
  sabotBlackjack?: string[];
  /** « Plus ou moins » : rang (1 = as … 13 = roi) de la carte visible, gardé pour qu'un rechargement la retrouve. Aucune mise n'est engagée. */
  plusOuMoinsCarte?: number;
  /** Numéros des espèces (forme de base) déjà écloses d'un œuf, chacune une seule fois. Absent = aucune connue. */
  especesEcloses?: number[];
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
