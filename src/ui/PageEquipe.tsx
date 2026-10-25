import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { chargerPokemon } from '../core/pokemon';
import { reglages } from '../core/reglages';
import { cibleValide, cibleValideStase, quantiteMax } from '../core/objets-equipe';
import { cibleValidePierre } from '../core/evolution';
import { ConfirmationObjet } from './ConfirmationObjet';
import { SpriteEvolution } from './SpriteEvolution';
import { BarreXp } from './BarreXp';
import { FichePokemon } from './FichePokemon';
import { Image } from './Image';
import { MenuPokemon } from './MenuPokemon';
import { Sac } from './Sac';
import { SelecteurQuantite } from './SelecteurQuantite';
import { formaterDps } from './nombres';
import { cheminSprite, precharger } from './precharger';
import { storeJeu } from './store';

const catalogue = chargerPokemon();

export function PageEquipe() {
  const equipe = useStore(storeJeu, etat => etat.equipe);
  const dps = useStore(storeJeu, etat => etat.dps);
  const echange = useStore(storeJeu, etat => etat.echange);
  const sac = useStore(storeJeu, etat => etat.sac);
  const evolution = useStore(storeJeu, etat => etat.evolution);
  const [selection, selectionner] = useState<{ type: 'bonbon' | 'calcium' | 'pierre' | 'stase' | 'jeton'; cle: string; nom: string } | null>(null);
  const mode = echange ? null : selection;
  const [cible, cibler] = useState<string | null>(null);
  const [quantite, changerQuantite] = useState(1);
  const [erreurObjet, signalerObjet] = useState<string | null>(null);
  const [messageObjet, annoncerObjet] = useState<string | null>(null);
  const [choisi, choisir] = useState(() => equipe.find(c => c)?.pokemon.uid);
  const [fiche, ouvrir] = useState<string | null>(null);
  const [ouvert, afficher] = useState(false);
  const [menu, placerMenu] = useState<{ uid: string; x: number; y: number; carte: HTMLButtonElement } | null>(null);
  const [erreur, signaler] = useState<{ echange: typeof echange; message: string } | null>(null);
  const declencheur = useRef<HTMLButtonElement>(null);
  const panneau = useRef<HTMLElement>(null);
  const liste = useRef<HTMLUListElement>(null);
  const sacElement = useRef<HTMLDivElement>(null);
  const declencheurObjet = useRef<HTMLButtonElement>(null);
  const titre = useRef<HTMLHeadingElement>(null);
  const rendreFocus = useRef(false);
  const membre = equipe.find(c => c?.pokemon.uid === choisi) ?? equipe.find(c => c);
  const nom = membre ? membre.pokemon.surnom ?? catalogue.parNumero(membre.pokemon.numero).nom : '';

  useEffect(() => () => storeJeu.getState().annulerEchange(), []);

  useEffect(() => {
    for (const membre of equipe) {
      if (typeof membre?.evolution === 'number') void precharger([cheminSprite(membre.evolution)]);
    }
  }, [equipe]);

  function annulerObjet() {
    rendreFocus.current = true;
    selectionner(null);
    cibler(null);
    signalerObjet(null);
  }

  useLayoutEffect(() => {
    if (!rendreFocus.current) return;
    rendreFocus.current = false;
    const bouton = declencheurObjet.current;
    (bouton?.isConnected && !bouton.disabled ? bouton : titre.current)?.focus();
  });

  useEffect(() => {
    if (!mode) return;
    function dehors(event: MouseEvent) {
      if (event.target instanceof Node && !liste.current?.contains(event.target) && !sacElement.current?.contains(event.target)) {
        annulerObjet();
      }
    }
    function clavier(event: KeyboardEvent) {
      if (event.key === 'Escape') annulerObjet();
    }
    document.addEventListener('click', dehors);
    document.addEventListener('keydown', clavier);
    return () => {
      document.removeEventListener('click', dehors);
      document.removeEventListener('keydown', clavier);
    };
  }, [mode]);

  function ouvrirFiche(uid: string, bouton: HTMLButtonElement) {
    declencheur.current = bouton;
    ouvrir(uid);
    afficher(true);
  }

  return <section className="mx-auto max-w-screen-xl text-base">
    <h1 ref={titre} tabIndex={-1} className="font-titre text-2xl font-semibold">Ton équipe</h1>
    <p className="mt-2 text-region-accent">{`${formaterDps(dps)} DPS · ${equipe.filter(Boolean).length} / ${reglages.equipe.taille}`}</p>
    {echange && <div role="status" className="cadre mt-4 flex flex-wrap items-center gap-4 bg-surface p-4">
      <p>Choisis le Pokémon à remplacer par {echange.nom}</p>
      <button type="button" className="min-h-11 bg-surface-2 px-4 py-2"
        onClick={() => storeJeu.getState().annulerEchange()}>Annuler</button>
    </div>}
    {echange && erreur?.echange === echange && <p role="alert" className="mt-4 text-erreur-base">{erreur.message}</p>}
    <p role="status" className={mode || messageObjet ? 'mt-4' : undefined}>{mode ? 'Sélectionne un Pokémon.' : messageObjet ?? ''}</p>
    {erreurObjet && <p role="alert" className="mt-4 text-erreur-base">{erreurObjet}</p>}
    <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <ul ref={liste} className="grid min-w-0 gap-4">
        {Array.from({ length: reglages.equipe.taille }, (_, index) => {
          const caseEquipe = equipe[index];
          if (!caseEquipe) return <li key={index} className="cadre min-h-11 bg-surface p-4 text-texte-doux">Emplacement libre</li>;
          const { pokemon, dps, xpMax } = caseEquipe;
          const nom = pokemon.surnom ?? catalogue.parNumero(pokemon.numero).nom;
          const stock = mode ? sac.entrees.find(entree => entree.id === mode.cle)?.quantite ?? 0 : 0;
          const maximum = mode && (mode.type === 'bonbon' || mode.type === 'calcium') ? quantiteMax(mode.type, pokemon, stock) : 0;
          const valide = mode && (mode.type === 'pierre' ? cibleValidePierre(pokemon, mode.cle)
            : mode.type === 'stase' ? cibleValideStase(pokemon) : mode.type === 'jeton' ? true
            : cibleValide(mode.type, pokemon) && maximum > 0);
          return <li key={pokemon.uid} className="min-w-0">
            <button type="button" aria-label={`${nom}, niveau ${pokemon.niveau}`} aria-pressed={membre?.pokemon.uid === pokemon.uid} data-uid={pokemon.uid}
              disabled={!!mode && (mode.type === 'bonbon' || mode.type === 'calcium') && !valide}
              className={`cadre grid min-h-11 w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-2 p-4 text-left ${mode && !valide ? '' : 'hover:bg-selection'} ${membre?.pokemon.uid === pokemon.uid ? 'bg-selection' : 'bg-surface'} ${mode ? valide ? 'relative motion-safe:cible-valide' : 'grayscale opacity-50' : ''}`}
              onContextMenu={event => {
                event.preventDefault();
                if (echange || mode) return;
                placerMenu({ uid: pokemon.uid, x: event.clientX, y: event.clientY, carte: event.currentTarget });
              }}
              onClick={event => {
                if (echange) {
                  const message = storeJeu.getState().echanger(echange.uid, pokemon.uid);
                  signaler(message ? { echange, message } : null);
                  return;
                }
                if (mode) {
                  if (mode.type === 'stase') {
                    const message = storeJeu.getState().poserStase(pokemon.uid);
                    if (!message || (pokemon.pierreEternelle && !pokemon.oeuf)) annulerObjet();
                    else cibler(null);
                    signalerObjet(message);
                    return;
                  }
                  if (mode.type === 'jeton' && pokemon.shiny) {
                    cibler(null);
                    signalerObjet('Déjà chromatique !');
                    return;
                  }
                  if (mode.type === 'pierre' && !valide) {
                    cibler(null);
                    signalerObjet(pokemon.oeuf ? 'Pokémon invalide !' : pokemon.pierreEternelle
                      ? 'Pierre Stase équipée !' : 'Pokémon incompatible !');
                    return;
                  }
                  if (valide) {
                    cibler(pokemon.uid);
                    changerQuantite(1);
                    signalerObjet(null);
                  }
                  return;
                }
                signalerObjet(null);
                choisir(pokemon.uid);
                if (!panneau.current?.getClientRects().length) ouvrirFiche(pokemon.uid, event.currentTarget);
              }}>
              {evolution?.uid === pokemon.uid
                ? <span className="grid size-24 max-w-none place-items-center [&_img]:size-24"><SpriteEvolution ancien={cheminSprite(evolution.ancien)}
                  nouveau={cheminSprite(evolution.nouveau)} nom={nom} actif /></span>
                : <Image src={cheminSprite(pokemon.numero)} genre="sprite" alt="" className="size-24 max-w-none" />}
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
            {pokemon.pierreEternelle && <img src="img/objets/everstone.png" alt="Pierre Stase" className="size-8 image-rendering-pixelated" />}
            {!mode && !echange && typeof caseEquipe.evolution === 'number' && <button type="button"
              aria-label={`Faire évoluer ${nom}`} className="cadre-alerte min-h-11 w-full bg-surface motion-safe:animate-pulse"
              onClick={() => {
                const message = storeJeu.getState().evoluer(pokemon.uid);
                signalerObjet(message);
                if (!message) liste.current?.querySelector<HTMLElement>(`button[data-uid="${pokemon.uid}"]`)?.focus();
              }}>Évoluer</button>}
            {mode?.type === 'pierre' && cible === pokemon.uid && valide && <ConfirmationObjet objet={mode.nom} nom={nom}
              annuler={annulerObjet} valider={() => {
                const message = storeJeu.getState().utiliserPierre(pokemon.uid, mode.cle);
                if (message) signalerObjet(message);
                else annulerObjet();
              }} />}
            {mode?.type === 'jeton' && cible === pokemon.uid && <ConfirmationObjet objet={mode.nom} nom={nom}
              annuler={() => {
                annulerObjet();
                rendreFocus.current = false;
                liste.current?.querySelector<HTMLButtonElement>(`button[data-uid="${pokemon.uid}"]`)?.focus();
              }} valider={() => {
                const message = storeJeu.getState().utiliserJeton(pokemon.uid);
                if (message) signalerObjet(message);
                else annulerObjet();
              }} />}
            {mode && (mode.type === 'bonbon' || mode.type === 'calcium') && cible === pokemon.uid && valide && <SelecteurQuantite valeur={Math.min(quantite, maximum)} max={maximum}
              changer={changerQuantite} annuler={annulerObjet} valider={() => {
                if (mode.type !== 'bonbon' && mode.type !== 'calcium') return;
                const message = storeJeu.getState().utiliserObjet(mode.type, pokemon.uid, Math.min(quantite, maximum));
                if (message) signalerObjet(message);
                else annulerObjet();
              }} />}
          </li>;
        })}
      </ul>
      <div className="min-w-0 space-y-4">
      {membre && <aside ref={panneau} className="cadre sticky top-8 hidden min-w-0 space-y-4 bg-surface p-4 lg:block">
        <div className="relative isolate grid place-items-center">
          <span className="socle absolute bottom-6 -z-10 h-8 w-40 bg-region-socle" aria-hidden="true" />
          {evolution?.uid === membre.pokemon.uid
            ? <span className="grid size-48 max-w-full place-items-center [&_img]:size-48"><SpriteEvolution ancien={cheminSprite(evolution.ancien)}
              nouveau={cheminSprite(evolution.nouveau)} nom={nom} actif /></span>
            : <Image src={cheminSprite(membre.pokemon.numero)} genre="sprite" alt="" className="size-48 max-w-full" />}
        </div>
        <h2 className="break-words font-titre text-xl font-semibold">{nom}</h2>
        <p>Niv. {membre.pokemon.niveau}</p>
        <BarreXp xp={membre.pokemon.xp} maximum={membre.xpMax} nom={nom} />
        <p>{membre.xpMax === 0 ? 'MAX' : `${Math.floor(membre.pokemon.xp)} / ${membre.xpMax} XP`}</p>
        <p className="text-region-accent">{formaterDps(membre.dps)} DPS</p>
        {!echange && !mode && <button type="button" className="min-h-11 bg-action px-4 py-2 text-action-texte hover:bg-action-survol"
          onClick={event => ouvrirFiche(membre.pokemon.uid, event.currentTarget)}>Ouvre la fiche</button>}
      </aside>}
      <div ref={sacElement}>
        <Sac sac={sac} utiliser={(entree, bouton) => {
          if (echange || !entree.utilisable || entree.quantite <= 0) return;
          declencheurObjet.current = bouton;
          cibler(null);
          changerQuantite(1);
          signalerObjet(null);
          placerMenu(null);
          afficher(false);
          if (entree.utilisable === 'direct') {
            annulerObjet();
            annoncerObjet(storeJeu.getState().utiliserObjetActif(entree.id));
            return;
          }
          annoncerObjet(null);
          selectionner({ type: entree.utilisable, cle: entree.id, nom: entree.nom });
        }} />
      </div>
      </div>
    </div>
    {!mode && !echange && menu && <MenuPokemon x={menu.x} y={menu.y} declencheur={menu.carte} fermer={() => placerMenu(null)}
      retirerObjet={equipe.find(c => c?.pokemon.uid === menu.uid)?.pokemon.pierreEternelle
        ? () => signalerObjet(storeJeu.getState().retirerStase(menu.uid)) : undefined}
      resumer={() => {
        choisir(menu.uid);
        ouvrirFiche(menu.uid, menu.carte);
      }} />}
    {fiche !== null && <FichePokemon uid={fiche} ouvert={ouvert} fermer={() => afficher(false)} declencheur={declencheur} />}
  </section>;
}
