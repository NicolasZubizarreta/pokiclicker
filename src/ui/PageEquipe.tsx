import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { classeSprite, nomAffiche, progressionOeuf, spriteAffiche } from './affichage-pokemon';
import { IconeShiny } from './IconeShiny';
import { chargerObjets } from '../core/boutique';
import { reglages } from '../core/reglages';
import { type TypeObjetEquipe, cibleValide, cibleValideStase, quantiteMax } from '../core/objets-equipe';
import { cibleValidePierre } from '../core/evolution';
import { ConfirmationObjet } from './ConfirmationObjet';
import { SpriteEvolution } from './SpriteEvolution';
import { BarreXp } from './BarreXp';
import { BoutonRenommer } from './BoutonRenommer';
import { FichePokemon } from './FichePokemon';
import { Image } from './Image';
import { IconeObjet, PC } from './icones';
import { IconeChevron } from './icones-menu';
import { MenuPokemon } from './MenuPokemon';
import { Sac } from './Sac';
import { SelecteurQuantite } from './SelecteurQuantite';
import { formaterDps } from './nombres';
import { cheminSprite, precharger } from './precharger';
import { notifier } from './pileNotifications';
import { storeJeu } from './store';
import { annulerChoix, terminerChoix, useSacContexte } from './sacContexte';
import { useTelephone } from './useTelephone';
import { EquipePC } from './EquipePC';
import { ouvrirSac } from './sacContexte';

const stase = chargerObjets().find(objet => objet.id === 'everstone')!;

export function PageEquipe({ ouvrirPC }: { ouvrirPC?: () => void }) {
  const telephone = useTelephone();
  const [tri, trier] = useState('ordre');
  const Conteneur = telephone ? Fragment : 'div';
  const objetContexte = useSacContexte(etat => etat.objet);
  const equipe = useStore(storeJeu, etat => etat.equipe);
  const pc = useStore(storeJeu, etat => etat.pc);
  const accesPc = useStore(storeJeu, etat => etat.accesPc);
  const dps = useStore(storeJeu, etat => etat.dps);
  const echange = useStore(storeJeu, etat => etat.echange);
  const sac = useStore(storeJeu, etat => etat.sac);
  const evolution = useStore(storeJeu, etat => etat.evolution);
  const [selection, selectionner] = useState<{ type: TypeObjetEquipe | 'pierre' | 'stase' | 'jeton'; cle: string; nom: string } | null>(null);
  const mode = echange ? null : objetContexte ?? selection;
  const [cible, cibler] = useState<string | null>(null);
  const [quantite, changerQuantite] = useState(1);
  // Refus et résultats d'objets : pop-up en haut de l'écran, jamais dans la page (la mise en page ne bouge pas).
  const signalerObjet = (message: string | null) => notifier(message);
  const annoncerObjet = (message: string | null) => notifier(message);
  const [choisi, choisir] = useState(() => equipe.find(c => c)?.pokemon.uid);
  const [fiche, ouvrir] = useState<string | null>(null);
  const [ouverture, compterOuverture] = useState(0);
  const [renommage, renommer] = useState(false);
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
  const nom = membre ? nomAffiche(membre.pokemon) : '';

  useEffect(() => () => storeJeu.getState().annulerEchange(), []);

  useEffect(() => {
    for (const membre of equipe) {
      if (typeof membre?.evolution === 'number') void precharger([cheminSprite(membre.evolution, membre.pokemon.shiny)]);
    }
  }, [equipe]);

  function abandonnerObjet() {
    cibler(null);
    liste.current?.querySelector<HTMLButtonElement>(`button[data-uid="${cible}"]`)?.focus();
  }

  function terminerApplication(uid: string) {
    cibler(null);
    liste.current?.querySelector<HTMLButtonElement>(`button[data-uid="${uid}"]`)?.focus();
    if (mode && (storeJeu.getState().sac.entrees.find(e => e.id === mode.cle)?.quantite ?? 0) <= 0) {
      annulerObjet();
      signalerObjet(`Plus de ${mode.nom}.`);
    }
  }

  function annulerObjet() {
    terminerChoix();
    annoncerObjet(null);
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
    function clavier(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (objetContexte) annulerChoix();
        else annulerObjet();
      }
    }
    document.addEventListener('keydown', clavier);
    return () => {
      document.removeEventListener('keydown', clavier);
    };
  }, [mode, objetContexte]);

  function ouvrirFiche(uid: string, bouton: HTMLButtonElement, avecRenommage = false) {
    declencheur.current = bouton;
    ouvrir(uid);
    renommer(avecRenommage);
    compterOuverture(n => n + 1);
    afficher(true);
  }

  return <section className="mx-auto max-w-screen-xl text-base">
    <Conteneur {...(telephone ? {} : { className: 'equipe-pc' })}>
    {!telephone && <header className="titre-equipe">
      <h1 ref={titre} tabIndex={-1} className="font-titre text-2xl font-semibold">Ton équipe</h1>
      <span className="bg-surface-2 px-2">{equipe.filter(Boolean).length} / {reglages.equipe.taille}</span>
      <span className="text-region-accent">{formaterDps(dps)} DPS</span>
      <select aria-label="Trier l'équipe" value={tri} onChange={event => trier(event.target.value)}>
        <option value="ordre">Ordre de l'équipe</option><option value="dps">DPS, du plus grand au plus petit</option>
      </select>
      {sac.acces.ouvert && <button type="button" className="plaque" onClick={ouvrirSac}>Sac</button>}
    </header>}
    {telephone && <>
    <h1 ref={titre} tabIndex={-1} className="font-titre text-2xl font-semibold">Ton équipe</h1>
    <p className="mt-2 text-region-accent">{`${formaterDps(dps)} DPS · ${equipe.filter(Boolean).length} / ${reglages.equipe.taille}`}</p>
    </>}
    {echange && erreur?.echange === echange && <p role="alert" className="mt-4 text-erreur-base">{erreur.message}</p>}
    {mode ? <div className={`cadre sticky top-0 z-10 flex items-center justify-between gap-4 bg-surface p-4${telephone ? '' : ' bandeau-choix'}`}>
      <p role="status">{mode.nom} ×{sac.entrees.find(e => e.id === mode.cle)?.quantite ?? 0} : touche un Pokémon</p>
      <button type="button" autoFocus className="min-h-11 shrink-0 bg-surface-2 px-4 py-2" onClick={objetContexte ? annulerChoix : annulerObjet}>Fermer</button>
    </div> : <p role="status" className={mode ? 'mt-4' : undefined}>{mode ? 'Sélectionne un Pokémon.' : ''}</p>}
    <div className={telephone ? 'mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]' : 'disposition'}>
      <div className={telephone ? 'min-w-0 space-y-4' : 'colonne-equipe'}>
      <ul ref={liste} className={telephone ? 'grid min-w-0 gap-2 lg:auto-rows-fr lg:gap-4' : 'grille-equipe grid grid-cols-3 grid-rows-2 gap-4'}>
        {Array.from({ length: reglages.equipe.taille }, (_, index) => {
          const caseEquipe = !telephone && tri === 'dps' ? [...equipe].sort((a, b) => (b?.dps ?? -1) - (a?.dps ?? -1))[index] : equipe[index];
          if (!caseEquipe) return <li key={index} className={`cadre min-h-11 bg-surface p-4 text-texte-doux${telephone ? '' : ' vide'}`}>Emplacement libre</li>;
          const { pokemon, dps, xpMax } = caseEquipe;
          const nom = nomAffiche(pokemon);
          const stock = mode ? sac.entrees.find(entree => entree.id === mode.cle)?.quantite ?? 0 : 0;
          const maximum = mode && (mode.type === 'bonbon' || mode.type === 'calcium' || mode.type === 'baie') ? quantiteMax(mode.type, pokemon, stock) : 0;
          const valide = mode && (mode.type === 'pierre' ? cibleValidePierre(pokemon, mode.cle)
            : mode.type === 'stase' ? cibleValideStase(pokemon) : mode.type === 'jeton' ? true
            : cibleValide(mode.type, pokemon) && maximum > 0);
          return <li key={pokemon.uid} className="relative min-w-0">
            <button type="button" aria-label={pokemon.oeuf ? `${nom}, ${progressionOeuf(pokemon.oeuf)}` : `${nom}, niveau ${pokemon.niveau}`} aria-pressed={membre?.pokemon.uid === pokemon.uid} data-uid={pokemon.uid}
              disabled={!!mode && (mode.type === 'bonbon' || mode.type === 'calcium' || mode.type === 'baie') && !valide}
              className={`${telephone ? '' : 'carte-equipe '}cadre relative grid overflow-hidden h-full min-h-11 w-full grid-cols-[auto_minmax(0,1fr)_auto] lg:grid-cols-[auto_minmax(0,1fr)] items-center gap-2 p-3 pe-3 lg:p-4 lg:pe-24 text-left ${!mode && !echange && typeof caseEquipe.evolution === 'number' ? 'pret-evoluer' : ''} ${mode && !valide ? '' : 'hover:bg-selection'} ${membre?.pokemon.uid === pokemon.uid ? 'bg-surface lg:bg-selection' : 'bg-surface'} ${mode ? valide ? 'relative border-info-base motion-safe:cible-valide' : 'grayscale opacity-50' : ''}`}
              onContextMenu={event => {
                event.preventDefault();
                if (echange || mode) return;
                placerMenu({ uid: pokemon.uid, x: event.clientX, y: event.clientY, carte: event.currentTarget });
              }}
              onClick={event => {
                annoncerObjet(null);
                if (echange) {
                  const message = storeJeu.getState().echanger(echange.uid, pokemon.uid);
                  signaler(message ? { echange, message } : null);
                  return;
                }
                if (mode) {
                  if (mode.type === 'stase') {
                    const message = storeJeu.getState().poserStase(pokemon.uid);
                    if (!message) terminerApplication(pokemon.uid);
                    else { cibler(null); signalerObjet(message); }
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
              {!telephone ? <EquipePC pokemon={pokemon} dps={dps} xpMax={xpMax} pret={typeof caseEquipe.evolution === 'number'} animation={evolution?.uid === pokemon.uid ? { ancien: spriteAffiche({ ...pokemon, numero: evolution.ancien }), nouveau: spriteAffiche({ ...pokemon, numero: evolution.nouveau }), nom, actif: true, shiny: pokemon.shiny } : undefined} /> : <>
              {evolution?.uid === pokemon.uid
                ? <span className="grid size-14 lg:size-24 max-w-full overflow-hidden place-items-center [&_img]:size-14 lg:[&_img]:size-24 [&_img]:max-h-full [&_img]:max-w-full"><SpriteEvolution ancien={spriteAffiche({ ...pokemon, numero: evolution.ancien })}
                  nouveau={spriteAffiche({ ...pokemon, numero: evolution.nouveau })} nom={nom} actif shiny={pokemon.shiny} /></span>
                : <Image src={spriteAffiche(pokemon)} genre="sprite" alt="" className={`size-14 lg:size-24 max-h-full max-w-full ${pokemon.shiny && !pokemon.oeuf ? 'halo-shiny' : ''} ${classeSprite(pokemon)}`} />}
              <span className="grid min-w-0 gap-1 lg:gap-2">
                <strong className="flex items-center gap-2 break-words">{nom}{pokemon.shiny && !pokemon.oeuf && <IconeShiny />}{pokemon.favori &&
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="size-5 shrink-0 fill-current text-lien">
                    <path d="m12 2 3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1z" />
                  </svg>}</strong>
                <span className="lg:contents">
                  <span>{pokemon.oeuf ? progressionOeuf(pokemon.oeuf) : `Niv. ${pokemon.niveau}`}</span>
                  <span className="lg:hidden"> · </span>
                  <span className="text-region-accent lg:order-3">{formaterDps(dps)} DPS</span>
                </span>
                {!pokemon.oeuf && <span className="lg:order-2"><BarreXp xp={pokemon.xp} maximum={xpMax} nom={nom} /></span>}
              </span>
              {!mode ? <span className="lg:hidden"><IconeChevron /></span> : valide &&
                <span className="bg-action px-2 py-1 text-action-texte font-bold lg:hidden">Choisir</span>}
              </>}
            </button>
            <div className="pointer-events-none absolute top-2 right-2 flex items-center gap-1 [&>*]:pointer-events-auto">
              {pokemon.pierreEternelle && <button type="button" aria-label={`Retirer ${stase.nom} de ${nom}`} title={`Retirer ${stase.nom}`}
                className="relative grid place-items-center p-1 hover:bg-selection after:absolute after:top-1/2 after:left-1/2 after:size-11 after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']"
                onClick={() => signalerObjet(storeJeu.getState().retirerStase(pokemon.uid))}>
                {stase.image !== null
                  ? <img src={stase.image} alt="" width={32} height={32} className="size-8 image-rendering-pixelated" />
                  : <IconeObjet image={null} nom={stase.nom} />}
              </button>}
              {telephone && !mode && !echange && !pokemon.oeuf && <span className="hidden lg:flex"><BoutonRenommer nom={nom}
                ouvrir={bouton => {
                  choisir(pokemon.uid);
                  ouvrirFiche(pokemon.uid, bouton, true);
                }} /></span>}
            </div>
            <Conteneur {...(!telephone && mode && cible === pokemon.uid ? { className: 'superposition' } : {})}>
            {mode?.type === 'pierre' && cible === pokemon.uid && valide && <ConfirmationObjet objet={mode.nom} nom={nom}
              annuler={abandonnerObjet} valider={() => {
                const message = storeJeu.getState().utiliserPierre(pokemon.uid, mode.cle);
                if (message) signalerObjet(message);
                else terminerApplication(pokemon.uid);
              }} />}
            {mode?.type === 'jeton' && cible === pokemon.uid && <ConfirmationObjet objet={mode.nom} nom={nom}
              annuler={() => {
                abandonnerObjet();
                rendreFocus.current = false;
                liste.current?.querySelector<HTMLButtonElement>(`button[data-uid="${pokemon.uid}"]`)?.focus();
              }} valider={() => {
                const message = storeJeu.getState().utiliserJeton(pokemon.uid);
                if (message) signalerObjet(message);
                else terminerApplication(pokemon.uid);
              }} />}
            {mode && (mode.type === 'bonbon' || mode.type === 'calcium' || mode.type === 'baie') && cible === pokemon.uid && valide && <SelecteurQuantite valeur={Math.min(quantite, maximum)} max={maximum}
              changer={changerQuantite} annuler={abandonnerObjet} valider={() => {
                if (mode.type !== 'bonbon' && mode.type !== 'calcium' && mode.type !== 'baie') return;
                const message = storeJeu.getState().utiliserObjet(mode.type, pokemon.uid, Math.min(quantite, maximum));
                if (message) signalerObjet(message);
                else terminerApplication(pokemon.uid);
              }} />}
            </Conteneur>
          </li>;
        })}
      </ul>
      {telephone && ouvrirPC && !mode && !echange && <button type="button"
        className={`cadre flex min-h-11 w-full items-center gap-4 bg-surface p-4 text-left hover:bg-selection ${accesPc.ouvert ? '' : 'opacity-60'}`}
        onClick={ouvrirPC}>
        <PC />
        <span className="min-w-0 flex-1"><strong className="block">PC de Léo</strong>
          <span>{accesPc.ouvert ? `${pc.length} Pokémon rangés` : "Après l'arène d'Argenta"}</span>
        </span>
        <IconeChevron />
      </button>}
      </div>
      {telephone && <div className="min-w-0 space-y-4">
      {membre && <aside ref={panneau} className="cadre sticky top-8 z-10 overflow-hidden hidden min-w-0 space-y-4 bg-surface p-4 lg:block">
        <div className="relative isolate grid place-items-center overflow-hidden">
          <span className="socle absolute bottom-6 -z-10 h-8 w-40 bg-region-socle" aria-hidden="true" />
          {evolution?.uid === membre.pokemon.uid
            ? <span className="grid size-48 max-w-full overflow-hidden place-items-center [&_img]:size-48 [&_img]:max-h-full [&_img]:max-w-full"><SpriteEvolution ancien={spriteAffiche({ ...membre.pokemon, numero: evolution.ancien })}
              nouveau={spriteAffiche({ ...membre.pokemon, numero: evolution.nouveau })} nom={nom} actif shiny={membre.pokemon.shiny} /></span>
            : <Image src={spriteAffiche(membre.pokemon)} genre="sprite" alt="" className={`size-48 max-w-full ${membre.pokemon.shiny && !membre.pokemon.oeuf ? 'halo-shiny' : ''} ${classeSprite(membre.pokemon)}`} />}
        </div>
        <h2 className="break-words font-titre text-xl font-semibold">{nom}{membre.pokemon.shiny && !membre.pokemon.oeuf && <IconeShiny />}</h2>
        <p>{membre.pokemon.oeuf ? progressionOeuf(membre.pokemon.oeuf) : `Niv. ${membre.pokemon.niveau}`}</p>
        {!membre.pokemon.oeuf && <>
          <BarreXp xp={membre.pokemon.xp} maximum={membre.xpMax} nom={nom} />
          <p>{membre.xpMax === 0 ? 'MAX' : `${Math.floor(membre.pokemon.xp)} / ${membre.xpMax} XP`}</p>
        </>}
        <p className="text-region-accent">{formaterDps(membre.dps)} DPS</p>
        {!echange && !mode && <button type="button" className="min-h-11 bg-action px-4 py-2 text-action-texte hover:bg-action-survol"
          onClick={event => ouvrirFiche(membre.pokemon.uid, event.currentTarget)}>Ouvre la fiche</button>}
      </aside>}
      {!telephone && <div ref={sacElement}>
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
      </div>}
      </div>}
    </div>
    </Conteneur>
    {!mode && !echange && menu && <MenuPokemon x={menu.x} y={menu.y} declencheur={menu.carte} fermer={() => placerMenu(null)}
      retirerObjet={equipe.find(c => c?.pokemon.uid === menu.uid)?.pokemon.pierreEternelle
        ? () => signalerObjet(storeJeu.getState().retirerStase(menu.uid)) : undefined}
      resumer={() => {
        choisir(menu.uid);
        ouvrirFiche(menu.uid, menu.carte);
      }} />}
    {fiche !== null && <FichePokemon key={ouverture} uid={fiche} renommer={renommage} ouvert={ouvert} fermer={() => afficher(false)} declencheur={declencheur} />}
  </section>;
}
