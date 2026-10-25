import { useMemo, useState } from 'react';
import { useStore } from 'zustand';
import { filtrerPc, trierPc, type TriPc } from '../core/pc';
import { chargerPokemon } from '../core/pokemon';
import type { PokemonPossede } from '../core/sauvegarde';
import { Image } from './Image';
import { cheminSprite } from './precharger';
import { storeJeu } from './store';

const catalogue = chargerPokemon();
const nomEspece = (pokemon: PokemonPossede) => catalogue.parNumero(pokemon.numero).nom;
const nomDe = (pokemon: PokemonPossede) => pokemon.surnom ?? nomEspece(pokemon);
const tris: [TriPc, string][] = [
  ['numero', 'Numéro'], ['nom', 'Nom'], ['niveau', 'Niveau'], ['favori', 'Favori'], ['shiny', 'Shiny'],
];

export function PagePC({ retour }: { retour(): void }) {
  const pc = useStore(storeJeu, etat => etat.pc);
  const accesPc = useStore(storeJeu, etat => etat.accesPc);
  const [tri, trier] = useState<TriPc>('numero');
  const [recherche, rechercher] = useState('');
  const liste = useMemo(() => trierPc(filtrerPc(pc, recherche, nomDe, nomEspece), tri, nomDe), [pc, tri, recherche]);
  const [choisi, choisir] = useState(() => liste[0]?.uid);
  const selection = liste.find(pokemon => pokemon.uid === choisi)?.uid ?? liste[0]?.uid;

  return <section className="mx-auto max-w-screen-xl text-base">
    <button type="button" className="mb-4 min-h-11 bg-surface-2 px-4 py-2 hover:bg-selection" onClick={retour}>Retour</button>
    <h1 tabIndex={-1} className="font-titre text-2xl font-semibold">PC de Léo</h1>
    {!accesPc.ouvert ? <p className="mt-4">{accesPc.raison}</p> : <>
      <p className="mt-2 text-region-accent">{pc.length} Pokémon</p>
      <div className="mt-4 grid min-w-0 gap-4">
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
        {pc.length === 0 ? <p>Ton PC est vide. Capture des Pokémon pour les ranger ici.</p>
          : liste.length === 0 ? <p role="status">Aucun Pokémon ne correspond à « {recherche} ».</p>
            : <ul className="grid min-w-0 grid-cols-[repeat(auto-fill,minmax(calc(var(--spacing)*36),1fr))] items-start gap-4">
              {liste.map(pokemon => {
                const nom = nomDe(pokemon);
                return <li key={pokemon.uid} className="min-w-0">
                  <button type="button" aria-label={`${nom}, niveau ${pokemon.niveau}`} aria-pressed={selection === pokemon.uid}
                    className={`cadre grid min-h-11 w-full justify-items-center gap-2 p-4 text-center hover:bg-selection ${selection === pokemon.uid ? 'bg-selection' : 'bg-surface'}`}
                    onClick={() => choisir(pokemon.uid)}>
                    <span className="relative isolate grid place-items-center">
                      <span aria-hidden="true" className="socle absolute bottom-2 -z-10 h-4 w-20 bg-region-socle" />
                      <Image src={cheminSprite(pokemon.numero)} genre="sprite" alt="" className="size-24 max-w-none" />
                    </span>
                    <strong className="flex max-w-full flex-wrap items-center justify-center gap-2 break-words">
                      <span className="min-w-0">{nom}</span>
                      {(pokemon.sexe === 'femelle' || pokemon.sexe === 'male') && <span role="img"
                        aria-label={pokemon.sexe === 'femelle' ? 'Femelle' : 'Mâle'}
                        className={pokemon.sexe === 'femelle' ? 'text-erreur-base' : 'text-info-base'}>{pokemon.sexe === 'femelle' ? '♀' : '♂'}</span>}
                      {pokemon.favori && <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="size-5 shrink-0 fill-current text-lien">
                        <path d="m12 2 3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1z" />
                      </svg>}
                      {pokemon.shiny && <>
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="size-5 shrink-0 fill-current text-alerte-base">
                          <path d="m12 1 3 8 8 3-8 3-3 8-3-8-8-3 8-3z" />
                        </svg>
                        <span className="sr-only">Shiny</span>
                      </>}
                    </strong>
                    <span>N° {pokemon.numero} · Niveau {pokemon.niveau}</span>
                  </button>
                </li>;
              })}
            </ul>}
      </div>
    </>}
  </section>;
}
