import { useEffect } from 'react';
import { useStore } from 'zustand';
import { chargerPokemon } from '../core/pokemon';
import { BarrePv } from './BarrePv';
import { CarteEquipe } from './CarteEquipe';
import { DegatsFlottants } from './DegatsFlottants';
import { DialogueChen } from './DialogueChen';
import { Etapes } from './Etapes';
import { Image } from './Image';
import { ERREUR_CHARGEMENT } from './persistance';
import { cheminDecor, cheminSprite, precharger, prechargerZone } from './precharger';
import { storeJeu } from './store';
import type { StoreJeu } from './store';

const catalogue = chargerPokemon();
export const ARGENT_PROVISOIRE = '1 250 pièces';
const sousTitres: Record<string, string> = { 'kanto.route-1': 'Jadielle' };

function Entete({ store }: { store: StoreJeu }) {
  const zone = useStore(store, etat => etat.zone);
  const etape = useStore(store, etat => etat.etape);
  return <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
    <div><h1 className="font-titre text-2xl font-semibold">{zone?.nom}</h1><p>{zone && (sousTitres[zone.id] ?? zone.nom)}</p></div>
    <span className="text-region-accent">{ARGENT_PROVISOIRE}</span><Etapes etape={etape} />
  </header>;
}

function Scene({ store }: { store: StoreJeu }) {
  const zone = useStore(store, etat => etat.zone);
  const ennemi = useStore(store, etat => etat.ennemi);
  useEffect(() => {
    if (!zone) return;
    void prechargerZone(zone);
    void precharger([cheminDecor(zone)]);
  }, [zone]);
  if (!zone || !ennemi) return null;
  const nom = catalogue.parNumero(ennemi.numero).nom;
  return <section aria-label={`Combat contre ${nom}`} className="cadre relative isolate h-76 overflow-hidden bg-surface-2 lg:col-span-3 lg:aspect-video lg:h-auto">
    <Image src={cheminDecor(zone)} genre="decor" alt="" couvrir className="absolute inset-0 -z-10 size-full" />
    <div className="cadre absolute top-4 left-4 z-10 w-3/5 bg-surface p-3">
      <div className="flex flex-wrap items-center justify-between gap-1">
        <h2 className="font-titre text-xl">{nom}{ennemi.boss ? ' (Géant)' : ''}</h2><span>Niv. {ennemi.niveau}</span>
      </div>
      {ennemi.shiny && <p>Chromatique</p>}
      <BarrePv key={`${ennemi.numero}-${ennemi.niveau}-${ennemi.boss}`} pv={ennemi.pv} maximum={ennemi.pvMax} nom={nom} />
    </div>
    <div className="absolute right-2 bottom-2 flex size-48 items-end justify-center lg:size-72">
      <div aria-hidden="true" className="socle absolute bottom-10 h-12 w-3/4 bg-region-socle lg:bottom-16 lg:h-16" />
      <Image src={cheminSprite(ennemi.numero)} genre="sprite" alt={nom} largeurDisponible={192}
        className="relative size-48 max-w-none lg:hidden" />
      <Image src={cheminSprite(ennemi.numero)} genre="sprite" alt={nom} largeurDisponible={288}
        className="relative hidden size-72 max-w-none lg:block" />
    </div>
    <DegatsFlottants store={store} />
  </section>;
}

function Equipe({ store }: { store: StoreJeu }) {
  const equipe = useStore(store, etat => etat.equipe);
  const dps = useStore(store, etat => etat.dps);
  return <section aria-label="Ton équipe" className="min-w-0 lg:col-start-4 lg:row-start-1 lg:row-end-4">
    <h2 className="mb-2 flex justify-between gap-2 font-titre text-xl">Ton équipe <span>{dps} DPS</span></h2>
    <div className="grid grid-cols-6 gap-1 lg:grid-cols-1">{equipe.map((membre, i) =>
      <CarteEquipe key={membre?.pokemon.uid ?? i} membre={membre} />)}</div>
  </section>;
}

function Suite({ store }: { store: StoreJeu }) {
  const fin = useStore(store, etat => etat.finZone);
  const suite = useStore(store, etat => etat.suite);
  return <section className="cadre bg-surface p-4 lg:col-span-3">
    {fin && <p role="status" className="mb-2 font-titre text-xl">{fin}</p>}
    {suite && <><button type="button" disabled aria-describedby="raison-suite" className="min-h-11 bg-surface-2 px-4 text-texte-doux">{suite.nom}</button>
      <p id="raison-suite" className="mt-2">{suite.raison}</p></>}
  </section>;
}

export function EcranCombat({ store = storeJeu }: { store?: StoreJeu }) {
  const erreur = useStore(store, etat => etat.erreur);
  const fatale = useStore(store, etat => etat.erreurChargement);
  const attaquer = useStore(store, etat => etat.attaquer);
  return <>
    {erreur && <div role="alert" className="cadre mb-4 bg-surface p-4">
      {fatale && <p>{ERREUR_CHARGEMENT}</p>}<p>{erreur}</p>
    </div>}
    {!fatale && <><Entete store={store} /><div className="grid gap-4 lg:grid-cols-4 lg:gap-6">
      <Scene store={store} />
      <button type="button" onClick={attaquer}
        className="cadre plaque-attaque h-22 w-full bg-action font-titre text-3xl text-action-texte shadow-md hover:bg-action-survol active:translate-y-0.5 lg:col-span-3">Attaque</button>
      <Equipe store={store} /><DialogueChen /><Suite store={store} />
    </div></>}
  </>;
}
