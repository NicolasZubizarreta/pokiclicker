import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { useTelephone } from './useTelephone';
import { useRaccourcisPC } from './useRaccourcisPC';
import type { InfosPartie } from './BarreLaterale';
import { FenetreRaccourcis } from './FenetreRaccourcis';
import { Navigation } from './Navigation';
import { BandeauHaut } from './BandeauHaut';
import type { Page } from './Navigation';
import { EcranCombat } from './EcranCombat';
import { PageCarte } from './PageCentre';
import { AccueilCasino } from './AccueilCasino';
import { PagePension } from './PagePension';
import { FenetreEclosion } from './FenetreEclosion';
import { PageEquipe } from './PageEquipe';
import { PagePC } from './PagePC';
import { PagePlus } from './PagePlus';
import { PageMonde } from './PageMonde';
import { PageShop } from './PageShop';
import { storeJeu } from './store';
import { ObtentionBadge } from './ObtentionBadge';
import { PageIntro } from './PageIntro';
import { DialogueScene } from './DialogueScene';
import { SceneFin } from './SceneFin';
import { Credits } from './Credits';
import { Notifications } from './Notifications';
import { Tutoriel } from './tuto/Tutoriel';
import { FenetreSac } from './FenetreSac';
import { storeSac, terminerChoix } from './sacContexte';
import { Pantheon } from './Pantheon';
import { musique } from './musique';
import { sceneMusicale } from '../core/musiques';
import { registreSucces } from '../core/succes';
import { EcranMonCompte } from './compte/EcranMonCompte';

export function Coquille({ region = 'kanto', theme = 'dark', quandMenuPrincipal, attendreEnvoi, nomPartie, etatSynchro }: {
  quandMenuPrincipal?: () => Promise<boolean>;
  attendreEnvoi?: () => Promise<boolean | void>;
  region?: 'kanto' | 'johto' | 'hoenn' | 'atlas';
  theme?: 'dark' | 'light';
} & InfosPartie) {
  const telephone = useTelephone();
  const [raccourcisOuverts, ouvrirRaccourcis] = useState(false);
  // Lien d'essai (dev seulement) : ?onglet=carte ouvre directement l'onglet Carte.
  const [page, choisir] = useState<Page>(() => import.meta.env.DEV && new URLSearchParams(window.location.search).get('onglet') === 'carte' ? 'Carte' : 'Combat');
  const [origineMonde, fixerOrigineMonde] = useState<'Menu' | 'Carte'>('Menu');
  const [originePC, fixerOriginePC] = useState<'Menu' | 'Équipe'>('Menu');
  const retourChoix = useRef<Page | null>(null);
  const pageCourante = useRef(page);
  useLayoutEffect(() => { pageCourante.current = page; });
  // Point d'entrée du Monde Pokémon : le bouton de la Carte (lot 6) appellera aller('Monde').
  function aller(destination: Page) {
    // Navigation volontaire pendant le choix d'un Pokémon : l'objet est désarmé, sans retour forcé.
    retourChoix.current = null;
    if (storeSac.getState().objet) terminerChoix();
    if (destination === 'Monde') fixerOrigineMonde(page === 'Carte' ? 'Carte' : 'Menu');
    if (destination === 'PC') fixerOriginePC(page === 'Équipe' ? 'Équipe' : 'Menu');
    choisir(destination);
  }
  const compte = useStore(storeJeu, e => e.compte);
  const [compteOuvert, fixerCompteOuvert] = useState(false);
  const boutonCompte = useRef<HTMLButtonElement>(null);
  const credits = useStore(storeJeu, etat => etat.fin.credits);
  const pantheon = useStore(storeJeu, etat => etat.pantheon);
  const obtentionBadge = useStore(storeJeu, etat => etat.obtentionBadge);
  const badges = useStore(storeJeu, etat => etat.progression.badges);
  const [declencheur, memoriserDeclencheur] = useState<HTMLElement | null>(null);
  // Toute sortie de l'Équipe (même hors barre du bas) désarme l'objet venu du Sac : pas de bandeau fantôme au retour.
  useEffect(() => {
    if (page !== 'Équipe' && storeSac.getState().objet) { retourChoix.current = null; terminerChoix(); }
  }, [page]);
  useEffect(() => storeSac.subscribe((etat, avant) => {
    if (etat.objet !== null && avant.objet === null) {
      retourChoix.current = pageCourante.current;
      choisir('Équipe');
    } else if (etat.objet === null && retourChoix.current !== null) {
      const destination = retourChoix.current;
      retourChoix.current = null;
      choisir(destination);
    }
  }), []);
  useEffect(() => storeJeu.subscribe((etat, avant) => {
    if (etat.obtentionBadge !== null && avant.obtentionBadge === null) {
      memoriserDeclencheur(document.activeElement instanceof HTMLElement ? document.activeElement : null);
    }
  }), []);
  const introActive = useStore(storeJeu, etat => etat.intro.enCours || etat.intro.choixStarter);
  const evenement = useStore(storeJeu, etat => etat.evenement);
  const lieuId = useStore(storeJeu, etat => etat.lieu?.id);
  const ancienLieu = useRef(lieuId);
  useEffect(() => {
    if ((ancienLieu.current === 'kanto.route-de-ronflex' && lieuId !== ancienLieu.current)
      || (lieuId === 'kanto.route-de-ronflex' && evenement?.type === 'combat')) {
      document.getElementById('contenu')?.focus();
    }
    ancienLieu.current = lieuId;
  }, [lieuId, evenement?.type]);
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
      horsCombat: page !== 'Combat', boss, adversaire, credits }));
  }, [pantheonOuvert, introActive, introVue, page, boss, adversaire, credits]);
  useEffect(() => () => musique.arreter(), []);
  useLayoutEffect(() => {
    storeJeu.getState().demarrer();
    return () => { storeJeu.getState().fermer(); storeJeu.getState().arreter(); };
  }, []);

  useRaccourcisPC({ page, aller, raccourcisOuverts, basculerRaccourcis: () => ouvrirRaccourcis(ouvert => !ouvert),
    actif: !introActive && !introVue && !credits && !pantheonOuvert && !compteOuvert && !(evenement?.type === 'dialogue' && evenement.scene) });

  return (
    <div data-region={region} data-theme={theme}
      className={`coquille-pc min-h-dvh bg-fond font-texte text-texte ${introActive || introVue ? 'intro-pc' : ''}`}>
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-20 focus:bg-surface focus:p-4 focus:text-lien">
        Aller au contenu
      </a>
      {(telephone || (!introActive && !introVue)) && <Navigation nomPartie={nomPartie} etatSynchro={etatSynchro} quandMenuPrincipal={quandMenuPrincipal} page={page} choisir={aller} origineMonde={origineMonde} originePC={originePC} signalCarte={tutorielRoute1 && page !== 'Carte' && !introActive && !introVue} inerte={introActive || introVue || credits || !!pantheon?.ouvert || compteOuvert} />}
      <div className="lg:flex lg:min-h-0 lg:min-w-0 lg:flex-col">
      {!introActive && !introVue && <BandeauHaut combat={page === 'Combat'} ouvrirRaccourcis={() => ouvrirRaccourcis(true)} />}
      <main id="contenu" tabIndex={-1} inert={compteOuvert} className="min-w-0 px-4 pb-[calc(var(--spacing)*20+env(safe-area-inset-bottom))] pt-2 lg:flex-1 lg:min-h-0 lg:overflow-y-auto lg:p-8">
        {/* Avec un compte, le résumé du compte (diamants, succès, skins) est dans la zone compte, par Menu principal. */}
        {!quandMenuPrincipal && <button ref={boutonCompte} className="min-h-11 p-2 text-lien underline" onClick={() => fixerCompteOuvert(true)}>Mon compte</button>}
        {page === 'Combat' ? introVue || introActive ? <PageIntro quandTerminee={() => fixerIntroVue(false)} /> : <EcranCombat /> : page === 'Carte' ? <PageCarte quandArrive={() => choisir('Combat')} /> : page === 'Équipe' ? <PageEquipe ouvrirPC={() => aller('PC')} /> : page === 'PC' ? <PagePC retour={() => choisir(originePC)} libelleRetour={originePC === 'Équipe' ? "Retour à l'équipe" : 'Retour au menu'} /> : page === 'Monde' ? <PageMonde retour={() => choisir(origineMonde)} jouerKanto={() => choisir('Combat')} /> : page === 'Casino' ? <AccueilCasino retour={() => choisir('Menu')} /> : page === 'Pension' ? <PagePension retour={() => choisir('Menu')} libelleRetour="Retour au menu" /> : page === 'Menu' ? <PagePlus ouvrirPC={() => aller('PC')} ouvrirMonde={() => aller('Monde')} ouvrirCasino={() => aller('Casino')} ouvrirPension={() => aller('Pension')}menuPrincipal={quandMenuPrincipal} attendreEnvoi={attendreEnvoi} etatSynchro={quandMenuPrincipal ? etatSynchro : undefined} /> : <PageShop />}
      </main>
      </div>
      {raccourcisOuverts && <FenetreRaccourcis fermer={() => ouvrirRaccourcis(false)} />}
      {/* La Carte reste montée jusqu’à la fin du vol ; l’évolution garde aussi la priorité. */}
      {!introActive && !introVue && page !== 'Carte' && !evolution && evenement?.type === 'dialogue'
        && (evenement.scene ? <SceneFin key={evenement.evenement} commande={evenement} terminerEtape={terminerEtape} />
          : <DialogueScene commande={evenement} terminerEtape={terminerEtape} />)}
      <ObtentionBadge ouvert={obtentionBadge !== null && obtentionBadge.phase !== 'message'} badges={badges}
        cache={obtentionBadge?.phase === 'message' || obtentionBadge?.phase === 'boite' ? obtentionBadge.id : null}
        claque={obtentionBadge?.phase === 'claque' ? obtentionBadge.id : null}
        fermer={() => storeJeu.getState().fermerBoiteBadges()} declencheur={declencheur} />
      <Notifications quandAller={cible => { if (cible === 'casino') aller('Casino'); else if (cible === 'pension') aller('Pension'); }} />
      {!introActive && !introVue && <Tutoriel page={page} aller={aller} />}
      {!introActive && !introVue && <FenetreSac />}
      {!introActive && !introVue && <FenetreEclosion />}
      {credits && <Credits fermerCredits={() => storeJeu.getState().fermerCredits()} />}
      {pantheon?.ouvert && <Pantheon equipe={pantheon.equipe} premiereVictoire={pantheon.premiereVictoire}
        quitter={() => storeJeu.getState().quitterPantheon()} />}
      {compteOuvert && <div className="fixed inset-0 z-50 overflow-y-auto">
        <EcranMonCompte compte={compte} registre={registreSucces} theme={theme} quandFermer={() => {
          fixerCompteOuvert(false); boutonCompte.current?.focus();
        }} />
      </div>}
    </div>
  );
}
