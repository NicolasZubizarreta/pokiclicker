import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { useStore } from 'zustand';
import { BoiteBadges } from './BoiteBadges';
import { Diplome } from './Diplome';
import { creditPiste, musiques } from '../core/musiques';
import { musique } from './musique';
import { formaterDps } from './nombres';
import { Pokedex } from './Pokedex';
import { storeJeu } from './store';
import { formaterProchainPalier } from './store-progression';
import { volumes, type Canal } from './volumes';

function CurseurVolume({ canal, libelle }: { canal: Canal; libelle: string }) {
  const valeur = useSyncExternalStore(volumes.abonner, () => volumes.instantane()[canal]);
  return <label className="flex min-h-11 flex-wrap items-center justify-between gap-x-4 bg-surface-2 px-4 py-2">
    <span>{libelle}</span>
    <span className="flex w-full items-center gap-2 sm:w-auto">
      <input type="range" min={0} max={100} step={5} value={valeur} aria-valuetext={`${valeur} %`}
        onChange={evenement => volumes.definir(canal, Number(evenement.target.value))}
        className="min-h-11 flex-1 accent-region-accent sm:w-48 sm:flex-none" />
      <span className="w-12 text-right text-region-accent">{`${valeur} %`}</span>
    </span>
  </label>;
}

export function PagePlus() {
  const diplome = useStore(storeJeu, etat => etat.fin.diplome);
  const [diplomeOuvert, ouvrirDiplome] = useState(false);
  const [sousPage, choisir] = useState<null | 'pokedex' | 'badges'>(null);
  const progression = useStore(storeJeu, etat => etat.progression);
  const lieu = useStore(storeJeu, etat => etat.lieu);
  const dps = useStore(storeJeu, etat => etat.dps);
  const sonActive = useStore(storeJeu, etat => etat.sonActive);
  const musiqueActive = useSyncExternalStore(musique.abonner, musique.estActive);
  const reglagesId = useId();
  const { nombre, total } = progression.pokedex;
  const conteneur = useRef<HTMLDivElement>(null);
  const aventureId = useId();
  const pokedexId = useId();
  const compteurId = useId();

  const monte = useRef(false);
  const entree = useRef<'pokedex' | 'badges'>('pokedex');
  useEffect(() => {
    // Pas de déplacement du focus au premier rendu : seul le changement de sous-page compte.
    if (!monte.current) { monte.current = true; return; }
    const conteneurPage = conteneur.current;
    if (sousPage === null) conteneurPage?.querySelector<HTMLElement>(`[data-entree="${entree.current}"]`)?.focus();
    else conteneurPage?.querySelector('h1')?.focus();
  }, [sousPage]);

  return <div ref={conteneur}>
    {sousPage === 'pokedex' ? <Pokedex retour={() => choisir(null)} />
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
          {diplome && <button type="button" onClick={() => ouvrirDiplome(true)}
            className="cadre mt-4 min-h-11 w-full bg-surface p-4 text-left hover:bg-selection">Diplôme du Pokédex</button>}
          <section aria-labelledby={reglagesId} className="cadre mt-4 space-y-4 bg-surface p-4">
            <h2 id={reglagesId} className="font-titre text-xl font-semibold">Réglages</h2>
            <button type="button" role="switch" aria-checked={sonActive} onClick={() => storeJeu.getState().basculerSon()}
              className="flex min-h-11 w-full items-center justify-between gap-2 bg-surface-2 px-4 py-2 text-left hover:bg-selection">
              <span>Son</span><span className="text-region-accent">{sonActive ? 'Activé' : 'Coupé'}</span>
            </button>
            <button type="button" role="switch" aria-checked={musiqueActive} onClick={() => musique.basculer()}
              className="flex min-h-11 w-full items-center justify-between gap-2 bg-surface-2 px-4 py-2 text-left hover:bg-selection">
              <span>Musique</span><span className="text-region-accent">{musiqueActive ? 'Activée' : 'Coupée'}</span>
            </button>
            <CurseurVolume canal="effets" libelle="Volume des effets" />
            <CurseurVolume canal="musique" libelle="Volume de la musique" />
            <details className="bg-surface-2 px-4 py-2">
              <summary className="min-h-11 cursor-pointer py-2">Crédits des musiques</summary>
              <div className="space-y-2 pb-2">
                {Object.values(musiques.pistes).map(piste => <p key={piste.fichier}>{creditPiste(piste)}</p>)}
              </div>
            </details>
          </section>
        </section>}
    {diplomeOuvert && diplome && <Diplome diplome={diplome} fermer={() => ouvrirDiplome(false)} />}
  </div>;
}
