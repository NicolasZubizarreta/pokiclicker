import { useEffect, useRef } from 'react';
import { useStore } from 'zustand';
import { AnnonceDeblocage } from './AnnonceDeblocage';
import { notifier, storeNotifications } from './pileNotifications';
import { storeJeu } from './store';

/**
 * Calque unique de toutes les notifications : posé en haut de l'écran (sous l'encoche), au-dessus du contenu,
 * jamais dans la mise en page. Les messages du jeu (`annonce` du store) et ceux des écrans (`notifier`)
 * s'y empilent ; rien n'intercepte le toucher. Le texte passe à la ligne et ne dépasse jamais l'écran.
 */
export function Notifications({ quandAller }: { quandAller?: (cible: string) => void } = {}) {
  const annonce = useStore(storeJeu, etat => etat.annonce);
  const liste = useStore(storeNotifications, etat => etat.liste);
  const echange = useStore(storeJeu, etat => etat.echange);
  const annuler = useRef<HTMLButtonElement>(null);
  useEffect(() => { notifier(annonce); }, [annonce]);
  // Le choix du Pokémon à remplacer s'affiche ici, comme les autres messages : il ne pousse jamais la page.
  useEffect(() => { if (echange) annuler.current?.focus(); }, [echange]);
  return <div data-notifications
    className="pointer-events-none fixed inset-x-4 top-[calc(var(--spacing)*2+env(safe-area-inset-top))] z-30 grid justify-items-center gap-2 lg:inset-x-auto lg:top-auto lg:right-4 lg:bottom-4 lg:w-96 lg:justify-items-end lg:content-end">
    <AnnonceDeblocage quandAller={quandAller} />
    {/* Lecture en aria-live sans role="status" : ce rôle reste celui des phrases d'état propres à chaque écran. */}
    <div aria-live="polite" className="grid w-full max-w-(--breakpoint-md) gap-2">
      {liste.map(n => <p key={n.id} className="cadre bg-surface p-2 text-center wrap-anywhere motion-safe:annonce-entree">{n.texte}</p>)}
      {echange && <div role="status" className="cadre pointer-events-auto flex flex-wrap items-center justify-between gap-3 bg-selection p-3">
        <p>Choisis le Pokémon à remplacer par {echange.nom}</p>
        <button ref={annuler} type="button" className="min-h-11 bg-surface-2 px-4 py-2" onClick={() => storeJeu.getState().annulerEchange()}>Annuler</button>
      </div>}
    </div>
  </div>;
}
