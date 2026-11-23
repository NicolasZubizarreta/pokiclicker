import { reglages } from './reglages';

/** Chaîne de rencontres : nombre de Pokémon sauvages de la même espèce vaincus ou capturés à la suite. */
export type Chaine = { numero: number; longueur: number };
export const PREFIXE_CHAINE = 'chaine:';

export function avancerChaine(chaine: Chaine | undefined, ennemi: { numero: number; shiny: boolean; boss: boolean }): Chaine {
  const actuelle = chaine ?? { numero: 0, longueur: 0 };
  // Un boss ne compte pas et ne casse rien ; un chromatique clôt la chaîne (comme dans les jeux).
  if (ennemi.boss) return actuelle;
  if (ennemi.shiny) return { numero: 0, longueur: 0 };
  return ennemi.numero === actuelle.numero ? { numero: actuelle.numero, longueur: actuelle.longueur + 1 } : { numero: ennemi.numero, longueur: 1 };
}

/** Multiplicateur de la chance chromatique pour la longueur donnée : le plus haut palier atteint, 1 sinon. */
export function multiplicateurChaine(longueur: number, paliers: readonly { longueur: number; x: number }[] = reglages.combat.chaines): number {
  return paliers.filter(p => longueur >= p.longueur).reduce((x, p) => Math.max(x, p.x), 1);
}

export const cleChaine = (chaine: Chaine | undefined): string[] =>
  chaine && chaine.longueur > 0 ? [`${PREFIXE_CHAINE}${chaine.numero}:${chaine.longueur}`] : [];

export function chaineDesActifs(actifs: readonly string[]): Chaine | null {
  const cle = actifs.find(a => a.startsWith(PREFIXE_CHAINE));
  const [numero, longueur] = cle ? cle.slice(PREFIXE_CHAINE.length).split(':').map(Number) : [];
  return numero !== undefined && longueur !== undefined && Number.isInteger(numero) && Number.isInteger(longueur) ? { numero, longueur } : null;
}
