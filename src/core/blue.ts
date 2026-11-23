import donnees from '../../data/blue-revanches.json';
import type { DonneesRegion } from './sauvegarde-types';

/**
 * Revanches de Blue (ticket F) : Chez Blue, le rival défie le joueur à chaque tranche de badges (2, 4, 6, 8).
 * Les combats, les dialogues et les récompenses sont des événements (`data/evenements/blue-revanches.json`) ;
 * ce module ne décide que du nombre de badges demandé et de ce qu'on affiche. Une revanche ne se joue qu'une fois.
 */
export type FichierBlue = typeof donnees;

export function chargerBlue(fichier: unknown): FichierBlue {
  const f = fichier as FichierBlue | null;
  const ok = !!f && f.version === 1 && Array.isArray(f.revanches) && f.revanches.length > 0
    && f.revanches.every((r, i) => typeof r.evenement === 'string' && r.evenement.length > 0 && Number.isInteger(r.badges) && r.badges > 0
      && (i === 0 || r.badges > f.revanches[i - 1]!.badges))
    && !!f.messages && ['pret', 'attente', 'termine'].every(cle => typeof f.messages[cle as keyof FichierBlue['messages']] === 'string');
  if (!ok) throw new Error('Revanches de Blue invalides.');
  return structuredClone(f);
}

const revanches = chargerBlue(donnees);
export const LIEU_BLUE = 'kanto.chez-blue';
export const REVANCHES_BLUE = revanches.revanches;

export type EtatBlue = {
  fait: number;
  total: number;
  /** Badges demandés pour la prochaine revanche, null quand toutes sont jouées. */
  badgesRequis: number | null;
  pret: boolean;
  message: string;
};

/** Où en est le joueur : la prochaine revanche est la première non jouée, dans l'ordre du fichier. */
export function etatBlue(region: Pick<DonneesRegion, 'badges' | 'evenementsJoues'>): EtatBlue {
  const fait = revanches.revanches.filter(r => region.evenementsJoues.includes(r.evenement)).length;
  const prochaine = revanches.revanches.find(r => !region.evenementsJoues.includes(r.evenement));
  if (!prochaine) return { fait, total: revanches.revanches.length, badgesRequis: null, pret: false, message: revanches.messages.termine };
  const pret = region.badges.length >= prochaine.badges;
  return { fait, total: revanches.revanches.length, badgesRequis: prochaine.badges, pret,
    message: pret ? revanches.messages.pret : revanches.messages.attente.replace('{badges}', String(prochaine.badges)) };
}
