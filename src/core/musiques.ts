import donnees from '../../data/musiques.json';

export type Scene = 'combat' | 'adversaire' | 'boss' | 'hors-combat' | 'pantheon' | 'intro';
export type Piste = {
  fichier: string; boucle: boolean; titre: string; auteur: string; licence: string;
};

const scenes: Scene[] = ['combat', 'adversaire', 'boss', 'hors-combat', 'pantheon', 'intro'];
const catalogue = donnees as {
  actifParDefaut: boolean; volumeDb: number;
  /** Curseur « Musique » d'une partie neuve, de 0 à 100. */
  volumeParDefaut: number;
  pistes: Record<string, Piste>; scenes: Record<Scene, string | null>;
};

if (typeof catalogue.actifParDefaut !== 'boolean' || !Number.isFinite(catalogue.volumeDb) || catalogue.volumeDb > 0
  || !Number.isFinite(catalogue.volumeParDefaut) || catalogue.volumeParDefaut < 0 || catalogue.volumeParDefaut > 100
  || scenes.some(scene => !(scene in catalogue.scenes))
  || Object.values(catalogue.scenes).some(id => id !== null && !(id in catalogue.pistes))
  || Object.values(catalogue.pistes).some(piste => !piste.fichier || !piste.titre || !piste.auteur
    || !piste.licence || typeof piste.boucle !== 'boolean')) {
  throw new Error('Données de musiques invalides');
}

export const musiques = catalogue;

export function creditPiste(piste: Piste): string {
  return `${piste.titre} (${piste.auteur}, ${piste.licence})`;
}

/** Piste jouée dans une scène (`null` : silence). */
export function pisteDeScene(scene: Scene): string | null {
  return catalogue.scenes[scene];
}

/** Scène musicale d'après ce que le joueur a à l'écran. Le Panthéon passe avant tout, l'intro coupe la musique. */
export function sceneMusicale(etat: {
  pantheon: boolean; intro: boolean; horsCombat: boolean; boss: boolean; adversaire: boolean;
}): Scene {
  if (etat.pantheon) return 'pantheon';
  if (etat.intro) return 'intro';
  if (etat.horsCombat) return 'hors-combat';
  return etat.adversaire ? 'adversaire' : etat.boss ? 'boss' : 'combat';
}
