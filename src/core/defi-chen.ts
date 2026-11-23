import donnees from '../../data/defi-chen.json';
import type { Zone } from './monde';
import { kanto } from './regions';
import { reglages } from './reglages';
import { ajouterArgent } from './plafonds';
import type { DonneesRegion } from './sauvegarde-types';
import { lireSuivi, noterDefiChen } from './suivi';

export type FichierDefiChen = typeof donnees;

export function chargerDefiChen(fichier: unknown): FichierDefiChen {
  function verifier(ok: unknown, raison: string): asserts ok {
    if (!ok) throw new Error(`Défi de Chen invalide : ${raison}`);
  }
  verifier(fichier && typeof fichier === 'object', 'fichier attendu.');
  const defi = fichier as FichierDefiChen;
  verifier(defi.version === 1, 'version inconnue.');
  verifier(Number.isFinite(defi.multiplicateurPv) && defi.multiplicateurPv > 0, 'multiplicateur de PV attendu.');
  verifier(Array.isArray(defi.combats) && defi.combats.length === 6, '6 combats attendus.');
  defi.combats.forEach((combat, i) => {
    verifier(combat && combat.etape === i + 1 && Number.isInteger(combat.pokemon)
      && combat.pokemon > 0 && combat.pokemon <= 151 && combat.niveau === 100
      && combat.capture === 0 && combat.minuteurMs === reglages.combat.minuteurBossMs
      && typeof combat.nom === 'string' && combat.nom.length > 0, 'combat invalide.');
  });
  verifier(Array.isArray(defi.counter) && defi.counter.length === 4, '4 counters attendus.');
  const starters = new Set<number | null>([1, 4, 7, null]);
  defi.counter.forEach(counter => {
    verifier(counter && starters.delete(counter.starter) && Number.isInteger(counter.pokemon)
      && counter.pokemon > 0 && counter.pokemon <= 151
      && typeof counter.nom === 'string' && counter.nom.length > 0, 'counter invalide.');
  });
  verifier(defi.messages && typeof defi.messages.echec === 'string' && defi.messages.echec.length > 0,
    'message d’échec attendu.');
  verifier(defi.messages && Object.values(defi.messages).every(m => typeof m === 'string' && m.length > 0)
    && Object.keys(donnees.messages).every(cle => cle in defi.messages), 'messages du bilan et du rejeu attendus.');
  verifier(defi.rejeu && Number.isInteger(defi.rejeu.paliersMax) && defi.rejeu.paliersMax >= 1
    && Number.isInteger(defi.rejeu.pvParPalierPourCent) && defi.rejeu.pvParPalierPourCent > 0
    && Number.isInteger(defi.rejeu.recompenseArgentParPalier) && defi.rejeu.recompenseArgentParPalier >= 0, 'rejeu invalide.');
  verifier(defi.dialogues && ['fin', 'intro', 'victoire'].every(cle => {
    const lignes = defi.dialogues[cle as keyof FichierDefiChen['dialogues']];
    return Array.isArray(lignes) && lignes.length > 0
      && lignes.every(ligne => typeof ligne === 'string' && ligne.length > 0);
  }), 'dialogues invalides.');
  return structuredClone(defi);
}

const defi = chargerDefiChen(donnees);

export function peutLancer(region: Pick<DonneesRegion, 'ligueGagnee' | 'drapeaux'>,
  especes: number, finPokedexVue: boolean): boolean {
  return region.ligueGagnee >= 1 && finPokedexVue && especes >= 151
    && !region.drapeaux.includes('defi-chen-gagne');
}

/** PV du palier : 1 pour le premier défi, puis +`pvParPalierPourCent` % par défi déjà réussi (au plus `paliersMax` - 1 paliers de plus). */
export const facteurPvDefi = (victoires: number): number =>
  1 + defi.rejeu.pvParPalierPourCent * Math.min(Math.max(0, victoires), defi.rejeu.paliersMax - 1) / 100;

export function zoneDuDefi(starterId: number | null, victoires = 0): Zone {
  const labo = kanto.lieu('labo');
  const counter = defi.counter.find(c => c.starter === starterId) ?? defi.counter.find(c => c.starter === null)!;
  const combats = defi.combats.map(combat => ({ ...combat,
    ...(combat.etape === 5 ? { pokemon: counter.pokemon, nom: counter.nom } : {}) }));
  return { id: 'kanto.labo', nom: labo.nom, decor: labo.decor, ancienId: labo.ancienId,
    type: 'ligue', niveaux: [100, 100], etapes: combats.length, multiplicateurPv: defi.multiplicateurPv * facteurPvDefi(victoires),
    sauvages: [], adversaires: combats.slice(0, -1), boss: combats[combats.length - 1]!,
    liens: [{ vers: labo.depuis }] };
}

export function echec(region: DonneesRegion): { region: DonneesRegion; message: string | null } {
  if (!region.drapeaux.includes('defi-chen-actif') || region.drapeaux.includes('defi-chen-gagne')) {
    return { region, message: null };
  }
  return { region: { ...region, etape: 1, zoneId: kanto.lieu('labo').depuis }, message: defi.messages.echec };
}

export function victoire(region: DonneesRegion): DonneesRegion {
  if (region.zoneId !== 'kanto.labo' || region.etape !== defi.combats.length
    || !region.drapeaux.includes('defi-chen-actif') || region.drapeaux.includes('defi-chen-gagne')) return region;
  return { ...region, etape: 1,
    drapeaux: [...region.drapeaux.filter(drapeau => drapeau !== 'defi-chen-actif'), 'defi-chen-gagne'] };
}

export const PALIERS_MAX_DEFI = defi.rejeu.paliersMax;
export const victoiresDefi = (region: Pick<DonneesRegion, 'suivi'>): number => lireSuivi(region).records.defiChenVictoires;
/** Palier du défi en cours ou du prochain défi : 1 la première fois, puis un de plus par réussite (plafonné). */
export const palierDefi = (region: Pick<DonneesRegion, 'suivi'>): number => Math.min(PALIERS_MAX_DEFI, victoiresDefi(region) + 1);

/** Le défi est déjà réussi et peut être relancé tant que le dernier palier n'est pas atteint (le rejeu continue après, sans gain). */
export const peutRejouer = (region: Pick<DonneesRegion, 'drapeaux'>): boolean =>
  region.drapeaux.includes('defi-chen-gagne') && !region.drapeaux.includes('defi-chen-actif');

/** Relance le défi : il redevient actif, sans refaire l'introduction. Une partie qui l'avait réussi avant le compteur compte alors pour une réussite. */
export function rejouer(region: DonneesRegion): DonneesRegion {
  if (!peutRejouer(region)) return region;
  const suivi = victoiresDefi(region) === 0 ? noterDefiChen(lireSuivi(region)) : lireSuivi(region);
  return { ...region, suivi, drapeaux: [...region.drapeaux.filter(d => d !== 'defi-chen-gagne'), 'defi-chen-actif'] };
}

/** Compte une réussite du défi (après `victoire`) : suivi, et récompense en argent la première fois qu'un palier est réussi (à partir du 2e). */
export function compterVictoireDefi(region: DonneesRegion): { region: DonneesRegion; message: string } {
  const palier = palierDefi(region);
  const argent = palier >= 2 && victoiresDefi(region) < palier ? defi.rejeu.recompenseArgentParPalier * (palier - 1) : 0;
  const suivante: DonneesRegion = { ...region, suivi: noterDefiChen(lireSuivi(region)),
    ...(argent > 0 ? { argent: ajouterArgent(region.argent, argent),
      statistiques: { ...region.statistiques, argentTotalGagne: region.statistiques.argentTotalGagne + argent } } : {}) };
  const modele = argent > 0 ? defi.messages.defiRecompense : defi.messages.defiVictoire;
  return { region: suivante, message: modele.replace('{palier}', String(palier)).replace('{argent}', argent.toLocaleString('fr-FR')) };
}

/** Ce que dit Chen dans le labo sur le défi (jamais commencé, rejouable, ou maîtrisé). */
export function messageDefi(region: Pick<DonneesRegion, 'drapeaux' | 'suivi'>): string {
  if (!region.drapeaux.includes('defi-chen-gagne') && !region.drapeaux.includes('defi-chen-actif')) return defi.messages.defiJamais;
  const palier = palierDefi(region);
  if (victoiresDefi(region) >= PALIERS_MAX_DEFI) return defi.messages.defiMaitrise.replace('{max}', String(PALIERS_MAX_DEFI));
  return defi.messages.defiRejouable.replace('{palier}', String(palier)).replace('{max}', String(PALIERS_MAX_DEFI))
    .replace('{pv}', String(Math.round((facteurPvDefi(victoiresDefi(region)) - 1) * 100)));
}

export const messagesDuDefi = defi.messages;
