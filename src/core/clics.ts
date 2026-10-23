import type { Horloge } from './clock';
import { reglages } from './reglages';

export function creerLimiteurClics(horloge: Horloge, config: Pick<typeof reglages.combat,
  'fenetreClicsMs' | 'clicsMaxParSeconde'> = reglages.combat) {
  const { fenetreClicsMs, clicsMaxParSeconde } = config;
  if (!Number.isFinite(fenetreClicsMs) || fenetreClicsMs <= 0
    || !Number.isInteger(clicsMaxParSeconde) || clicsMaxParSeconde <= 0) {
    throw new Error('Réglages du limiteur de clics invalides');
  }
  let clics: number[] = [];
  return {
    essayer(): boolean {
      const maintenant = horloge.maintenant();
      clics = clics.filter((instant) => maintenant - instant < fenetreClicsMs);
      if (clics.length >= clicsMaxParSeconde) return false;
      clics.push(maintenant);
      return true;
    },
  };
}
