import { useEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { reglages } from '../core/reglages';
import { filtrerPc, trierPc } from '../core/pc';
import type { PokemonPossede } from '../core/sauvegarde';
import { nomAffiche, progressionOeuf, spriteAffiche } from './affichage-pokemon';
import { Image, imageConnue } from './Image';
import { IconeShiny } from './IconeShiny';
import { storeJeu, type StoreJeu } from './store';
import './PagePension.css';

const bouton = 'min-h-11 rounded-sm border-2 border-bordure bg-surface-2 p-2 hover:enabled:bg-selection disabled:text-texte-doux';
const principal = 'min-h-11 rounded-sm border-2 border-bordure bg-action p-2 text-action-texte hover:enabled:bg-action-survol disabled:text-texte-doux';
const nombre = (n: number) => n.toLocaleString('fr-FR');
function Portrait({ pokemon, grand = false }: { pokemon: PokemonPossede; grand?: boolean }) {
  const sprite = spriteAffiche(pokemon);
  return <>
    <span className="relative isolate">
      <span aria-hidden="true" className="absolute inset-x-4 bottom-6 -z-10 h-8 rounded-full bg-region-socle" />
      <Image src={sprite} genre="sprite" alt=""
        className={`${grand ? 'size-48 lg:size-72' : 'size-24'} max-w-full ${pokemon.shiny && !pokemon.oeuf ? 'halo-shiny' : ''}`} />
    </span>
    <strong className="break-words">{nomAffiche(pokemon)} {pokemon.shiny && !pokemon.oeuf && <IconeShiny />}</strong>
    <span>{pokemon.oeuf ? progressionOeuf(pokemon.oeuf) : `${pokemon.sexe === 'femelle' ? 'Femelle' : pokemon.sexe === 'male' ? 'Mâle' : 'Sans sexe'} · Niveau ${pokemon.niveau}`}</span>
  </>;
}

export function PagePension({ retour, store = storeJeu }: { retour(): void; store?: StoreJeu }) {
  const pension = useStore(store, e => e.pension);
  const equipe = useStore(store, e => e.equipe);
  const pc = useStore(store, e => e.pc);
  const argent = useStore(store, e => e.argent);
  const [message, signaler] = useState('Confie deux parents à la pension. Les œufs avancent seulement dans ton équipe.');
  const [choix, choisir] = useState(false);
  const [recherche, rechercher] = useState('');
  const titre = useRef<HTMLHeadingElement>(null);
  const champ = useRef<HTMLInputElement>(null);
  const parents = useRef<HTMLElement>(null);
  useEffect(() => { titre.current?.focus(); }, []);
  useEffect(() => { if (choix) champ.current?.focus(); }, [choix]);
  function fermerChoix() {
    choisir(false);
    parents.current?.querySelector<HTMLButtonElement>('button')?.focus();
  }
  function agir(action: () => string | null, succes: string) {
    const refus = action();
    signaler(refus ?? succes);
    return !refus;
  }
  const destination = equipe.filter(Boolean).length < 6 ? 'ton équipe' : 'PC (équipe pleine)';
  const premier = pension.oeufs[0];
  return <section className="relative isolate mx-auto max-w-screen-xl text-base">
    {imageConnue('img/decors/pension.webp') && <Image src="img/decors/pension.webp" genre="decor" alt="" couvrir className="pointer-events-none absolute inset-0 -z-10 size-full" />}
    <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <div><p>Bourg Palette · Kanto</p><h1 ref={titre} tabIndex={-1} className="font-titre text-2xl font-semibold">La pension</h1></div>
      <strong className="text-region-accent">{nombre(argent)} pièces</strong>
      <button className={bouton} onClick={retour}>Sortir de la pension</button>
    </header>
    {pension.acces.ouvert && <div className="grid min-w-0 gap-4">
      <div className="flex items-center justify-center gap-4 bg-selection p-4">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="pension-coeur size-8 shrink-0 fill-current text-erreur-base"><path d="M12 21 3 12C-3 3 7-2 12 5c5-7 15-2 9 7Z" /></svg>
        <div><strong className="text-region-accent">{nombre(pension.chance * 100)} % par élimination</strong>
          <p>{pension.oeufs.length >= pension.emplacements ? 'Pension pleine : prends un œuf.' : pension.chance ? 'Deux parents compatibles.' : 'Dépose deux parents compatibles.'}</p></div>
      </div>
      <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section ref={parents} aria-label="Parents" className="cadre grid min-w-0 gap-4 bg-surface p-4">
          <h2 className="font-titre text-xl">Les parents</h2>
          <div className="grid min-w-0 gap-4 lg:grid-cols-2">{Array.from({ length: 2 }, (_, i) => {
            const parent = pension.parents[i];
            return <article key={i} className="grid min-w-0 justify-items-center gap-4 bg-surface-2 p-4 text-center">
              {parent ? <Portrait pokemon={parent} grand /> : <><h3>Place libre</h3><p>Choisis un parent dans ton équipe ou ton PC.</p></>}
              <button className={bouton} onClick={() => parent
                ? agir(() => store.getState().retirerParent(parent.uid), `${nomAffiche(parent)} rejoint ${destination}.`)
                : choisir(true)}>{parent ? `Retirer ${nomAffiche(parent)}` : 'Déposer un parent'}</button>
            </article>;
          })}</div>
        </section>
        <section aria-label="Œufs" className="cadre grid min-w-0 gap-4 bg-surface p-4">
          <h2 className="font-titre text-xl">Les œufs · {pension.oeufs.length} / {pension.emplacements}</h2>
          <div role="group" aria-label="Emplacements des œufs"><ul className="grid grid-cols-5 gap-1">{Array.from({ length: pension.emplacementsMax }, (_, i) => <li key={i} className="grid min-w-0 content-center justify-items-center gap-1 bg-surface-2 py-4 text-center">
            {pension.oeufs[i] ? <Image src={spriteAffiche(pension.oeufs[i])} genre="sprite" alt="Œuf" className="pension-oeuf size-8" /> : i < pension.emplacements ? <span>Libre</span> : <><svg viewBox="0 0 24 24" aria-hidden="true" className="size-6 fill-none stroke-current"><path d="M5 10h14v11H5zM8 10V6a4 4 0 0 1 8 0v4" /></svg><span>Fermé</span></>}
            <span>{i + 1}</span>
          </li>)}</ul></div>
          <p>Espèce inconnue jusqu’à l’éclosion. Prends un œuf, puis remporte {reglages.pension.pasEclosion} combats avec lui dans ton équipe.</p>
          <button disabled={!premier} className={principal} onClick={() => premier && agir(() => store.getState().prendreOeuf(premier.uid), `L’œuf rejoint ${destination}.`)}>Prendre l’œuf</button>
          <p>{premier ? `Destination : ${destination}.` : 'Aucun œuf : continue les combats avec deux parents compatibles.'}</p>
          <div className="grid gap-2">{Array.from({ length: pension.emplacementsMax - pension.emplacements }, (_, i) => <div key={pension.emplacements + i} className="grid gap-2">
            <button className={bouton} disabled={i > 0 || !!pension.prochainEmplacement?.raison} onClick={() => agir(() => store.getState().acheterEmplacementOeuf(), 'Emplacement ouvert. Tu peux accueillir un œuf de plus.')}>
              Ouvrir · {nombre(i === 0 ? pension.prochainEmplacement!.prix : (pension.emplacements + i) * reglages.pension.prixParEmplacement)} pièces
            </button>
            {i > 0 ? <p>Ouvre d’abord l’emplacement précédent.</p> : pension.prochainEmplacement?.raison && <p>{pension.prochainEmplacement.raison}</p>}
          </div>)}</div>
        </section>
      </div>
      {choix && <section aria-label="Choisir un parent" className="cadre grid gap-4 bg-surface p-4">
        <h2 className="font-titre text-xl">Choisir un parent</h2>
        <button className={bouton} onClick={fermerChoix}>Annuler</button>
        <label htmlFor="recherche-parent">Nom ou numéro</label>
        <input ref={champ} id="recherche-parent" type="search" value={recherche} onChange={e => rechercher(e.target.value)} className="min-h-11 min-w-0 border border-bordure bg-surface-2 p-2" />
        {([['Équipe', equipe.flatMap(m => m ? [m.pokemon] : [])], ['PC', pc]] as const).map(([nom, liste]) => <section key={nom} aria-label={nom}>
          <h3 className="mb-2 font-titre text-xl">{nom}</h3>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{trierPc(filtrerPc([...liste], recherche, nomAffiche), 'numero', nomAffiche).map(p => <li key={p.uid}>
            <button aria-label={`Déposer ${nomAffiche(p)}`} className={`${bouton} grid w-full justify-items-center gap-2`} onClick={() => {
              if (agir(() => store.getState().deposerParent(p.uid), `${nomAffiche(p)} rejoint la pension.`)) fermerChoix();
            }}><Portrait pokemon={p} /></button>
          </li>)}</ul>
          {liste.length === 0 && <p>Aucun Pokémon.</p>}
        </section>)}
      </section>}
    </div>}
    <p role="status" className="my-4 bg-surface p-4">{pension.acces.ouvert ? message : pension.acces.raison}</p>
  </section>;
}
