export type EvolutionAffichee = { uid: string; ancien: number; nouveau: number };

export function afficherEvolution(evolution: EvolutionAffichee | null, finMs: number,
  tempsJeuMs: number): EvolutionAffichee | null {
  return tempsJeuMs < finMs ? evolution : null;
}
