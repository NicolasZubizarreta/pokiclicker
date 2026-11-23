import { useEffect, useState } from 'react';
import jeu from '../../data/jeu.json';
import { creerStockageLocal } from './stockage-local';

interface Invitation extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
const cle = 'pokiclicker:installation-proposee';
const autonome = () => window.matchMedia?.('(display-mode: standalone)').matches
  || (navigator as Navigator & { standalone?: boolean }).standalone;

export function InvitationInstallation() {
  const [invitation, fixerInvitation] = useState<Invitation | null>(null);
  const [ios, fixerIos] = useState(false);
  const [pret, fixerPret] = useState(false);
  const [termine, fixerTermine] = useState(false);
  const [autreToast, fixerAutreToast] = useState(false);
  const [occupe, fixerOccupe] = useState(false);
  function terminer() {
    fixerTermine(true);
    try { creerStockageLocal().ecrire(cle, '1'); } catch { /* Le refus reste valable pour cet affichage. */ }
  }
  useEffect(() => {
    try { if (creerStockageLocal().lire(cle)) fixerTermine(true); } catch { /* Stockage facultatif. */ }
    if (autonome()) return;
    if (import.meta.env.PROD) fixerIos(/iPhone|iPad/.test(navigator.userAgent)
      && /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent));
    const recevoir = (event: Event) => { event.preventDefault(); fixerInvitation(event as Invitation); };
    window.addEventListener('beforeinstallprompt', recevoir);
    window.addEventListener('appinstalled', terminer);
    const minuteur = setTimeout(() => fixerPret(true), 20000);
    const observer = new MutationObserver(() => fixerAutreToast(!!document.querySelector('aside.toast[role="status"]:not([data-installation])')));
    observer.observe(document.body, { childList: true, subtree: true });
    fixerAutreToast(!!document.querySelector('aside.toast[role="status"]:not([data-installation])'));
    return () => {
      clearTimeout(minuteur); observer.disconnect();
      window.removeEventListener('beforeinstallprompt', recevoir);
      window.removeEventListener('appinstalled', terminer);
    };
  }, []);
  if (!pret || termine || autonome() || autreToast || (!invitation && !ios)) return null;
  const bouton = 'min-h-11 border border-bordure bg-surface-2 px-4 text-base text-texte';
  return <aside data-installation role="status" aria-live="polite" className="toast fixed z-30 cadre bg-surface p-4">
    <p>{ios ? "Pour installer le jeu : touche Partager, puis Sur l'écran d'accueil."
      : `Installe ${jeu.nomCourt} sur ton écran d'accueil pour jouer en plein écran.`}</p>
    <div className="mt-2 flex flex-wrap gap-2">
      {!ios && <button className={bouton} disabled={occupe} onClick={async () => {
        if (!invitation) return;
        fixerOccupe(true);
        try { await invitation.prompt(); await invitation.userChoice; terminer(); }
        catch { fixerInvitation(null); }
        finally { fixerOccupe(false); }
      }}>Installer</button>}
      <button className={bouton} onClick={terminer}>{ios ? 'Compris' : 'Plus tard'}</button>
    </div>
  </aside>;
}
