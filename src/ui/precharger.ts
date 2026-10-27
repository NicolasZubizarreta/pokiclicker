import type { Zone } from '../core/monde';

export const cheminSprite = (numero: number, shiny = false): string => `img/sprites/${shiny ? 'pokemon-shiny' : 'pokemon'}/${numero}.png`;
export const cheminDecor = (zone: Pick<Zone, 'decor'>): string => `img/decors/${zone.decor.split('/').at(-1)}`;

export function spritesPossibles(zone: Zone): string[] {
  return [...new Set([...zone.sauvages, ...(zone.adversaires ?? []), zone.boss].map(({ pokemon }) => cheminSprite(pokemon)))].sort();
}

export type ImagePrechargeable = {
  src: string;
  onload: ((evenement: Event) => void) | null;
  onerror: ((evenement: Event) => void) | null;
};
export type FabriqueImage = () => ImagePrechargeable;
const demandes = new Map<string, Promise<boolean>>();

export async function precharger(chemins: readonly string[], creerImage: FabriqueImage = () => new window.Image()) {
  const resultats = await Promise.all([...new Set(chemins)].map((chemin) => {
    let demande = demandes.get(chemin);
    if (!demande) {
      let terminer!: (charge: boolean) => void;
      demande = new Promise<boolean>((resoudre) => { terminer = resoudre; });
      demandes.set(chemin, demande);
      try {
        const image = creerImage();
        const finir = (charge: boolean) => {
          image.onload = null;
          image.onerror = null;
          terminer(charge);
        };
        image.onload = () => finir(true);
        image.onerror = () => finir(false);
        image.src = chemin;
      } catch {
        terminer(false);
      }
    }
    return demande;
  }));
  return { charges: resultats.filter(Boolean).length, echecs: resultats.filter((charge) => !charge).length };
}

// À appeler à l'entrée de la zone : l'ennemi suivant est tiré à son apparition.
// Tous les sprites possibles, boss compris, sont ainsi en cache au dernier PV du courant.
export function prechargerZone(zone: Zone, creerImage?: FabriqueImage) {
  return precharger(spritesPossibles(zone), creerImage);
}
