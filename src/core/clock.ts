export type Horloge = { maintenant(): number };

export function creerHorlogeSysteme(): Horloge {
  return { maintenant: () => Date.now() };
}

export function creerHorlogeSimulee(debutMs = 0) {
  let tempsMs = debutMs;
  return {
    maintenant: () => tempsMs,
    avancer(ms: number) { tempsMs += ms; },
  };
}
