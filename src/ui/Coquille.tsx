import { useEffect, useLayoutEffect, useState } from 'react';
import { useStore } from 'zustand';
import { Navigation } from './Navigation';
import type { Page } from './Navigation';
import { EcranCombat } from './EcranCombat';
import { PageCarte } from './PageCentre';
import { PageEquipe } from './PageEquipe';
import { PagePlus } from './PagePlus';
import { PageShop } from './PageShop';
import { storeJeu } from './store';
import { MiseAJour } from './MiseAJour';
import { ObtentionBadge } from './ObtentionBadge';
import { PageIntro } from './PageIntro';
import { DialogueScene } from './DialogueScene';
import { Credits } from './Credits';
import { Pantheon } from './Pantheon';
import { musique } from './musique';
import { sceneMusicale } from '../core/musiques';

export function Coquille({ region = 'kanto', theme = 'dark' }: {
  region?: 'kanto' | 'johto' | 'hoenn' | 'atlas';
  theme?: 'dark' | 'light';
}) {
  // Lien d'essai (dev seulement) : ?onglet=carte ouvre directement l'onglet Carte.
  const [page, choisir] = useState<Page>(() => import.meta.env.DEV && new URLSearchParams(window.location.search).get('onglet') === 'carte' ? 'Carte' : 'Combat');
  const annonce = useStore(storeJeu, etat => etat.annonce);
  const credits = useStore(storeJeu, etat => etat.fin.credits);
  const pantheon = useStore(storeJeu, etat => etat.pantheon);
  const obtentionBadge = useStore(storeJeu, etat => etat.obtentionBadge);
  const badges = useStore(storeJeu, etat => etat.progression.badges);
  const [declencheur, memoriserDeclencheur] = useState<HTMLElement | null>(null);
  useEffect(() => storeJeu.subscribe((etat, avant) => {
    if (etat.obtentionBadge !== null && avant.obtentionBadge === null) {
      memoriserDeclencheur(document.activeElement instanceof HTMLElement ? document.activeElement : null);
    }
  }), []);
  const introActive = useStore(storeJeu, etat => etat.intro.enCours || etat.intro.choixStarter);
  const evenement = useStore(storeJeu, etat => etat.evenement);
  const evolution = useStore(storeJeu, etat => etat.evolution);
  const terminerEtape = useStore(storeJeu, etat => etat.terminerEtape);
  const [introVue, fixerIntroVue] = useState(false);
  if (introActive && !introVue) fixerIntroVue(true);
  const tutorielRoute1 = useStore(storeJeu, etat => etat.carte.tutorielRoute1);
  const boss = useStore(storeJeu, etat => etat.ennemi?.boss === true);
  const adversaire = useStore(storeJeu, etat => etat.nomAdversaire !== null);
  const pantheonOuvert = !!pantheon?.ouvert;
  useEffect(() => {
    musique.definirScene(sceneMusicale({ pantheon: pantheonOuvert, intro: introActive || introVue,
      horsCombat: page !== 'Combat', boss, adversaire }));
  }, [pantheonOuvert, introActive, introVue, page, boss, adversaire]);
  useEffect(() => () => musique.arreter(), []);
  useLayoutEffect(() => {
    storeJeu.getState().demarrer();
    return () => { storeJeu.getState().fermer(); storeJeu.getState().arreter(); };
  }, []);

  return (
    <div data-region={region} data-theme={theme}
      className="min-h-dvh bg-fond font-texte text-texte pb-[env(safe-area-inset-bottom)] lg:pb-0">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-20 focus:bg-surface focus:p-4 focus:text-lien">
        Aller au contenu
      </a>
      <Navigation page={page} choisir={choisir} signalCarte={tutorielRoute1 && page !== 'Carte' && !introActive && !introVue} inerte={introActive || introVue || credits || !!pantheon?.ouvert} />
      <main id="contenu" tabIndex={-1} className="mb-14 min-w-0 p-4 lg:mb-0 lg:ml-24 lg:p-8">
        <MiseAJour />
        {page !== 'Combat' && page !== 'Carte' && annonce !== null && <div role="status" aria-live="polite"
          className="cadre bg-surface p-2 text-center">{annonce}</div>}
        {page === 'Combat' ? introVue || introActive ? <PageIntro quandTerminee={() => fixerIntroVue(false)} /> : <EcranCombat /> : page === 'Carte' ? <PageCarte quandArrive={() => choisir('Combat')} /> : page === 'Équipe' ? <PageEquipe /> : page === 'Plus' ? <PagePlus /> : <PageShop />}
      </main>
      {/* La Carte reste montée jusqu’à la fin du vol ; l’évolution garde aussi la priorité. */}
      {!introActive && !introVue && page !== 'Carte' && !evolution && evenement?.type === 'dialogue'
        && <DialogueScene commande={evenement} terminerEtape={terminerEtape} />}
      <ObtentionBadge ouvert={obtentionBadge !== null && obtentionBadge.phase !== 'message'} badges={badges}
        cache={obtentionBadge?.phase === 'message' || obtentionBadge?.phase === 'boite' ? obtentionBadge.id : null}
        claque={obtentionBadge?.phase === 'claque' ? obtentionBadge.id : null}
        fermer={() => storeJeu.getState().fermerBoiteBadges()} declencheur={declencheur} />
      {credits && <Credits fermerCredits={() => storeJeu.getState().fermerCredits()} />}
      {pantheon?.ouvert && <Pantheon equipe={pantheon.equipe} premiereVictoire={pantheon.premiereVictoire}
        quitter={() => storeJeu.getState().quitterPantheon()} />}
    </div>
  );
}
