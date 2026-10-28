import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { filtrerPc, trierPc, type TriPc } from '../core/pc';
import { chargerPokemon } from '../core/pokemon';
import type { PokemonPossede } from '../core/sauvegarde';
import { calculerMaxXp } from '../core/recompenses';
import { BarreXp } from './BarreXp';
import { dpsSansType } from './dps-pc';
import { FichePokemon } from './FichePokemon';
import { Image } from './Image';
import { formaterDps } from './nombres';
import { classeSprite, nomAffiche as nomDe, progressionOeuf, spriteAffiche } from './affichage-pokemon';
import { IconeShiny } from './IconeShiny';
import { storeJeu } from './store';

const catalogue = chargerPokemon();
const nomEspece = (pokemon: PokemonPossede) => pokemon.oeuf ? nomDe(pokemon) : catalogue.parNumero(pokemon.numero).nom;
const tris: [TriPc, string][] = [
  ['numero', 'Numéro'], ['nom', 'Nom'], ['niveau', 'Niveau'], ['favori', 'Favori'], ['shiny', 'Shiny'],
];

export function PagePC({ retour }: { retour?(): void }) {
  const pc = useStore(storeJeu, etat => etat.pc);
  const accesPc = useStore(storeJeu, etat => etat.accesPc);
  const equipe = useStore(storeJeu, etat => etat.equipe);
  const echange = useStore(storeJeu, etat => etat.echange);
  const [fiche, ouvrir] = useState<string | null>(null);
  const [ouvert, afficher] = useState(false);
  const [erreur, signaler] = useState<{ message: string; echange: typeof echange } | null>(null);
  const declencheur = useRef<HTMLButtonElement>(null);
  const panneau = useRef<HTMLElement>(null);
  const [tri, trier] = useState<TriPc>('numero');
  const [recherche, rechercher] = useState('');
  const liste = useMemo(() => trierPc(filtrerPc(pc, recherche, nomDe, nomEspece), tri, nomDe), [pc, tri, recherche]);
  const [choisi, choisir] = useState(() => liste[0]?.uid);
  const selection = liste.find(pokemon => pokemon.uid === choisi)?.uid ?? liste[0]?.uid;
  const pokemon = liste.find(p => p.uid === selection);

  useEffect(() => () => storeJeu.getState().annulerEchange(), []);

  // Le mode échange déplace le focus sur « Annuler », puis le rend à l'action ou au titre.
  const annuler = useRef<HTMLButtonElement>(null);
  const placer = useRef<HTMLButtonElement>(null);
  const titre = useRef<HTMLHeadingElement>(null);
  const echangeAvant = useRef(echange);
  useEffect(() => {
    if (echange && !echangeAvant.current) annuler.current?.focus();
    if (!echange && echangeAvant.current) {
      const cible = panneau.current?.getClientRects().length ? placer.current : null;
      (cible ?? titre.current)?.focus();
    }
    echangeAvant.current = echange;
  }, [echange]);

  function ouvrirFiche(uid: string, bouton: HTMLButtonElement) {
    declencheur.current = bouton;
    ouvrir(uid);
    afficher(true);
  }

  function places(mobile: boolean) {
    return Array.from({ length: 6 }, (_, index) => {
      const membre = equipe[index];
      const classe = mobile ? 'size-14 shrink-0 border border-bordure bg-surface' : 'flex min-h-14 w-full items-center gap-2 bg-surface-2 text-left';
      if (!membre) return <div key={index} className={classe}>
        <span className={mobile ? 'sr-only' : 'p-2 text-texte-doux'}>Emplacement libre</span>
      </div>;
      const { pokemon, dps } = membre;
      const nom = nomDe(pokemon);
      const contenu = <>
        <Image src={spriteAffiche(pokemon)} genre="sprite" alt="" className={`size-14 shrink-0 ${pokemon.shiny && !pokemon.oeuf ? 'halo-shiny' : ''} ${classeSprite(pokemon)}`} />
        <span className={mobile ? 'sr-only' : 'grid min-w-0 gap-1 break-words'}>
          <strong>{nom}{pokemon.shiny && !pokemon.oeuf && <IconeShiny />}</strong><span>{pokemon.oeuf ? progressionOeuf(pokemon.oeuf) : `Niv. ${pokemon.niveau}`}</span><span>{formaterDps(dps)} DPS</span>
        </span>
      </>;
      return echange ? <button key={index} type="button" aria-label={pokemon.oeuf ? `${nom}, ${progressionOeuf(pokemon.oeuf)}` : `${nom}, niveau ${pokemon.niveau}`}
        className={`${classe} hover:bg-selection`} onClick={() => {
          const message = storeJeu.getState().echanger(echange.uid, pokemon.uid);
          signaler(message ? { message, echange } : null);
        }}>{contenu}</button> : <div key={index} className={classe}>{contenu}</div>;
    });
  }

  return <section className="mx-auto max-w-screen-xl text-base">
    {retour && <button type="button" className="mb-4 min-h-11 bg-surface-2 px-4 py-2 hover:bg-selection" onClick={retour}>Retour</button>}
    <h1 ref={titre} tabIndex={-1} className="font-titre text-2xl font-semibold">PC de Léo</h1>
    {!accesPc.ouvert ? <p className="mt-4">{accesPc.raison}</p> : <>
      <p className="mt-2 text-region-accent">{pc.length} Pokémon</p>
      {echange && <div role="status" className="cadre mt-4 flex flex-wrap items-center gap-4 bg-surface p-4">
        <p>Choisis le Pokémon à remplacer par {echange.nom}</p>
        <button ref={annuler} type="button" className="min-h-11 bg-surface-2 px-4 py-2" onClick={() => {
          storeJeu.getState().annulerEchange();
          signaler(null);
        }}>Annuler</button>
      </div>}
      {erreur && erreur.echange === echange && <p role="alert" className="mt-4 text-erreur-base">{erreur.message}</p>}
      <div className="mt-4 grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="grid min-w-0 gap-4">
        <div role="group" aria-label="Trie les Pokémon" className="flex flex-wrap items-center gap-2">
          <span>Trie par :</span>
          {tris.map(([valeur, texte]) => <button key={valeur} type="button" aria-pressed={tri === valeur}
            className={`min-h-11 px-4 py-2 hover:bg-selection ${tri === valeur ? 'bg-selection' : 'bg-surface-2'}`}
            onClick={() => trier(valeur)}>{texte}</button>)}
        </div>
        <div className="grid min-w-0 gap-2">
          <label htmlFor="recherche-pc">Nom ou numéro</label>
          <input id="recherche-pc" type="search" value={recherche} onChange={event => rechercher(event.target.value)}
            className="min-h-11 min-w-0 w-full border border-bordure bg-surface px-4 py-2 text-texte" />
        </div>
        <div role="group" aria-label="Équipe mobile" className="flex min-w-0 gap-1 overflow-x-auto overscroll-contain lg:hidden">{places(true)}</div>
        {pc.length === 0 ? <p>Ton PC est vide. Capture des Pokémon pour les ranger ici.</p>
          : liste.length === 0 ? <p role="status">Aucun Pokémon ne correspond à « {recherche} ».</p>
            : <ul className="grid min-w-0 grid-cols-[repeat(auto-fill,minmax(calc(var(--spacing)*36),1fr))] items-start gap-4">
              {liste.map(pokemon => {
                const nom = nomDe(pokemon);
                return <li key={pokemon.uid} className="min-w-0">
                  <button type="button" aria-label={pokemon.oeuf ? `${nom}, ${progressionOeuf(pokemon.oeuf)}` : `${nom}, niveau ${pokemon.niveau}`} aria-pressed={selection === pokemon.uid}
                    className={`cadre grid min-h-11 w-full justify-items-center gap-2 p-4 text-center hover:bg-selection ${selection === pokemon.uid ? 'bg-selection' : 'bg-surface'}`}
                    onClick={event => {
                      choisir(pokemon.uid);
                      if (!panneau.current?.getClientRects().length) ouvrirFiche(pokemon.uid, event.currentTarget);
                    }}>
                    <span className="relative isolate grid place-items-center">
                      <span aria-hidden="true" className="socle absolute bottom-2 -z-10 h-4 w-20 bg-region-socle" />
                      <Image src={spriteAffiche(pokemon)} genre="sprite" alt="" className={`size-24 max-w-none ${pokemon.shiny && !pokemon.oeuf ? 'halo-shiny' : ''} ${classeSprite(pokemon)}`} />
                    </span>
                    <strong className="flex max-w-full flex-wrap items-center justify-center gap-2 break-words">
                      <span className="min-w-0">{nom}</span>{pokemon.shiny && !pokemon.oeuf && <IconeShiny />}
                      {(pokemon.sexe === 'femelle' || pokemon.sexe === 'male') && <span role="img"
                        aria-label={pokemon.sexe === 'femelle' ? 'Femelle' : 'Mâle'}
                        className={pokemon.sexe === 'femelle' ? 'text-erreur-base' : 'text-info-base'}>{pokemon.sexe === 'femelle' ? '♀' : '♂'}</span>}
                      {pokemon.favori && <><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="size-5 shrink-0 fill-current text-lien">
                        <path d="m12 2 3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1z" />
                      </svg><span className="sr-only">Favori</span></>}
                      {pokemon.shiny && !pokemon.oeuf && <span className="sr-only">Shiny</span>}
                    </strong>
                    <span>{pokemon.oeuf ? progressionOeuf(pokemon.oeuf) : `N° ${pokemon.numero} · Niveau ${pokemon.niveau}`}</span>
                  </button>
                </li>;
              })}
            </ul>}
      </div>
      <aside ref={panneau} className="pc-panneau cadre sticky top-8 hidden min-w-0 space-y-4 overflow-y-auto overscroll-contain bg-surface p-4 lg:block">
        <h2 className="font-titre text-xl font-semibold">Équipe · {equipe.filter(Boolean).length} / 6</h2>
        <div className="grid gap-2">{places(false)}</div>
        {pokemon ? <>
          <Image src={spriteAffiche(pokemon)} genre="sprite" alt="" className={`mx-auto size-24 max-w-full ${pokemon.shiny && !pokemon.oeuf ? 'halo-shiny' : ''} ${classeSprite(pokemon)}`} />
          <h2 className="break-words font-titre text-xl font-semibold">{nomDe(pokemon)}{pokemon.shiny && !pokemon.oeuf && <IconeShiny />}</h2>
          <p>{pokemon.oeuf ? progressionOeuf(pokemon.oeuf) : `N° ${pokemon.numero} · Niveau ${pokemon.niveau}`}</p>
          <p className="text-region-accent">{formaterDps(dpsSansType(pokemon))} DPS</p>
          {!pokemon.oeuf && <BarreXp xp={pokemon.xp} maximum={calculerMaxXp(pokemon.numero, pokemon.niveau)} nom={nomDe(pokemon)} />}
          <button type="button" aria-pressed={pokemon.favori} className="min-h-11 bg-surface-2 px-4 py-2 hover:bg-selection"
            onClick={() => {
              const message = storeJeu.getState().basculerFavori(pokemon.uid);
              signaler(message ? { message, echange } : null);
            }}>{pokemon.favori ? 'Retire des favoris' : 'Ajoute aux favoris'}</button>
        </> : <h2 className="font-titre text-xl font-semibold">Aucune sélection</h2>}
        {!ouvert && <button ref={placer} type="button" disabled={!pokemon}
          className="min-h-11 bg-action px-4 py-2 text-action-texte hover:bg-action-survol disabled:text-texte-doux"
          onClick={() => {
            if (!pokemon) return;
            const message = storeJeu.getState().placerDansEquipe(pokemon.uid);
            signaler(message ? { message, echange } : null);
          }}>Placer dans l'équipe</button>}
        {pokemon && <button type="button" className="min-h-11 bg-surface-2 px-4 py-2 text-lien hover:bg-selection"
          onClick={event => ouvrirFiche(pokemon.uid, event.currentTarget)}>Ouvre la fiche</button>}
      </aside>
      </div>
    </>}
    {fiche !== null && <FichePokemon uid={fiche} ouvert={ouvert} fermer={() => afficher(false)} declencheur={declencheur} />}
  </section>;
}
