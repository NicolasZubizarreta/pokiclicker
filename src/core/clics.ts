import type { Horloge } from './clock';
import { reglages } from './reglages';

export function clicsAutomatiques(resteMs: number, pasMs: number, intervalleMs: number) {
  const totalMs = resteMs + pasMs;
  return { clics: Math.floor(totalMs / intervalleMs), resteMs: totalMs % intervalleMs };
}

export function creerLimiteurClics(horloge: Horloge, config: Pick<typeof reglages.combat,
  'fenetreClicsMs' | 'clicsMaxParSeconde'> = reglages.combat) {
  const { fenetreClicsMs, clicsMaxParSeconde } = config;
  if (!Number.isFinite(fenetreClicsMs) || fenetreClicsMs <= 0
    || !Number.isInteger(clicsMaxParSeconde) || clicsMaxParSeconde <= 0) {
    throw new Error('Réglages du limiteur de clics invalides');
  }
  let clics: number[] = [];
  const compter = (maintenant: number): number => {
    clics = clics.filter((instant) => maintenant - instant < fenetreClicsMs);
    return clics.length;
  };
  return {
    cadence: () => compter(horloge.maintenant()),
    essayer(): boolean {
      const maintenant = horloge.maintenant();
      if (compter(maintenant) >= clicsMaxParSeconde) return false;
      clics.push(maintenant);
      return true;
    },
  };
}
