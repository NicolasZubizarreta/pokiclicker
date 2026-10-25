import { useEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { chargerPokemon } from '../core/pokemon';
import { reglages } from '../core/reglages';
import { BarreXp } from './BarreXp';
import { FichePokemon } from './FichePokemon';
import { Image } from './Image';
import { formaterDps } from './nombres';
import { cheminSprite } from './precharger';
import { storeJeu } from './store';

const catalogue = chargerPokemon();

export function PageEquipe() {
  const equipe = useStore(storeJeu, etat => etat.equipe);
  const dps = useStore(storeJeu, etat => etat.dps);
  const echange = useStore(storeJeu, etat => etat.echange);
  const [choisi, choisir] = useState(() => equipe.find(c => c)?.pokemon.uid);
  const [fiche, ouvrir] = useState<string | null>(null);
  const [ouvert, afficher] = useState(false);
  const [erreur, signaler] = useState<{ echange: typeof echange; message: string } | null>(null);
  const declencheur = useRef<HTMLButtonElement>(null);
  const panneau = useRef<HTMLElement>(null);
  const membre = equipe.find(c => c?.pokemon.uid === choisi) ?? equipe.find(c => c);
  const nom = membre ? membre.pokemon.surnom ?? catalogue.parNumero(membre.pokemon.numero).nom : '';

  useEffect(() => () => storeJeu.getState().annulerEchange(), []);

  function ouvrirFiche(uid: string, bouton: HTMLButtonElement) {
    declencheur.current = bouton;
    ouvrir(uid);
    afficher(true);
  }

  return <section className="mx-auto max-w-screen-xl text-base">
    <h1 className="font-titre text-2xl font-semibold">Ton équipe</h1>
    <p className="mt-2 text-region-accent">{`${formaterDps(dps)} DPS · ${equipe.filter(Boolean).length} / ${reglages.equipe.taille}`}</p>
    {echange && <div role="status" className="cadre mt-4 flex flex-wrap items-center gap-4 bg-surface p-4">
      <p>Choisis le Pokémon à remplacer par {echange.nom}</p>
      <button type="button" className="min-h-11 bg-surface-2 px-4 py-2"
        onClick={() => storeJeu.getState().annulerEchange()}>Annuler</button>
    </div>}
    {echange && erreur?.echange === echange && <p role="alert" className="mt-4 text-erreur-base">{erreur.message}</p>}
    <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <ul className="grid min-w-0 gap-4">
        {Array.from({ length: reglages.equipe.taille }, (_, index) => {
          const caseEquipe = equipe[index];
          if (!caseEquipe) return <li key={index} className="cadre min-h-11 bg-surface p-4 text-texte-doux">Emplacement libre</li>;
          const { pokemon, dps, xpMax } = caseEquipe;
          const nom = pokemon.surnom ?? catalogue.parNumero(pokemon.numero).nom;
          return <li key={pokemon.uid} className="min-w-0">
            <button type="button" aria-label={`${nom}, niveau ${pokemon.niveau}`} aria-pressed={membre?.pokemon.uid === pokemon.uid}
              className={`cadre grid min-h-11 w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-2 p-4 text-left hover:bg-selection ${membre?.pokemon.uid === pokemon.uid ? 'bg-selection' : 'bg-surface'}`}
              onClick={event => {
                if (echange) {
                  const message = storeJeu.getState().echanger(echange.uid, pokemon.uid);
                  signaler(message ? { echange, message } : null);
                  return;
                }
                choisir(pokemon.uid);
                if (!panneau.current?.getClientRects().length) ouvrirFiche(pokemon.uid, event.currentTarget);
              }}>
              <Image src={cheminSprite(pokemon.numero)} genre="sprite" alt="" className="size-24 max-w-none" />
              <span className="grid min-w-0 gap-2">
                <strong className="flex items-center gap-2 break-words">{nom}{pokemon.favori &&
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="size-5 shrink-0 fill-current text-lien">
                    <path d="m12 2 3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1z" />
                  </svg>}</strong>
                <span>Niv. {pokemon.niveau}</span>
                <BarreXp xp={pokemon.xp} maximum={xpMax} nom={nom} />
                <span className="text-region-accent">{formaterDps(dps)} DPS</span>
              </span>
            </button>
          </li>;
        })}
      </ul>
      {membre && <aside ref={panneau} className="cadre sticky top-8 hidden min-w-0 space-y-4 bg-surface p-4 lg:block">
        <div className="relative isolate grid place-items-center">
          <span className="socle absolute bottom-6 -z-10 h-8 w-40 bg-region-socle" aria-hidden="true" />
          <Image src={cheminSprite(membre.pokemon.numero)} genre="sprite" alt="" className="size-48 max-w-full" />
        </div>
        <h2 className="break-words font-titre text-xl font-semibold">{nom}</h2>
        <p>Niv. {membre.pokemon.niveau}</p>
        <BarreXp xp={membre.pokemon.xp} maximum={membre.xpMax} nom={nom} />
        <p>{membre.xpMax === 0 ? 'MAX' : `${membre.pokemon.xp} / ${membre.xpMax} XP`}</p>
        <p className="text-region-accent">{formaterDps(membre.dps)} DPS</p>
        {!echange && <button type="button" className="min-h-11 bg-action px-4 py-2 text-action-texte hover:bg-action-survol"
          onClick={event => ouvrirFiche(membre.pokemon.uid, event.currentTarget)}>Ouvre la fiche</button>}
      </aside>}
    </div>
    {fiche !== null && <FichePokemon uid={fiche} ouvert={ouvert} fermer={() => afficher(false)} declencheur={declencheur} />}
  </section>;
}
