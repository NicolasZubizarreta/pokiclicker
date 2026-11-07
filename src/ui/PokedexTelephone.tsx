import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from 'zustand';
import { chargerPokemon, nomType } from '../core/pokemon';
import { reglages } from '../core/reglages';
import { statsDeCombat } from '../core/stats';
import { pokedexDeKanto } from '../core/pokedex';
import { storeJeu } from './store';
import { formaterProchainPalier } from './store-progression';
import { IconeRetour, IconeChevron } from './icones-menu';
import { IconeCadenas, PastilleCapture } from './icones';
import { Image } from './Image';
import { cheminSprite } from './precharger';
import './FichePokemon.css';

const catalogue = chargerPokemon();
const normaliser = (texte: string) => texte.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();

export function PokedexTelephone({ retour, ouvrirDiplome }: { retour(): void; ouvrirDiplome?: () => void }) {
  const pokedex = useStore(storeJeu, e => e.pokedex);
  const { prochain, paliers } = useStore(storeJeu, e => e.progression);
  const { captures, nombre, total } = pokedexDeKanto(pokedex, catalogue);
  const [selection, choisir] = useState<number | null>(null);
  const [saisie, saisir] = useState('');
  const [filtre, filtrer] = useState('Toutes');
  const rechercheId = useId();
  const recherche = normaliser(saisie);
  const numeroRecherche = /^(?:#|n°|n)?\s*(\d+)$/.exec(recherche);
  const numeros = Array.from({ length: total }, (_, i) => i + 1).filter(numero => {
    const capture = captures.has(numero);
    if (filtre === 'Capturées' && !capture || filtre === 'À trouver' && capture) return false;
    if (!recherche) return true;
    return numeroRecherche ? numero === Number(numeroRecherche[1])
      : capture && normaliser(catalogue.parNumero(numero).nom).includes(recherche);
  });
  const progres = { '--progres': `${nombre / total * 100}%` } as CSSProperties;

  return <section className="mx-auto max-w-screen-xl space-y-4 text-base">
    <header className="flex items-center gap-2">
      <button type="button" aria-label="Retour au menu" onClick={retour}
        className="flex min-h-11 min-w-11 items-center justify-center bg-surface-2 hover:bg-selection"><IconeRetour /></button>
      <h1 tabIndex={-1} className="font-titre text-2xl font-semibold">Pokédex</h1>
    </header>
    <section aria-label="Progression" className="cadre grid gap-2 bg-surface p-4">
      <p className="font-titre text-3xl font-bold text-region-accent">{nombre} / {total}</p>
      <p className="text-texte-doux">espèces capturées</p>
      <div role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={nombre}
        aria-label="Espèces capturées" className="h-3 cadre bg-fond">
        <div className="h-full w-(--progres) bg-action" style={progres} />
      </div>
      <p data-prochain-palier>{formaterProchainPalier(prochain)}</p>
    </section>
    <details className="group cadre bg-surface">
      <summary className="flex min-h-11 cursor-pointer items-center gap-2 px-3 py-2 font-bold">
        Paliers du Pokédex · {paliers.filter(p => p.recu).length} sur {paliers.length} reçus
        <span className="ml-auto group-open:rotate-90"><IconeChevron /></span>
      </summary>
      <ul className="space-y-3 p-3">
        {paliers.map(({ palier, titre, description, recu }) => <li key={palier} className="flex items-center gap-3">
          {recu ? <span className="text-succes-texte">✓</span> : <IconeCadenas />}
          <div><p className="font-bold">{palier} · {titre}</p>
            <p className="text-sm text-texte-doux">{description} · {recu ? 'reçu' : 'à venir'}</p></div>
        </li>)}
      </ul>
    </details>
    {ouvrirDiplome && <button type="button" onClick={ouvrirDiplome}
      className="cadre flex min-h-11 w-full items-center gap-3 bg-surface p-4 text-left hover:bg-selection">
      <span className="flex-1"><span className="block font-bold">Diplôme du Pokédex</span>
        <span className="block text-sm text-texte-doux">Remis par le Prof. Chen</span></span>
      <IconeChevron />
    </button>}
    <div className="space-y-2">
      <label htmlFor={rechercheId}>Nom ou numéro</label>
      <input id={rechercheId} type="search" autoComplete="off" enterKeyHint="search" value={saisie}
        onChange={e => saisir(e.target.value)} className="cadre min-h-11 w-full bg-surface px-3 text-texte" />
    </div>
    <div role="group" aria-label="Filtrer le Pokédex" className="flex gap-2">
      {['Toutes', 'Capturées', 'À trouver'].map(valeur => <button key={valeur} type="button"
        aria-pressed={filtre === valeur} onClick={() => filtrer(valeur)}
        className="flex-1 cadre min-h-11 bg-surface aria-pressed:bg-selection">{valeur}</button>)}
    </div>
    <p role="status" className="text-texte-doux">{numeros.length} {numeros.length === 1 ? 'espèce affichée' : 'espèces affichées'}</p>
    {numeros.length === 0 && <div className="cadre border-dashed p-4 text-center">
      {recherche ? <><p>Aucune espèce capturée ne correspond à « {saisie} ».</p>
        <p className="text-texte-doux">Les espèces non capturées restent cachées : cherche-les par leur numéro.</p></>
        : <p>Rien à montrer avec ce filtre.</p>}
    </div>}
    <div className="grid grid-cols-3 gap-2">
      {numeros.map(numero => {
        const capture = captures.has(numero);
        const nom = capture ? catalogue.parNumero(numero).nom : '???';
        return <button key={numero} type="button" onClick={() => choisir(numero)}
          aria-label={capture ? `${nom}, numéro ${numero}, déjà capturé` : `Pokémon inconnu, numéro ${numero}`}
          className={`cadre flex min-h-11 min-w-0 flex-col items-center overflow-hidden p-2 text-center ${capture ? 'bg-surface' : 'bg-surface-2'}`}>
          <Image src={cheminSprite(numero)} genre="sprite" alt={capture ? nom : 'Pokémon inconnu'}
            className={`size-16 max-w-full ${capture ? '' : 'brightness-0 opacity-50'}`} />
          <span className="text-sm text-texte-doux">N° {numero}</span>
          <span className="w-full truncate font-bold">{nom}</span>
          {capture && <span className="flex items-center gap-1 text-sm text-succes-texte"><PastilleCapture />Capturé</span>}
        </button>;
      })}
    </div>
    {selection !== null && <DetailEspece numero={selection} capture={captures.has(selection)} fermer={() => choisir(null)} />}
  </section>;
}

function DetailEspece({ numero, capture, fermer }: { numero: number; capture: boolean; fermer(): void }) {
  const equipe = useStore(storeJeu, e => e.equipe);
  const pc = useStore(storeJeu, e => e.pc);
  const dialogue = useRef<HTMLDialogElement>(null);
  const titre = useId();
  const espece = catalogue.parNumero(numero);
  const nom = capture ? espece.nom : '???';
  useEffect(() => {
    const origine = document.activeElement;
    const fenetre = dialogue.current!;
    fenetre.showModal();
    fenetre.querySelector('button')?.focus();
    return () => {
      fenetre.close();
      if (origine instanceof HTMLElement && origine.isConnected) origine.focus();
    };
  }, []);

  return createPortal(<dialog ref={dialogue} aria-labelledby={titre}
    className="guide-fenetre cadre w-full max-w-3xl bg-surface p-0 text-base text-texte"
    onCancel={event => { event.preventDefault(); fermer(); }}
    onPointerDown={event => { if (event.target === event.currentTarget) fermer(); }}>
    <header className="flex items-center justify-between gap-4 p-4">
      <h2 id={titre} className="font-titre text-xl font-semibold">{nom} · N° {numero}</h2>
      <button type="button" onClick={fermer} aria-label="Fermer la fiche du Pokédex"
        className="min-h-11 min-w-11 bg-surface-2 text-xl hover:bg-selection">×</button>
    </header>
    <div className="fiche-contenu grid min-w-0 gap-2 px-4 pb-4">
      <div className="mx-auto grid size-32 max-w-full place-items-center overflow-hidden">
        <Image src={cheminSprite(numero)} genre="sprite" alt={capture ? nom : 'Pokémon inconnu'}
          className={`size-32 max-h-full max-w-full ${capture ? '' : 'brightness-0 opacity-50'}`} />
      </div>
      {capture ? <>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {espece.types.map(type => <span key={type}
            className={`h-7 inline-flex items-center gap-1 px-2 font-bold pastille-type pastille-type-${type}`}>
            {nomType(type)}
          </span>)}
          <span className="cadre bg-surface-2 px-2 h-7 inline-flex items-center gap-1"><PastilleCapture />Déjà capturé</span>
        </div>
        <p className="text-center text-texte-doux">{equipe.some(caseEquipe => caseEquipe?.pokemon.numero === numero)
          ? 'Dans ton équipe' : pc.some(pokemon => pokemon.numero === numero) ? 'Rangé dans ton PC' : 'Enregistré au Pokédex'}</p>
        <dl aria-label="Dégâts de base" className="grid grid-cols-[1fr_auto] items-baseline gap-x-3 gap-y-1">
          <dt className="text-texte-doux">Dégâts de base</dt>
          <dd className="font-bold tabular-nums text-region-accent">{statsDeCombat(espece).puissance}</dd>
        </dl>
        <p className="text-center text-sm text-texte-doux">
          DPS = dégâts de base × niveau ÷ {reglages.degats.diviseurNiveau}, avant les bonus.
        </p>
      </> :<p role="status" className="cadre bg-surface-2 p-3">
        Capture ce Pokémon pour découvrir son nom et ses types.
      </p>}
    </div>
  </dialog>, document.body);
}
