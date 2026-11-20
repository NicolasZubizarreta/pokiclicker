import type { DonneesRegion } from '../../core/sauvegarde';
import { CLE_PROPRIETAIRE } from '../compte/session-compte';
import { storeJeu } from '../store';
import { estCompteDaran, estSurnomDaran } from './compte-daran';
import { ouvrirModalDaran } from './etat-modal';
import { nettoyerRegionDaran, type ResumeNettoyage } from './nettoyage';

export function declencherAnniversaire(surnom: string, deps: {
  lireIdentifiant(): string | null;
  autorise?: string;
  appliquerRegion(f: (r: DonneesRegion) => DonneesRegion): void;
  ouvrir(r: ResumeNettoyage): void;
}): void {
  if (!estSurnomDaran(surnom)) return;
  let identifiant: string | null = null;
  try { identifiant = deps.lireIdentifiant(); } catch { /* Échec sûr si le stockage est inaccessible. */ }
  if (!estCompteDaran(identifiant, deps.autorise)) return;
  let resume: ResumeNettoyage | null = null;
  deps.appliquerRegion(region => {
    const resultat = nettoyerRegionDaran(region);
    if (!resultat) return region;
    resume = resultat.resume;
    return resultat.region;
  });
  if (resume) deps.ouvrir(resume);
}

export function lancerAnniversaireDaran(surnom: string): void {
  declencherAnniversaire(surnom, {
    lireIdentifiant: () => localStorage.getItem(CLE_PROPRIETAIRE),
    appliquerRegion: f => storeJeu.getState().appliquerRegionTemp(f),
    ouvrir: ouvrirModalDaran,
  });
}
