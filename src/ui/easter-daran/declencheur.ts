import type { DonneesRegion } from '../../core/sauvegarde';
import { CLE_SESSION } from '../compte/session-compte';
import { storeJeu } from '../store';
import { estCompteDaran, estSurnomDaran } from './compte-daran';
import { ouvrirModalDaran } from './etat-modal';
import { nettoyerRegionDaran, type ResumeNettoyage } from './nettoyage';

export async function lireEmailCompte(): Promise<string | null> {
  try {
    const jeton = localStorage.getItem(CLE_SESSION);
    const url = import.meta.env.VITE_API_URL;
    if (!jeton || !url || !['http:', 'https:'].includes(new URL(url).protocol)) return null;
    const reponse = await fetch(`${url.replace(/\/+$/, '')}/api/auth/get-session`, {
      headers: { Authorization: `Bearer ${jeton}` },
      credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(8000),
    });
    if (!reponse.ok) return null;
    const donnees: unknown = await reponse.json();
    const user = donnees && typeof donnees === 'object' && 'user' in donnees ? donnees.user : null;
    return user && typeof user === 'object' && 'email' in user && typeof user.email === 'string' ? user.email : null;
  } catch { return null; }
}

export async function declencherAnniversaire(surnom: string, deps: {
  lireEmail(): Promise<string | null>;
  autorise?: string;
  appliquerRegion(f: (r: DonneesRegion) => DonneesRegion): void;
  ouvrir(r: ResumeNettoyage): void;
}): Promise<void> {
  if (!estSurnomDaran(surnom)) return;
  let email: string | null;
  try { email = await deps.lireEmail(); } catch { return; }
  if (!(await estCompteDaran(email, deps.autorise))) return;
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
  void declencherAnniversaire(surnom, {
    lireEmail: lireEmailCompte,
    appliquerRegion: f => storeJeu.getState().appliquerRegionTemp(f),
    ouvrir: ouvrirModalDaran,
  }).catch(() => {});
}
