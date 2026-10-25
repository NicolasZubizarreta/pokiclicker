import { useEffect, useId, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { BoiteBadges } from './BoiteBadges';
import { formaterDps } from './nombres';
import { PagePC } from './PagePC';
import { Pokedex } from './Pokedex';
import { storeJeu } from './store';
import { formaterProchainPalier } from './store-progression';

export function PagePlus() {
  const [sousPage, choisir] = useState<null | 'pc' | 'pokedex' | 'badges'>(null);
  const accesPc = useStore(storeJeu, etat => etat.accesPc);
  const progression = useStore(storeJeu, etat => etat.progression);
  const lieu = useStore(storeJeu, etat => etat.lieu);
  const dps = useStore(storeJeu, etat => etat.dps);
  const { nombre, total } = progression.pokedex;
  const conteneur = useRef<HTMLDivElement>(null);
  const raisonId = useId();
  const aventureId = useId();
  const pokedexId = useId();
  const compteurId = useId();

  const monte = useRef(false);
  const entree = useRef<'pc' | 'pokedex' | 'badges'>('pc');
  useEffect(() => {
    // Pas de déplacement du focus au premier rendu : seul le changement de sous-page compte.
    if (!monte.current) { monte.current = true; return; }
    const conteneurPage = conteneur.current;
    if (sousPage === null) conteneurPage?.querySelector<HTMLElement>(`[data-entree="${entree.current}"]`)?.focus();
    else conteneurPage?.querySelector('h1')?.focus();
  }, [sousPage]);

  return <div ref={conteneur}>
    {sousPage === 'pc' ? <PagePC retour={() => choisir(null)} />
      : sousPage === 'pokedex' ? <Pokedex retour={() => choisir(null)} />
        : sousPage === 'badges' ? <section className="mx-auto max-w-screen-xl space-y-4 text-base">
          <button type="button" onClick={() => choisir(null)}
            className="min-h-11 bg-surface-2 px-4 py-2 hover:bg-selection">Retour</button>
          <h1 tabIndex={-1} className="font-titre text-2xl font-semibold">Badges</h1>
          <BoiteBadges badges={progression.badges} />
        </section>
        : <section className="mx-auto max-w-screen-xl text-base">
          <h1 tabIndex={-1} className="font-titre text-2xl font-semibold">Plus</h1>
          <section aria-labelledby={aventureId} className="cadre mt-4 space-y-4 bg-surface p-4">
            <h2 id={aventureId} className="font-titre text-xl font-semibold">Ton aventure</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div><dt className="text-texte-doux">Région</dt><dd>{lieu ? `Kanto · ${lieu.nom}` : 'Kanto'}</dd></div>
              <div><dt className="text-texte-doux">Pokédex</dt><dd>{`${nombre} / ${total}`}</dd></div>
              <div><dt className="text-texte-doux">Badges</dt><dd>{`${progression.obtenus} / ${progression.total}`}</dd></div>
              <div><dt className="text-texte-doux">DPS</dt><dd>{formaterDps(dps)}</dd></div>
            </dl>
          </section>
          <ul className="mt-4 grid gap-4">
            <li>
              <button type="button" disabled={!accesPc.ouvert} aria-describedby={!accesPc.ouvert ? raisonId : undefined}
                className="cadre min-h-11 w-full bg-surface p-4 text-left enabled:hover:bg-selection disabled:text-texte-doux"
                data-entree="pc" onClick={() => { entree.current = 'pc'; choisir('pc'); }}>PC de Léo</button>
              {!accesPc.ouvert && <p id={raisonId} className="mt-2 text-texte-doux">{accesPc.raison}</p>}
            </li>
            <li>
              <button type="button" className="cadre flex min-h-11 w-full flex-wrap items-center justify-between gap-2 bg-surface p-4 text-left hover:bg-selection"
                aria-labelledby={`${pokedexId} ${compteurId}`}
                data-entree="pokedex" onClick={() => { entree.current = 'pokedex'; choisir('pokedex'); }}>
                <span id={pokedexId}>Pokédex</span>{' '}
                <span id={compteurId} className="text-region-accent">{`${nombre} / ${total}`}</span>
                <span data-prochain-palier className="w-full text-texte-doux">{formaterProchainPalier(progression.prochain)}</span>
              </button>
            </li>
            <li>
              <button type="button" className="cadre min-h-11 w-full bg-surface p-4 text-left hover:bg-selection"
                data-entree="badges" onClick={() => { entree.current = 'badges'; choisir('badges'); }}>Badges</button>
            </li>
          </ul>
        </section>}
  </div>;
}
