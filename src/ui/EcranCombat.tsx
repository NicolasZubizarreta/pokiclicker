import { useEffect, useRef } from 'react';
import { useStore } from 'zustand';
import { chargerPokemon } from '../core/pokemon';
import { BarrePv } from './BarrePv';
import { CarteEquipe } from './CarteEquipe';
import { DegatsFlottants } from './DegatsFlottants';
import { DialogueChen } from './DialogueChen';
import { Etapes } from './Etapes';
import { Image } from './Image';
import { formaterDps } from './nombres';
import { ERREUR_CHARGEMENT } from './persistance';
import { cheminDecor, cheminSprite, precharger, prechargerZone } from './precharger';
import { storeJeu } from './store';
import type { StoreJeu } from './store';

const catalogue = chargerPokemon();
const formateurArgent = new Intl.NumberFormat('fr-FR');
const sousTitres: Record<string, string> = { 'kanto.route-1': 'Jadielle' };

function Entete({ store }: { store: StoreJeu }) {
  const zone = useStore(store, etat => etat.zone);
  const etape = useStore(store, etat => etat.etape);
  const argent = useStore(store, etat => etat.argent);
  return <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
    <div><h1 className="font-titre text-2xl font-semibold">{zone?.nom}</h1><p>{zone && (sousTitres[zone.id] ?? zone.nom)}</p></div>
    <span className="text-region-accent tabular-nums">{formateurArgent.format(argent)} pièces</span><Etapes etape={etape} />
  </header>;
}

function Scene({ store }: { store: StoreJeu }) {
  const sprite = useRef<HTMLDivElement>(null);
  const attaquer = () => {
    store.getState().attaquer();
    const element = sprite.current;
    // Recul de 4 px en 90 ms par l'API d'animation (composition hors du fil principal) ;
    // un changement de classe CSS à chaque appui coûtait plus de 400 tâches longues par minute.
    if (typeof element?.animate !== 'function' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    element.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(var(--spacing))' }, { transform: 'translateX(0)' }],
      { duration: 90, easing: 'cubic-bezier(0.2, 0, 0, 1)' });
  };
  const zone = useStore(store, etat => etat.zone);
  const ennemi = useStore(store, etat => etat.ennemi);
  const enRecherche = useStore(store, etat => etat.enRecherche);
  const annonce = useStore(store, etat => etat.annonce);
  useEffect(() => {
    if (!zone) return;
    void prechargerZone(zone);
    void precharger([cheminDecor(zone)]);
  }, [zone]);
  if (!zone || !ennemi) return null;
  const nom = catalogue.parNumero(ennemi.numero).nom;
  return <section aria-label={enRecherche ? 'Combat contre un Pokémon en approche' : `Combat contre ${nom}`} className="scene-limitee relative isolate h-76 bg-surface-2 lg:col-span-3 lg:aspect-video lg:h-auto">
    <Image src={cheminDecor(zone)} genre="decor" alt="" couvrir className="absolute inset-0 -z-10 size-full" />
    <div aria-hidden={enRecherche} className={`pointer-events-none cadre absolute top-4 left-4 z-10 w-3/5 bg-surface p-3 ${enRecherche ? 'opacity-0' : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-1">
        <h2 className="font-titre text-xl">{nom}{ennemi.boss ? ' (Géant)' : ''}</h2><span>Niv. {ennemi.niveau}</span>
      </div>
      {ennemi.shiny && <p>Chromatique</p>}
      <BarrePv key={`${ennemi.numero}-${ennemi.niveau}-${ennemi.boss}`} pv={ennemi.pv} maximum={ennemi.pvMax} nom={nom} />
    </div>
    <div ref={sprite} aria-hidden={enRecherche} className={`pointer-events-none absolute right-2 bottom-2 flex will-change-transform size-48 items-end justify-center lg:size-72 ${enRecherche ? 'opacity-0' : ''}`}>
      <div aria-hidden="true" className="socle absolute bottom-10 h-12 w-3/4 bg-region-socle lg:bottom-16 lg:h-16" />
      <Image src={cheminSprite(ennemi.numero)} genre="sprite" alt={nom} largeurDisponible={192}
        className="relative size-48 max-w-none lg:hidden" />
      <Image src={cheminSprite(ennemi.numero)} genre="sprite" alt={nom} largeurDisponible={288}
        className="relative hidden size-72 max-w-none lg:block" />
    </div>
    {enRecherche && <div role="status" className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span className="cadre bg-surface p-2">Recherche en cours…</span>
    </div>}
    {annonce !== null && <div role="status" aria-live="polite"
      className="pointer-events-none cadre absolute inset-x-4 top-4 z-20 bg-surface p-2 text-center">{annonce}</div>}
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
  return <section aria-label="Ton équipe" className="min-w-0 lg:col-start-4 lg:row-start-1 lg:row-end-3">
    <h2 className="mb-2 flex justify-between gap-2 font-titre text-xl">Ton équipe <span>{formaterDps(dps)} DPS</span></h2>
    <div className="grid grid-cols-6 gap-1 lg:grid-cols-1">{equipe.map((membre, i) =>
      <CarteEquipe key={membre?.pokemon.uid ?? i} membre={membre} />)}</div>
  </section>;
}

export function EcranCombat({ store = storeJeu }: { store?: StoreJeu }) {
  const erreur = useStore(store, etat => etat.erreur);
  const fatale = useStore(store, etat => etat.erreurChargement);
  return <>
    {erreur && <div role="alert" className="cadre mb-4 bg-surface p-4">
      {fatale && <p>{ERREUR_CHARGEMENT}</p>}<p>{erreur.split('\n')[0]}</p>
      {erreur.includes('\n') && <p className="mt-2 break-words text-sm">{erreur.slice(erreur.indexOf('\n') + 1)}</p>}
    </div>}
    {!fatale && <><Entete store={store} /><div className="grid gap-4 lg:grid-cols-4 lg:gap-6">
      <Scene store={store} />
      <Equipe store={store} /><DialogueChen store={store} />
    </div></>}
  </>;
}
