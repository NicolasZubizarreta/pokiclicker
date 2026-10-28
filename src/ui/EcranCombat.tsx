import { useEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { chargerPokemon } from '../core/pokemon';
import { ECLAT, SECOUSSE } from './animations';
import { rejouer } from './rejouer';
import { BarrePv } from './BarrePv';
import { BarreTemps } from './BarreTemps';
import { BarreCapture } from './BarreCapture';
import { CarteEquipe } from './CarteEquipe';
import { FichePokemon } from './FichePokemon';
import { IconeShiny } from './IconeShiny';
import { PastilleCapture } from './icones';
import { DegatsFlottants } from './DegatsFlottants';
import { DialogueChen } from './DialogueChen';
import { ScenesBourgPalette } from './ScenesBourgPalette';
import { PagePension } from './PagePension';
import { kanto } from '../core/regions';
import { Etapes } from './Etapes';
import { Image, imageConnue } from './Image';
import { formaterDps } from './nombres';
import { ERREUR_CHARGEMENT } from './persistance';
import { cheminDecor, cheminSprite, precharger, prechargerZone } from './precharger';
import { storeJeu } from './store';
import { ReglagesCombat } from './ReglagesCombat';
import { PastillesEffets } from './PastillesEffets';
import { OutilsCombat } from './OutilsCombat';
import { FenetreRadar } from './FenetreRadar';
import { entreesRadar } from './store-objets';
import type { StoreJeu } from './store';

const catalogue = chargerPokemon();
const formateurArgent = new Intl.NumberFormat('fr-FR');
const sousTitres: Record<string, string> = { 'kanto.route-1': 'Jadielle' };

function Entete({ store }: { store: StoreJeu }) {
  const lieu = useStore(store, etat => etat.lieu);
  const zone = useStore(store, etat => etat.zone);
  const etape = useStore(store, etat => etat.etape);
  const argent = useStore(store, etat => etat.argent);
  return <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
    <div><h1 className="font-titre text-2xl font-semibold">{lieu?.nom}</h1><p>{lieu && (sousTitres[lieu.id] ?? lieu.nom)}</p></div>
    <span className="text-region-accent tabular-nums">{formateurArgent.format(argent)} pièces</span>{zone && <Etapes etape={etape} />}
  </header>;
}

function Scene({ store, ouvrirPension }: { store: StoreJeu; ouvrirPension(): void }) {
  const secousse = useRef<HTMLDivElement>(null);
  const attaquer = () => {
    if (!store.getState().attaquer()) return;
    const element = secousse.current;
    // Secousse et éclat de la V1 par l'API d'animation (composition hors du fil principal) ;
    // un changement de classe CSS à chaque appui coûtait plus de 400 tâches longues par minute.
    if (typeof element?.animate !== 'function' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    rejouer(element, SECOUSSE);
    // Seul l'éclat du sprite affiché (selon le point de rupture) est animé.
    const grand = window.matchMedia?.('(min-width: 1024px)').matches ?? false;
    const eclat = element.querySelectorAll('.eclat-touche')[grand ? 1 : 0];
    if (eclat) rejouer(eclat, ECLAT);
  };
  const lieu = useStore(store, etat => etat.lieu);
  const zone = useStore(store, etat => etat.zone);
  const ennemi = useStore(store, etat => etat.ennemi);
  const nomAdversaire = useStore(store, etat => etat.nomAdversaire);
  const minuteur = useStore(store, etat => etat.minuteur);
  const enRecherche = useStore(store, etat => etat.enRecherche);
  const cache = useStore(store, etat => etat.cache);
  const annonce = useStore(store, etat => etat.annonce);
  const banniere = useStore(store, etat => etat.banniere);
  const accesPension = useStore(store, etat => etat.pension.acces);
  const captureEnCours = useStore(store, etat => etat.capture.enCours);
  const effets = useStore(store, etat => etat.effets);
  const pokedex = useStore(store, etat => etat.pokedex);
  const numeroEnnemi = ennemi?.numero;
  const shinyEnnemi = ennemi?.shiny;
  useEffect(() => {
    if (zone) void prechargerZone(zone);
    if (lieu && imageConnue(cheminDecor(lieu))) void precharger([cheminDecor(lieu)]);
  }, [zone, lieu]);
  useEffect(() => {
    if (numeroEnnemi !== undefined) void precharger([cheminSprite(numeroEnnemi, shinyEnnemi)]);
  }, [numeroEnnemi, shinyEnnemi]);
  const notification = annonce !== null && <div role="status" aria-live="polite"
    className="pointer-events-none cadre absolute inset-x-4 top-4 z-20 bg-surface/82 p-2 text-center">{annonce}</div>;
  if (lieu?.id === kanto.depart) return <div
    className="scene-limitee scene-depart relative grid h-76 grid-rows-[minmax(0,1fr)_auto] bg-surface-2 lg:col-span-3 lg:aspect-6/5 lg:h-auto">
    <div className="min-h-0 [&>div]:h-full [&_section]:grid [&_section]:h-full [&_section]:grid-rows-[minmax(0,1fr)_auto_auto] [&_section>div]:h-full [&_section>div]:w-auto [&_section>div]:max-w-full [&_section>div]:justify-self-center [&_section>p:not([role])]:sr-only">
      <ScenesBourgPalette annonce={annonce} accesPension={accesPension} quandPension={ouvrirPension} />
    </div>
    {'message' in lieu && lieu.message && <p className="bg-surface p-2">{lieu.message}</p>}
  </div>;
  if (!zone && !ennemi && lieu) return <section aria-label={lieu.nom}
    className="scene-limitee relative isolate flex h-76 items-end bg-surface-2 p-4 lg:col-span-3 lg:aspect-video lg:h-auto">
    {imageConnue(cheminDecor(lieu)) && <Image src={cheminDecor(lieu)} genre="decor" alt="" couvrir className="absolute inset-0 -z-10 size-full" />}
    {'message' in lieu && lieu.message && <p className="cadre bg-surface/82 p-3">{lieu.message}</p>}
    {notification}
  </section>;
  if (!zone || !ennemi) return null;
  const nom = nomAdversaire ?? catalogue.parNumero(ennemi.numero).nom;
  return <section aria-label={enRecherche ? 'Combat contre un Pokémon en approche' : `Combat contre ${nom}`} className="scene-limitee relative isolate h-76 bg-surface-2 lg:col-span-3 lg:aspect-video lg:h-auto">
    <Image src={cheminDecor(zone)} genre="decor" alt="" couvrir className="absolute inset-0 -z-10 size-full" />
    <div aria-hidden={cache} className={`pointer-events-none cadre absolute top-4 left-4 z-10 w-3/5 bg-surface/82 p-3 ${cache ? 'opacity-0' : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-1">
        <h2 className="font-titre text-xl">{nom}{nomAdversaire === null && pokedex.includes(ennemi.numero) && <PastilleCapture />} {ennemi.shiny && <IconeShiny />}{ennemi.boss && nomAdversaire === null ? ' (Géant)' : ''}</h2><span>Niv. {ennemi.niveau}</span>
      </div>
      {ennemi.shiny && <p>Chromatique</p>}
      <BarrePv key={`${ennemi.numero}-${ennemi.niveau}-${ennemi.boss}`} pv={ennemi.pv} maximum={ennemi.pvMax} nom={nom} />
      {effets.length > 0 && <PastillesEffets effets={effets} />}
      {minuteur && <BarreTemps restantMs={minuteur.restantMs} totalMs={minuteur.totalMs} />}
    </div>
    <div aria-hidden={cache} className={`pointer-events-none absolute right-2 bottom-2 flex will-change-transform size-48 items-end justify-center lg:size-72 ${cache ? 'opacity-0' : ''}`}>
      <div aria-hidden="true" className="socle absolute bottom-10 h-12 w-3/4 bg-region-socle lg:bottom-16 lg:h-16" />
      <div className={captureEnCours ? '' : 'motion-safe:flottement'}>
        <div ref={secousse}>
          {[['size-48 lg:hidden', 192], ['hidden size-72 lg:block', 288]].map(([taille, largeur]) => <span key={largeur} className={`relative ${taille}`}>
            <Image src={cheminSprite(ennemi.numero, ennemi.shiny)} genre="sprite" alt={nom} largeurDisponible={largeur as number}
              className={`relative size-full max-w-none ${captureEnCours ? 'capture-en-cours' : ''} ${ennemi.shiny ? 'halo-shiny' : ''}`} />
            <Image src={cheminSprite(ennemi.numero, ennemi.shiny)} genre="sprite" alt="" largeurDisponible={largeur as number}
              className="eclat-touche will-change-[opacity] absolute inset-0 size-full max-w-none" />
          </span>)}
        </div>
      </div>
    </div>
    {enRecherche && <div role="status" className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span className="contour-texte p-2 text-neutre-50 motion-safe:animate-pulse">Recherche en cours…</span>
    </div>}
    {notification}
    {banniere !== null && <div aria-hidden="true"
      className="pointer-events-none cadre absolute inset-x-4 top-20 z-20 bg-alerte-base p-2 text-center text-texte-inverse">{banniere}</div>}
    <button type="button" aria-label={enRecherche ? 'Attaquer (recherche en cours)' : `Attaquer ${nom}`}
      className="cible-combat cadre absolute inset-0 z-10 touch-manipulation select-none"
      onContextMenu={event => event.preventDefault()}
      onPointerDown={event => { if (event.button === 0) attaquer(); }}
      onClick={event => { if (event.detail === 0) attaquer(); }} />
    <DegatsFlottants store={store} />
  </section>;
}

function Equipe({ store }: { store: StoreJeu }) {
  const equipe = useStore(store, etat => etat.equipe);
  const dps = useStore(store, etat => etat.dps);
  const [fiche, ouvrirFiche] = useState<{ uid: string; ouverture: number } | null>(null);
  const [ouvert, afficher] = useState(false);
  const declencheur = useRef<HTMLButtonElement>(null);
  return <section aria-label="Ton équipe" className="min-w-0 lg:col-start-4 lg:row-start-1 lg:row-end-4">
    <h2 className="mb-2 flex justify-between gap-2 font-titre text-xl">Ton équipe <span>{formaterDps(dps)} DPS</span></h2>
    <div className="grid grid-cols-6 gap-1 lg:grid-cols-1">{equipe.map((membre, i) =>
      <CarteEquipe key={membre?.pokemon.uid ?? i} membre={membre} renommer={(uid, bouton) => {
        declencheur.current = bouton;
        ouvrirFiche(precedente => ({ uid, ouverture: (precedente?.ouverture ?? 0) + 1 }));
        afficher(true);
      }} />)}</div>
    {fiche !== null && <FichePokemon key={fiche.ouverture} uid={fiche.uid} renommer ouvert={ouvert}
      fermer={() => afficher(false)} declencheur={declencheur} />}
  </section>;
}

function CommandesCombat({ store }: { store: StoreJeu }) {
  const [declencheurRadar, ouvrirRadar] = useState<HTMLButtonElement | null>(null);
  const zone = useStore(store, etat => etat.zone);
  const lieu = useStore(store, etat => etat.lieu);
  const pokedex = useStore(store, etat => etat.pokedex);
  const fauchage = useStore(store, etat => etat.fauchage);
  const radar = useStore(store, etat => etat.radar);
  const faucher = useStore(store, etat => etat.faucher);
  const capture = useStore(store, etat => etat.capture);
  const autoAttaque = useStore(store, etat => etat.autoAttaque);
  const autoClic = useStore(store, etat => etat.autoClic);
  const basculerAutoClic = useStore(store, etat => etat.basculerAutoClic);
  const arret = useStore(store, etat => etat.arretAuto);
  const capturer = useStore(store, etat => etat.capturer);
  const basculer = useStore(store, etat => etat.basculerAutoAttaque);
  const regler = useStore(store, etat => etat.reglerArretAuto);
  if (!zone) return <div aria-hidden="true" className="lg:col-span-3" />;
  const reglages = <ReglagesCombat autoAttaque={autoAttaque} arret={arret} basculer={basculer} regler={regler}
    autoClic={autoClic} basculerAutoClic={basculerAutoClic} />;
  return <div className="commandes-combat grid min-w-0 gap-1 lg:col-span-3">
    <fieldset className="min-w-0">
      <BarreCapture {...capture} capturer={capturer} />
    </fieldset>
    <>
      <div className="flex min-w-0 gap-2 overflow-x-auto [&>div]:shrink-0 [&>div]:flex-nowrap [&_button]:shrink-0 [&_p]:whitespace-nowrap">
        {reglages}
        <OutilsCombat fauchage={fauchage} radar={radar} faucher={faucher}
          ouvrirRadar={ouvrirRadar} />
      </div>
      <FenetreRadar ouvert={declencheurRadar !== null} nomZone={lieu?.nom ?? zone.nom}
        especes={entreesRadar(zone, pokedex)}
        fermer={() => ouvrirRadar(null)} declencheur={declencheurRadar} />
    </>
  </div>;
}

export function EcranCombat({ store = storeJeu }: { store?: StoreJeu }) {
  const [pensionOuverte, ouvrirPension] = useState(false);
  const cadre = useRef<HTMLDivElement>(null);
  const rendreFocus = useRef(false);
  const erreur = useStore(store, etat => etat.erreur);
  const fatale = useStore(store, etat => etat.erreurChargement);
  useEffect(() => {
    if (!pensionOuverte && rendreFocus.current) {
      cadre.current?.querySelector<HTMLButtonElement>('button[aria-label="Pension Pokémon"]')?.focus();
      rendreFocus.current = false;
    }
  }, [pensionOuverte]);
  if (pensionOuverte) return <PagePension store={store} retour={() => {
    rendreFocus.current = true;
    ouvrirPension(false);
  }} />;
  return <div ref={cadre}>
    {erreur && <div role="alert" className="cadre mb-4 bg-surface p-4">
      {fatale && <p>{ERREUR_CHARGEMENT}</p>}<p>{erreur.split('\n')[0]}</p>
      {erreur.includes('\n') && <p className="mt-2 break-words text-sm">{erreur.slice(erreur.indexOf('\n') + 1)}</p>}
    </div>}
    {!fatale && <><Entete store={store} /><div className="combat-grille grid gap-2 lg:grid-cols-4 lg:gap-4">
      <Scene store={store} ouvrirPension={() => ouvrirPension(true)} />
      <CommandesCombat store={store} />
      <Equipe store={store} /><DialogueChen store={store} />
    </div></>}
  </div>;
}
