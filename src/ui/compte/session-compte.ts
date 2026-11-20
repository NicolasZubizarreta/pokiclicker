import { useEffect, useState } from 'react';
import { deconnecter, ErreurCompte, lireSession } from './api-compte';

export const CLE_SESSION = 'pokiclicker.session';
export const CLE_REVOCATION = 'pokiclicker.revocation';
export const CLE_PROPRIETAIRE = 'pokiclicker.proprietaire';
let jeuDejaAutorise = false;

function lireRevocations(): string[] {
  try {
    const valeur: unknown = JSON.parse(localStorage.getItem(CLE_REVOCATION) ?? '[]');
    return Array.isArray(valeur) ? valeur.filter((v): v is string => typeof v === 'string').slice(-5) : [];
  } catch { return []; }
}

function ecrireRevocations(jetons: string[]) {
  try { localStorage.setItem(CLE_REVOCATION, JSON.stringify(jetons.slice(-5))); } catch { /* Stockage indisponible. */ }
}

async function revoquer(jeton: string) {
  try { await deconnecter(jeton); }
  catch (erreur) { if (!(erreur instanceof ErreurCompte && erreur.statut === 401)) return; }
  ecrireRevocations(lireRevocations().filter(v => v !== jeton));
}

function adopterCompte(id: string): boolean {
  try {
    const ancien = localStorage.getItem(CLE_PROPRIETAIRE);
    if (ancien === id) return true;
    if (ancien === null) { localStorage.setItem(CLE_PROPRIETAIRE, id); return true; }
    const cles = Object.keys(localStorage).filter(cle => cle.startsWith('pokiclicker:'));
    // Toutes les copies précèdent les suppressions ; une archive existante reste intacte.
    for (const cle of cles) {
      const valeur = localStorage.getItem(cle)!;
      const base = `pokiclicker.archive.${ancien}.${cle}`;
      let archive = base;
      let numero = 0;
      while (localStorage.getItem(archive) !== null && localStorage.getItem(archive) !== valeur) archive = `${base}.${++numero}`;
      localStorage.setItem(archive, valeur);
    }
    localStorage.setItem(CLE_PROPRIETAIRE, id);
    for (const cle of cles) localStorage.removeItem(cle);
    if (jeuDejaAutorise) { window.location.reload(); return false; }
    return true;
  } catch { return false; }
}

function lireJeton() {
  try { return localStorage.getItem(CLE_SESSION); } catch { return undefined; }
}

function ecrireJeton(jeton: string | null) {
  try {
    if (jeton) localStorage.setItem(CLE_SESSION, jeton);
    else localStorage.removeItem(CLE_SESSION);
  } catch { /* La session reste en mémoire quand le stockage est indisponible. */ }
}

export function useSessionCompte() {
  const [jeton, fixerJeton] = useState(() => lireJeton() ?? null);
  const [valide, fixerValide] = useState(false);
  const [attente, fixerAttente] = useState(!!jeton);
  const [expiree, fixerExpiree] = useState(false);

  function memoriser(nouveau: string | null) {
    ecrireJeton(nouveau);
    fixerJeton(nouveau);
    fixerValide(false);
    fixerAttente(!!nouveau);
    fixerExpiree(false);
  }

  useEffect(() => {
    if (valide) jeuDejaAutorise = true;
  }, [valide]);

  useEffect(() => {
    const rejouer = () => { for (const ancien of lireRevocations()) void revoquer(ancien); };
    rejouer();
    window.addEventListener('online', rejouer);
    return () => window.removeEventListener('online', rejouer);
  }, []);

  useEffect(() => {
    let actif = true;
    let enCours = false;
    async function valider() {
      if (!jeton || enCours) return;
      enCours = true;
      try {
        const accepte = await lireSession(jeton);
        if (actif) {
          if (accepte.valide) fixerValide(accepte.compteId === null || adopterCompte(accepte.compteId));
          else { memoriser(null); fixerExpiree(true); }
        }
      } catch (erreur) {
        if (actif) {
          // Le serveur refuse le jeton : la partie locale n'est pas touchée.
          if (erreur instanceof ErreurCompte && (erreur.statut === 401 || erreur.statut === 403)) { memoriser(null); fixerExpiree(true); }
          else fixerValide(true);
        }
      } finally {
        enCours = false;
        if (actif) fixerAttente(false);
      }
    }
    void valider();
    const minuterie = window.setInterval(() => { void valider(); }, 60_000);
    window.addEventListener('online', valider);
    function stockage(evenement: StorageEvent) {
      if (evenement.key !== CLE_SESSION && evenement.key !== null) return;
      try {
        if (evenement.storageArea && evenement.storageArea !== window.localStorage) return;
      } catch { return; }
      const nouveau = lireJeton();
      if (nouveau === undefined || nouveau === jeton) return;
      fixerJeton(nouveau);
      fixerValide(false);
      fixerAttente(!!nouveau);
    }
    window.addEventListener('storage', stockage);
    return () => {
      actif = false;
      window.clearInterval(minuterie);
      window.removeEventListener('online', valider);
      window.removeEventListener('storage', stockage);
    };
  }, [jeton]);

  async function quitter() {
    const ancien = jeton;
    if (ancien) ecrireRevocations([...lireRevocations().filter(v => v !== ancien), ancien]);
    memoriser(null);
    if (ancien) {
      await revoquer(ancien);
    }
  }
  return { valide, attente, expiree, jeton, memoriser, quitter };
}
