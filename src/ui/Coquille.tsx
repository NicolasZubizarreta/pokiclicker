import { useEffect, useState } from 'react';
import { useStore } from 'zustand';
import { Navigation } from './Navigation';
import type { Page } from './Navigation';
import { EcranCombat } from './EcranCombat';
import { CarteKanto } from './CarteKanto';
import { PageEquipe } from './PageEquipe';
import { PagePlus } from './PagePlus';
import { PageShop } from './PageShop';
import { storeJeu } from './store';
import { MiseAJour } from './MiseAJour';

export function Coquille({ region = 'kanto', theme = 'dark' }: {
  region?: 'kanto' | 'johto' | 'hoenn' | 'atlas';
  theme?: 'dark' | 'light';
}) {
  const [page, choisir] = useState<Page>('Combat');
  const annonce = useStore(storeJeu, etat => etat.annonce);
  const tutorielRoute1 = useStore(storeJeu, etat => etat.carte.tutorielRoute1);
  useEffect(() => {
    storeJeu.getState().demarrer();
    return () => { storeJeu.getState().fermer(); storeJeu.getState().arreter(); };
  }, []);

  return (
    <div data-region={region} data-theme={theme}
      className="min-h-dvh bg-fond font-texte text-texte pb-[env(safe-area-inset-bottom)] lg:pb-0">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-20 focus:bg-surface focus:p-4 focus:text-lien">
        Aller au contenu
      </a>
      <Navigation page={page} choisir={choisir} signalCarte={tutorielRoute1 && page !== 'Carte'} />
      <main id="contenu" tabIndex={-1} className="mb-14 min-w-0 p-4 lg:mb-0 lg:ml-24 lg:p-8">
        <MiseAJour />
        {page !== 'Combat' && annonce !== null && <div role="status" aria-live="polite"
          className="cadre bg-surface p-2 text-center">{annonce}</div>}
        {page === 'Combat' ? <EcranCombat /> : page === 'Carte' ? <CarteKanto quandArrive={() => choisir('Combat')} /> : page === 'Équipe' ? <PageEquipe /> : page === 'Plus' ? <PagePlus /> : <PageShop />}
      </main>
    </div>
  );
}
