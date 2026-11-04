import { useEffect, useState } from 'react';
import { deconnecter, ErreurCompte, lireSession } from './api-compte';

export const CLE_SESSION = 'pokiclicker.session';

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

  function memoriser(nouveau: string | null) {
    ecrireJeton(nouveau);
    fixerJeton(nouveau);
    fixerValide(!!nouveau);
    fixerAttente(false);
  }

  useEffect(() => {
    let actif = true;
    let enCours = false;
    async function valider() {
      if (!jeton || enCours) return;
      enCours = true;
      try {
        const accepte = await lireSession(jeton);
        if (actif) {
          if (accepte) fixerValide(true);
          else memoriser(null);
        }
      } catch (erreur) {
        if (actif) {
          if (erreur instanceof ErreurCompte && erreur.statut === 401) memoriser(null);
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
    memoriser(null);
    if (ancien) {
      try { await deconnecter(ancien); } catch { /* La déconnexion locale reste possible sans réseau. */ }
    }
  }
  return { valide, attente, jeton, memoriser, quitter };
}
