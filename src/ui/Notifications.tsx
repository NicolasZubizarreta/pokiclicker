import { useEffect } from 'react';
import { useStore } from 'zustand';
import { AnnonceDeblocage } from './AnnonceDeblocage';
import { notifier, storeNotifications } from './pileNotifications';
import { storeJeu } from './store';

/**
 * Calque unique de toutes les notifications : posé en haut de l'écran (sous l'encoche), au-dessus du contenu,
 * jamais dans la mise en page. Les messages du jeu (`annonce` du store) et ceux des écrans (`notifier`)
 * s'y empilent ; rien n'intercepte le toucher. Le texte passe à la ligne et ne dépasse jamais l'écran.
 */
export function Notifications() {
  const annonce = useStore(storeJeu, etat => etat.annonce);
  const liste = useStore(storeNotifications, etat => etat.liste);
  useEffect(() => { notifier(annonce); }, [annonce]);
  return <div data-notifications
    className="pointer-events-none fixed inset-x-4 top-[calc(var(--spacing)*2+env(safe-area-inset-top))] z-30 grid justify-items-center gap-2 lg:left-28">
    <AnnonceDeblocage />
    {/* Lecture en aria-live sans role="status" : ce rôle reste celui des phrases d'état propres à chaque écran. */}
    <div aria-live="polite" className="grid w-full max-w-(--breakpoint-md) gap-2">
      {liste.map(n => <p key={n.id} className="cadre bg-surface p-2 text-center wrap-anywhere motion-safe:annonce-entree">{n.texte}</p>)}
    </div>
  </div>;
}
