export type EtatMannequin = {
  restantMs: number; totalMs: number; degatsEquipe: number; degatsClic: number; clics: number;
};

export function creerMannequin(dureeMs: number): EtatMannequin {
  return { restantMs: dureeMs, totalMs: dureeMs, degatsEquipe: 0, degatsClic: 0, clics: 0 };
}

export function avancerMannequin(etat: EtatMannequin, dtMs: number, dpsEquipe: number): EtatMannequin {
  const dt = Math.min(etat.restantMs, Math.max(0, dtMs));
  return { ...etat, restantMs: etat.restantMs - dt, degatsEquipe: etat.degatsEquipe + dpsEquipe * dt / 1000 };
}

export function frapperMannequin(etat: EtatMannequin, degatsClic: number): EtatMannequin {
  return etat.restantMs > 0
    ? { ...etat, degatsClic: etat.degatsClic + degatsClic, clics: etat.clics + 1 } : etat;
}

export function resultatMannequin(etat: EtatMannequin) {
  const secondes = (etat.totalMs - etat.restantMs) / 1000;
  const dpsEquipe = secondes > 0 ? etat.degatsEquipe / secondes : 0;
  const dpsClic = secondes > 0 ? etat.degatsClic / secondes : 0;
  return { dpsEquipe, dpsClic, dpsTotal: dpsEquipe + dpsClic,
    clicsParSeconde: secondes > 0 ? etat.clics / secondes : 0 };
}
