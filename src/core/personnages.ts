import donnees from '../../data/personnages.json';

export type SpritePersonnage = { type: 'image'; src: string } | { type: 'silhouette' };

const personnages: Record<string, { dossier: string; poses: string[] }> = donnees.personnages;

/**
 * Sprite à montrer pour une réplique : aucune pose demandée = aucun sprite ; pose fournie par un fichier
 * (`poses` dans data/personnages.json) = l'image ; sinon, pour un personnage connu, une silhouette de remplacement
 * jusqu'à ce que l'image soit ajoutée au dépôt.
 */
export function spriteDe(locuteur: string, pose: string | undefined): SpritePersonnage | null {
  if (!pose) return null;
  const personnage = personnages[locuteur];
  if (personnage?.poses.includes(pose)) return { type: 'image', src: `img/sprites/${personnage.dossier}/${pose}.png` };
  return personnage ? { type: 'silhouette' } : { type: 'image', src: `img/sprites/chen/${pose}.png` };
}
