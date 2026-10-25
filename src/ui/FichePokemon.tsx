import { useEffect, useId, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useStore } from 'zustand';
import { detailDps, relacher as verifierRelachement } from '../core/equipe';
import { chargerPokemon, nomType } from '../core/pokemon';
import { reglages } from '../core/reglages';
import { BarreXp } from './BarreXp';
import { Image } from './Image';
import { formaterDps } from './nombres';
import { cheminSprite } from './precharger';
import { storeJeu } from './store';

type Props = { uid: string; ouvert: boolean; fermer: () => void; declencheur: RefObject<HTMLButtonElement | null> };
const catalogue = chargerPokemon();
const bouton = 'min-h-11 px-4 py-2 bg-surface-2 disabled:text-texte-doux';
const nombre = (valeur: number) => valeur.toLocaleString('fr-FR', { maximumFractionDigits: 2 });

function Etoile() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="size-5 shrink-0 fill-current">
    <path d="m12 2 3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1z" />
  </svg>;
}

export function FichePokemon(props: Props) {
  return <FenetrePokemon key={props.uid} {...props} />;
}

function FenetrePokemon({ uid, ouvert, fermer, declencheur }: Props) {
  const equipe = useStore(storeJeu, etat => etat.equipe);
  const membre = equipe.find(c => c?.pokemon.uid === uid);
  const dialogue = useRef<HTMLDialogElement>(null);
  const confirmation = useRef<HTMLDialogElement>(null);
  const annuler = useRef<HTMLButtonElement>(null);
  const titre = useId();
  const titreConfirmation = useId();
  const raisonPc = useId();
  const raisonRelachement = useId();
  const compteur = useId();
  const champ = useId();
  const [surnom, saisir] = useState(membre?.pokemon.surnom ?? '');
  const [erreur, signaler] = useState<string | null>(null);
  const [erreurConfirmation, signalerConfirmation] = useState<string | null>(null);

  useEffect(() => {
    const fenetre = dialogue.current;
    if (ouvert && !fenetre?.open) fenetre?.showModal();
    if (!ouvert) {
      if (confirmation.current?.open) confirmation.current.close();
      if (fenetre?.open) fenetre.close();
    }
  }, [ouvert]);

  useEffect(() => () => { declencheur.current?.focus(); }, [declencheur]);

  const fermerFiche = () => dialogue.current?.close();
  const aLaFermeture = () => {
    if (confirmation.current?.open) confirmation.current.close();
    fermer();
    const origine = declencheur.current;
    // Pokémon relâché : sa carte n'existe plus, le focus va au titre de la page.
    if (origine?.isConnected) origine.focus();
    else document.querySelector<HTMLElement>('h1')?.focus();
  };
  const pokemon = membre?.pokemon;
  const espece = pokemon ? catalogue.parNumero(pokemon.numero) : null;
  const nom = pokemon?.surnom ?? espece?.nom ?? 'Pokémon';
  // La règle pure ne consulte que ces deux listes ; aucune mutation du store.
  const verification = verifierRelachement({ equipe: equipe.flatMap(c => c ? [c.pokemon] : []), pc: [] } as unknown as Parameters<typeof verifierRelachement>[0], uid);
  const refus = verification.ok ? null : verification.raison;
  const detail = membre ? detailDps(membre.pokemon, membre.multiplicateur) : null;

  return <>
    <dialog ref={dialogue} aria-labelledby={titre} className="fiche-pokemon cadre w-full max-w-3xl bg-surface p-0 text-base text-texte"
      onClose={aLaFermeture} onCancel={event => { event.preventDefault(); fermerFiche(); }}
      onPointerDown={event => { if (event.target === event.currentTarget) fermerFiche(); }}>
      <div className="fiche-contenu grid min-w-0 gap-4 p-4 lg:p-8">
        <button type="button" className={`${bouton} justify-self-end`} onClick={fermerFiche}>Ferme la fiche</button>
        <header>
          <h2 id={titre} className="break-words font-titre text-2xl">{nom}</h2>
          {pokemon && espece && <p>{espece.nom} · N° {pokemon.numero} · Niveau {pokemon.niveau}</p>}
        </header>
        {pokemon && espece && membre && detail && <>
          <div className="relative isolate grid place-items-center">
            <div className="socle absolute bottom-4 -z-10 h-8 w-40 bg-region-socle" />
            <Image src={cheminSprite(pokemon.numero)} genre="sprite" alt={espece.nom} className="size-48 image-rendering-pixelated" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {pokemon.sexe === 'male' && <span className="text-info-base" role="img" aria-label="Mâle">♂</span>}
            {pokemon.sexe === 'femelle' && <span className="text-erreur-base" role="img" aria-label="Femelle">♀</span>}
            {pokemon.shiny && <span className="inline-flex items-center gap-1 text-alerte-base"><Etoile />Shiny</span>}
            <button type="button" aria-pressed={pokemon.favori}
              className={`${bouton} inline-flex items-center gap-2 ${pokemon.favori ? 'text-lien' : ''}`}
              onClick={() => signaler(storeJeu.getState().basculerFavori(uid))}>
              <Etoile />{pokemon.favori ? 'Retire des favoris' : 'Ajoute aux favoris'}
            </button>
            {espece.types.map(type => <span key={type} className="bg-surface-2 px-2 py-1">{nomType(type)}</span>)}
          </div>
          <div>
            <p>XP : {pokemon.niveau >= 100 ? <span>MAX</span> : <span>{Math.floor(pokemon.xp)} / {membre.xpMax}</span>}</p>
            <BarreXp xp={pokemon.xp} maximum={membre.xpMax} nom={nom} />
          </div>
          <p className="text-xl text-region-accent">{formaterDps(membre.dps)} DPS</p>
          <dl className="grid grid-cols-2 gap-2">
            <dt>Base</dt><dd>{nombre(detail.base)}</dd>
            <dt>Type</dt><dd>× {nombre(detail.multiplicateurType)}</dd>
            <dt>Shiny</dt><dd>× {nombre(detail.shiny)}</dd>
            <dt>Bonheur</dt><dd>× {nombre(detail.bonheur)}</dd>
            <dt>Pierre Stase</dt><dd>× {nombre(detail.pierreEternelle)}</dd>
            <dt>Calcium</dt><dd>× {nombre(detail.calcium)}</dd>
          </dl>
          <div className="flex flex-wrap items-center gap-4">
            <svg viewBox="0 0 64 64" role="img" aria-label={`Bonheur : ${pokemon.bonheur}/255`} className="size-16 shrink-0 -rotate-90 fill-none">
              <circle cx="32" cy="32" r="28" strokeWidth="8" className="stroke-surface-2" />
              <circle cx="32" cy="32" r="28" strokeWidth="8" pathLength={255}
                strokeDasharray={`${pokemon.bonheur} 255`} className="stroke-alerte-base" />
            </svg>
            <div><p>Bonheur : <span>{pokemon.bonheur}/255</span></p>
              <p>+{nombre(pokemon.bonheur * reglages.degats.bonheurParPoint * 100)} % de dégâts</p></div>
          </div>
          <p>Calcium : {pokemon.calcium} · +{nombre(pokemon.calcium * reglages.degats.calciumParBoost * 100)} % de dégâts</p>
          <p>Objet tenu : {pokemon.pierreEternelle ? 'Pierre Stase' : 'aucun'}</p>
          <form className="grid gap-2" onSubmit={event => { event.preventDefault(); signaler(storeJeu.getState().renommer(uid, surnom)); }}>
            <label htmlFor={champ}>Surnom</label>
            <input id={champ} type="text" value={surnom} aria-describedby={compteur}
              className="min-h-11 min-w-0 border border-bordure bg-fond p-2" onChange={event => saisir(event.target.value)} />
            <p id={compteur}>{surnom.length} / {reglages.equipe.surnomMax} caractères</p>
            <button type="submit" className={bouton}>Renommer</button>
          </form>
          {erreur && <p role="alert">{erreur}</p>}
          <button type="button" disabled aria-describedby={raisonPc} className="min-h-11 bg-action px-4 py-2 text-action-texte">Envoyer au PC</button>
          <p id={raisonPc}>Le PC arrive bientôt.</p>
          <button type="button" disabled={refus !== null} aria-describedby={refus ? raisonRelachement : undefined}
            className={`${bouton} text-erreur-base`} onClick={() => {
              signalerConfirmation(null);
              confirmation.current?.showModal();
              annuler.current?.focus();
            }}>Relâcher</button>
          {refus && <p id={raisonRelachement}>{refus}</p>}
        </>}
      </div>
    </dialog>
    <dialog ref={confirmation} aria-labelledby={titreConfirmation}
      className="fiche-pokemon cadre w-full max-w-xl bg-surface p-4 text-base text-texte lg:p-8">
      <div className="grid gap-4">
        <h2 id={titreConfirmation} className="break-words font-titre text-2xl">Veux-tu vraiment relâcher {nom} ?</h2>
        <button ref={annuler} type="button" autoFocus className={bouton} onClick={() => confirmation.current?.close()}>Annuler</button>
        <button type="button" className="min-h-11 bg-action px-4 py-2 text-action-texte" onClick={() => {
          const raison = storeJeu.getState().relacher(uid);
          signalerConfirmation(raison);
          if (raison === null) { confirmation.current?.close(); fermerFiche(); }
        }}>Relâche définitivement</button>
        {erreurConfirmation && <p role="alert">{erreurConfirmation}</p>}
      </div>
    </dialog>
  </>;
}
