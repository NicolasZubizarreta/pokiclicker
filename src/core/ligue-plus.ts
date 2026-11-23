import donnees from '../../data/ligue-plus.json';
import type { Zone } from './monde';
import { ajouterArgent } from './plafonds';
import type { DonneesRegion } from './sauvegarde-types';
import { lireSuivi, noterLiguePlus } from './suivi';
import { sansCle } from './sans-cle';

/**
 * Ligue+ (ticket F) : une fois la Ligue gagnée, on peut la rejouer à un rang de 1 à `rangMax`. Chaque rang ajoute `pvParRangPourCent` %
 * de PV aux adversaires (les niveaux sont déjà à 100 au sommet, la difficulté passe par les PV, comme le Défi de Chen).
 * La première réussite d'un rang rapporte `recompenseArgentParRang` × rang en Pokédollars ; rejouer un rang déjà réussi ne rapporte rien.
 * Une victoire Ligue+ ne passe pas par le Panthéon et ne compte pas dans les victoires de la Ligue (Hall, Défi de Chen).
 * Toutes les valeurs viennent de `data/ligue-plus.json`.
 */
export type FichierLiguePlus = typeof donnees;

export function chargerLiguePlus(fichier: unknown): FichierLiguePlus {
  const f = fichier as FichierLiguePlus | null;
  const ok = !!f && f.version === 1 && Number.isInteger(f.rangMax) && f.rangMax >= 1 && Number.isInteger(f.pvParRangPourCent) && f.pvParRangPourCent > 0
    && Number.isInteger(f.recompenseArgentParRang) && f.recompenseArgentParRang >= 0
    && !!f.messages && ['victoire', 'recompense', 'record'].every(cle => typeof f.messages[cle as keyof FichierLiguePlus['messages']] === 'string');
  if (!ok) throw new Error('Ligue+ invalide.');
  return structuredClone(f);
}

const regles = chargerLiguePlus(donnees);
export const RANG_MAX_LIGUE_PLUS = regles.rangMax;
export const PV_PAR_RANG_POURCENT = regles.pvParRangPourCent;

/** Rang actif (0 = Ligue normale). Sans victoire à la Ligue, toujours 0. */
export const rangActif = (region: Pick<DonneesRegion, 'ligueGagnee' | 'liguePlus'>): number =>
  region.ligueGagnee >= 1 ? Math.min(regles.rangMax, Math.max(0, Math.floor(region.liguePlus ?? 0))) : 0;

/** Meilleur rang réussi. */
export const meilleurRang = (region: Pick<DonneesRegion, 'suivi'>): number => lireSuivi(region).records.liguePlusMax;

/** Plus haut rang proposé : le suivant du meilleur rang réussi (1 au départ), dans la limite de `rangMax`. */
export const rangSuivantPossible = (region: Pick<DonneesRegion, 'suivi'>): number => Math.min(regles.rangMax, meilleurRang(region) + 1);

/** Multiplicateur de PV d'un rang (1 pour la Ligue normale). */
export const facteurPvLiguePlus = (rang: number): number => 1 + regles.pvParRangPourCent * Math.max(0, rang) / 100;

/** La zone de la Ligue avec les PV du rang donné ; rang 0 : zone inchangée. */
export function zoneLiguePlus(zone: Zone, rang: number): Zone {
  return rang > 0 ? { ...zone, multiplicateurPv: zone.multiplicateurPv * facteurPvLiguePlus(rang) } : zone;
}

export const recompenseRang = (rang: number): number => regles.recompenseArgentParRang * rang;

export type ResultatRang = { ok: true; region: DonneesRegion } | { ok: false; raison: string };

/** Choisit le rang de la prochaine traversée de la Ligue (0 = Ligue normale). */
export function choisirRang(region: DonneesRegion, rang: number): ResultatRang {
  if (!Number.isInteger(rang) || rang < 0) return { ok: false, raison: 'Rang invalide.' };
  if (region.ligueGagnee < 1) return { ok: false, raison: 'Gagne d’abord la Ligue.' };
  if (rang > rangSuivantPossible(region)) return { ok: false, raison: 'Réussis d’abord le rang précédent.' };
  if (rang === 0) return { ok: true, region: sansCle(region, 'liguePlus') as DonneesRegion };
  return { ok: true, region: { ...region, liguePlus: rang } };
}

/** Victoire à la Ligue pendant un rang actif : record, récompense du premier succès. */
export function victoireLiguePlus(region: DonneesRegion): { region: DonneesRegion; message: string } {
  const rang = rangActif(region);
  if (rang < 1) return { region, message: '' };
  const record = rang > meilleurRang(region);
  const argent = record ? recompenseRang(rang) : 0;
  const suivante: DonneesRegion = { ...region, suivi: noterLiguePlus(lireSuivi(region), rang),
    ...(argent > 0 ? { argent: ajouterArgent(region.argent, argent),
      statistiques: { ...region.statistiques, argentTotalGagne: region.statistiques.argentTotalGagne + argent } } : {}) };
  const modele = argent > 0 ? regles.messages.recompense : regles.messages.victoire;
  const message = modele.replace('{rang}', String(rang)).replace('{argent}', argent.toLocaleString('fr-FR'));
  return { region: suivante, message: record ? `${message} ${regles.messages.record.replace('{rang}', String(rang))}` : message };
}
