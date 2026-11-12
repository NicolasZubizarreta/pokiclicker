import { useEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { reglages } from '../core/reglages';
import { couplePonte, type RaisonPonte } from '../core/pension';
import { filtrerPc, trierPc } from '../core/pc';
import type { PokemonPossede } from '../core/sauvegarde';
import { classeSprite, nomAffiche, progressionOeuf, spriteAffiche } from './affichage-pokemon';
import { Image } from './Image';
import { IconeShiny } from './IconeShiny';
import { CollectionEclosions } from './CollectionEclosions';
import { storeJeu, type StoreJeu } from './store';
import { useTelephone } from './useTelephone';
import './PagePension.css';

const nombre = (n: number) => n.toLocaleString('fr-FR');
const sexe = (p: PokemonPossede) => p.sexe === 'femelle' ? 'Femelle' : p.sexe === 'male' ? 'Mâle' : 'Sans sexe';
const raisons: Record<RaisonPonte, string> = { incomplet: 'couple incomplet', metamorph: 'avec Métamorph', memeSexe: 'même sexe', sansSexe: 'sans sexe', memeEspece: 'même espèce', typePartage: 'type partagé', aucunType: 'aucun type commun' };
function Coeur() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="pension-coeur"><path d="M12 21 3 12C-3 3 7-2 12 5c5-7 15-2 9 7Z" /></svg>;
}
function Portrait({ pokemon }: { pokemon: PokemonPossede }) {
  return <><span className={`pension-portrait ${pokemon.oeuf ? 'pension-portrait-oeuf' : ''}`}><Image src={spriteAffiche(pokemon)} genre="sprite" alt="" className={`${pokemon.shiny && !pokemon.oeuf ? 'halo-shiny' : ''} ${classeSprite(pokemon)}`} /></span>
    <strong>{nomAffiche(pokemon)} {pokemon.shiny && !pokemon.oeuf && <IconeShiny />}</strong>
    <span className="pension-detail">{pokemon.oeuf ? progressionOeuf(pokemon.oeuf) : `${sexe(pokemon)} · Niveau ${pokemon.niveau}`}</span></>;
}

export function PagePension({ retour, libelleRetour, store = storeJeu }: { retour(): void; libelleRetour?: string; store?: StoreJeu }) {
  const telephone = useTelephone();
  const pension = useStore(store, e => e.pension);
  const equipe = useStore(store, e => e.equipe);
  const pc = useStore(store, e => e.pc);
  const [message, signaler] = useState('Confie deux parents à la pension. Les œufs avancent seulement dans ton équipe.');
  const [choix, choisir] = useState(false);
  const [recherche, rechercher] = useState('');
  const titre = useRef<HTMLHeadingElement>(null);
  const champ = useRef<HTMLInputElement>(null);
  const dialogue = useRef<HTMLDialogElement>(null);
  const declencheur = useRef<HTMLButtonElement | null>(null);
  const focusParent = useRef<string | null>(null);
  const parents = useRef<HTMLElement>(null);
  useEffect(() => { store.getState().entrerALaPension(); titre.current?.focus(); }, [store]);
  useEffect(() => {
    if (choix) { dialogue.current?.showModal(); champ.current?.focus(); }
    else if (focusParent.current) {
      const boutons = parents.current?.querySelectorAll<HTMLButtonElement>('button');
      const cible = Array.from(boutons ?? []).find(b => b.dataset.uid === focusParent.current);
      (cible ?? boutons?.[0])?.focus(); focusParent.current = null;
    } else declencheur.current?.focus();
  }, [choix]);
  function ouvrir(b: HTMLButtonElement) { declencheur.current = b; rechercher(''); choisir(true); }
  function fermer() { dialogue.current?.close(); choisir(false); }
  function agir(action: () => string | null, succes: string) {
    const refus = action(); signaler(refus ?? succes); return !refus;
  }
  const destination = equipe.filter(Boolean).length < reglages.equipe.taille ? 'ton équipe' : 'PC (équipe pleine)';
  const premier = pension.parents[0];
  const chances = reglages.pension.chances;
  const maximum = Math.max(...Object.values(chances));
  const phrase = pension.oeufs.length >= pension.emplacements ? 'Pension pleine : prends un œuf.' : pension.chance ? 'Deux parents compatibles.' : 'Dépose deux parents compatibles.';
  function retirer(parent: PokemonPossede) {
    agir(() => store.getState().retirerParent(parent.uid), `${nomAffiche(parent)} rejoint ${destination}.`);
  }
  return <section className={`${telephone ? '' : 'pension-pc '}page-pension`}>
    <header className="pension-entete"><div><p>Bourg Palette · Kanto</p><h1 ref={titre} tabIndex={-1}>{telephone ? 'La pension' : 'Pension'}</h1></div>
      <button className="plaque" onClick={retour}>{libelleRetour ?? (telephone ? 'Sortir de la pension' : 'Retour à Bourg Palette')}</button></header>
    {pension.acces.ouvert && <>
      <div className="pension-monde"><div className="pension-scene cadre">
        <Image src="img/decors/pension.webp" genre="decor" alt="" className="pension-decor" />
        <div className="pension-chance cadre"><Coeur /><div><strong>{nombre(pension.chance * 100)} % par élimination</strong><p>{phrase}</p></div></div>
        <p className="pension-compteur cadre">Œufs · {pension.oeufs.length} / {pension.emplacements}</p>
        <div className="pension-acteurs">{Array.from({ length: 2 }, (_, i) => <div key={i} className={`pension-acteur pension-acteur-${i}`}>
          {pension.parents[i] ? <Image src={spriteAffiche(pension.parents[i])} genre="sprite" alt="" className={`${i ? 'pension-miroir' : ''} ${pension.parents[i].shiny ? 'halo-shiny' : ''} ${classeSprite(pension.parents[i])}`} /> : <button aria-label="Déposer un parent" className="pension-place-decor" onClick={e => ouvrir(e.currentTarget)}>+</button>}
        </div>)}{pension.chance > 0 && <span className="pension-coeurs"><Coeur /></span>}</div>
        <div className="pension-reperes" aria-hidden="true">{Array.from({ length: pension.emplacementsMax }, (_, i) => <span className="cadre" key={i}>{pension.oeufs[i] ? 'Œuf' : i < pension.emplacements ? 'Libre' : 'Fermé'} · {i + 1}</span>)}</div>
      </div>
      <div className="pension-sous-scene">
        <section ref={parents} aria-label="Parents" className="pension-parents"><h2>Les parents</h2><div className="pension-duo">{Array.from({ length: 2 }, (_, i) => {
          const parent = pension.parents[i];
          return <article className="cadre pension-parent" key={i}>{parent ? <Portrait pokemon={parent} /> : <><span className="pension-place">+</span><p>Place libre</p></>}
            <button className="plaque" data-uid={parent?.uid} onClick={e => parent ? retirer(parent) : ouvrir(e.currentTarget)}>{parent ? `Retirer ${nomAffiche(parent)}` : 'Déposer un parent'}</button></article>;
        })}</div></section>
        <section aria-label="Œufs" className="pension-oeufs"><h2>Les œufs · {pension.oeufs.length} / {pension.emplacements}</h2>
          <p>Espèce inconnue jusqu’à l’éclosion. Prends un œuf, puis remporte {reglages.pension.pasEclosion} combats avec lui dans ton équipe.</p>
          <div role="group" aria-label="Emplacements des œufs"><ul className="pension-fentes">{Array.from({ length: pension.emplacementsMax }, (_, i) => {
            const oeuf = pension.oeufs[i], ouvert = i < pension.emplacements;
            const raison = i > pension.emplacements ? 'Ouvre d’abord l’emplacement précédent.' : pension.prochainEmplacement?.raison;
            return <li className="cadre pension-fente" key={i}><h3>Emplacement {i + 1}</h3>{oeuf ? <>
              <Portrait pokemon={oeuf} /><button className="plaque" onClick={() => agir(() => store.getState().prendreOeuf(oeuf.uid), `L’œuf rejoint ${destination}.`)}>Prendre l’œuf</button><p>Destination : {destination}.</p>
            </> : ouvert ? <><span className="pension-place">+</span><p>Nid libre</p><p>Le prochain œuf trouvera sa place ici.</p></> : <><p>Emplacement fermé</p>
              <button className="plaque" disabled={i !== pension.emplacements || !!raison} onClick={() => agir(() => store.getState().acheterEmplacementOeuf(), 'Emplacement ouvert. Tu peux accueillir un œuf de plus.')}>
                Ouvrir · {nombre(i === pension.emplacements ? pension.prochainEmplacement!.prix : i * reglages.pension.prixParEmplacement)}{'\u00a0₽'}</button>{raison && <p>{raison}</p>}</>}</li>;
          })}</ul></div>
        </section>
      </div>
      </div><CollectionEclosions store={store} />
    </>}
    <p role={choix ? undefined : 'status'} className="cadre pension-statut">{pension.acces.ouvert ? message : pension.acces.raison}</p>
    {choix && <dialog ref={dialogue} className="pension-choix" aria-labelledby="titre-choix-parent" onClose={() => choisir(false)} onCancel={e => { e.preventDefault(); fermer(); }}>
      <div className="pension-choix-corps"><header className="pension-entete"><h2 id="titre-choix-parent">Choisir un parent</h2><button className="plaque" onClick={fermer}>Annuler</button></header>
        <p>{premier ? <>Parent 2 sur 2. Il part avec <b>{nomAffiche(premier)}</b>, {sexe(premier).toLowerCase()} · niveau {premier.niveau}. Chaque ligne montre la chance de ponte du couple.</> : 'Parent 1 sur 2. Dépose un premier parent : la chance de ponte s’affichera avec le second.'}</p>
        <p role="status">{message}</p>
        <label htmlFor="recherche-parent">Nom ou numéro</label><input ref={champ} id="recherche-parent" type="search" value={recherche} onChange={e => rechercher(e.target.value)} />
        <p className="pension-detail">{nombre(chances.memeEspece * 100)} % : même espèce de sexes opposés · {nombre(chances.metamorph * 100)} % : avec Métamorph · {nombre(chances.typePartage * 100)} % : un type en commun · 0 % sinon.</p>
        {([['Équipe', equipe.flatMap(m => m ? [m.pokemon] : [])], ['PC', pc]] as const).map(([nom, liste]) => <section key={nom} aria-label={nom}>
          <h3>{nom} · {liste.length}</h3><ul className="pension-candidats">{trierPc(filtrerPc([...liste], recherche, nomAffiche), 'numero', nomAffiche).map(p => {
            const compat = premier ? couplePonte([premier, p]) : null;
            return <li key={p.uid}><button aria-label={`Déposer ${nomAffiche(p)}`} className="plaque pension-candidat" onClick={() => {
              if (agir(() => store.getState().deposerParent(p.uid), `${nomAffiche(p)} rejoint la pension.`)) { focusParent.current = p.uid; fermer(); }
            }}><Portrait pokemon={p} />{compat && <span className={`pension-compat ${compat.chance === maximum ? 'pension-compatible' : compat.chance > 0 ? 'pension-intermediaire' : ''}`}>{nombre(compat.chance * 100)} % · {raisons[compat.raison]}</span>}</button></li>;
          })}</ul>{!liste.length && <p>Aucun Pokémon.</p>}</section>)}
      </div>
    </dialog>}
  </section>;
}
