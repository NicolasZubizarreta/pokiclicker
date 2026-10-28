import { musiques } from '../core/musiques';
import { reglages } from '../core/reglages';

export type Canal = 'effets' | 'musique';
export type Volumes = Readonly<Record<Canal, number>>;

const cle = 'pokiclicker:volumes';
const defauts: Volumes = { effets: reglages.sons.volumeParDefaut, musique: musiques.volumeParDefaut };

function borner(valeur: unknown, defaut: number): number {
  return typeof valeur === 'number' && Number.isFinite(valeur) ? Math.min(100, Math.max(0, Math.round(valeur))) : defaut;
}

function lireVolumes(): Volumes {
  try {
    const brut = JSON.parse(localStorage.getItem(cle) ?? 'null') as Partial<Record<Canal, unknown>> | null;
    return { effets: borner(brut?.effets, defauts.effets), musique: borner(brut?.musique, defauts.musique) };
  } catch { return defauts; }
}

function ecrireVolumes(valeurs: Volumes) {
  try { localStorage.setItem(cle, JSON.stringify(valeurs)); } catch { /* Stockage refusé : le réglage ne dure que cette visite. */ }
}

/** Volume des effets et de la musique, de 0 à 100, gardé sur l'appareil (pas dans la sauvegarde de la partie). */
export function creerVolumes({ initial = lireVolumes(), enregistrer = ecrireVolumes }: {
  initial?: Volumes; enregistrer?: (valeurs: Volumes) => void;
} = {}) {
  let valeurs = initial;
  const abonnes = new Set<() => void>();
  return {
    instantane: (): Volumes => valeurs,
    lire: (canal: Canal) => valeurs[canal],
    abonner(abonne: () => void) { abonnes.add(abonne); return () => { abonnes.delete(abonne); }; },
    definir(canal: Canal, valeur: number) {
      const suivant = borner(valeur, valeurs[canal]);
      if (suivant === valeurs[canal]) return;
      valeurs = { ...valeurs, [canal]: suivant };
      enregistrer(valeurs);
      abonnes.forEach(abonne => abonne());
    },
  };
}

export const volumes = creerVolumes();
