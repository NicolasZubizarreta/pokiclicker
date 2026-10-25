import { useEffect, useId, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { chargerPokemon } from '../core/pokemon';
import { pokedexDeKanto } from '../core/pokedex';
import { PagePC } from './PagePC';
import { Pokedex } from './Pokedex';
import { storeJeu } from './store';

const catalogue = chargerPokemon();

export function PagePlus() {
  const [sousPage, choisir] = useState<null | 'pc' | 'pokedex'>(null);
  const accesPc = useStore(storeJeu, etat => etat.accesPc);
  const pokedex = useStore(storeJeu, etat => etat.pokedex);
  const { nombre, total } = pokedexDeKanto(pokedex, catalogue);
  const conteneur = useRef<HTMLDivElement>(null);
  const raisonId = useId();

  useEffect(() => {
    conteneur.current?.querySelector('h1')?.focus();
  }, [sousPage]);

  return <div ref={conteneur}>
    {sousPage === 'pc' ? <PagePC retour={() => choisir(null)} />
      : sousPage === 'pokedex' ? <Pokedex retour={() => choisir(null)} />
        : <section className="mx-auto max-w-screen-xl text-base">
          <h1 tabIndex={-1} className="font-titre text-2xl font-semibold">Plus</h1>
          <ul className="mt-4 grid gap-4">
            <li>
              <button type="button" disabled={!accesPc.ouvert} aria-describedby={!accesPc.ouvert ? raisonId : undefined}
                className="cadre min-h-11 w-full bg-surface p-4 text-left enabled:hover:bg-selection disabled:text-texte-doux"
                onClick={() => choisir('pc')}>PC de Léo</button>
              {!accesPc.ouvert && <p id={raisonId} className="mt-2 text-texte-doux">{accesPc.raison}</p>}
            </li>
            <li>
              <button type="button" className="cadre flex min-h-11 w-full flex-wrap items-center justify-between gap-2 bg-surface p-4 text-left hover:bg-selection"
                onClick={() => choisir('pokedex')}>
                <span>Pokédex</span>{' '}
                <span className="text-region-accent">{`${nombre} / ${total}`}</span>
              </button>
            </li>
          </ul>
        </section>}
  </div>;
}
