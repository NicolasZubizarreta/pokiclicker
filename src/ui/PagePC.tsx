import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { useStore } from 'zustand';
import { dpsPc, filtrerParAttributs, filtrerPc, trierPc, type FiltrePc, type TriPc } from '../core/pc';
import { chargerPokemon } from '../core/pokemon';
import type { PokemonPossede } from '../core/sauvegarde';
import { calculerMaxXp } from '../core/recompenses';
import { BarreXp } from './BarreXp';
import { useTelephone } from './useTelephone';
import { IconeSexe } from './IconeSexe';
import { FichePokemon } from './FichePokemon';
import { Image } from './Image';
import { formaterDps } from './nombres';
import { classeSprite, nomAffiche as nomDe, progressionOeuf, spriteAffiche } from './affichage-pokemon';
import { IconeShiny } from './IconeShiny';
import { RepereTags } from './RepereMarque';
import { storeJeu } from './store';
import { notifier } from './pileNotifications';
import './PagePC.css';

const catalogue = chargerPokemon();
const nomEspece = (pokemon: PokemonPossede) => pokemon.oeuf ? nomDe(pokemon) : catalogue.parNumero(pokemon.numero).nom;

const optionsTri: [TriPc, string][] = [['dps', 'DPS'], ['numero', 'Numéro du Pokédex'], ['nom', 'Nom, de A à Z'], ['niveau', 'Niveau'], ['favori', "Favoris d'abord"], ['shiny', "Shiny d'abord"]];
const optionsFiltre: [FiltrePc, string][] = [['tous', 'Tous'], ['favori', 'Favoris'], ['shiny', 'Shiny'], ['oeuf', 'Œufs'], ['evolution', 'Évolution à découvrir']];

// Liste déroulante native. Sur PC, une copie invisible du libellé le plus long fixe la largeur : texte, marge, flèche.
function ListeDeroulante<T extends string>({ id, libelle, valeur, options, changer, compacte }: {
  id: string; libelle: string; valeur: T; options: [T, string][]; changer(valeur: T): void; compacte: boolean;
}) {
  const plusLong = options.reduce((long, [, texte]) => texte.length > long.length ? texte : long, '');
  return <div className={compacte ? 'pc-liste-deroulante' : undefined}>
    <label htmlFor={id}>{libelle}</label>
    <div className={compacte ? 'pc-select-boite' : undefined}>
      {compacte && <span aria-hidden="true" className="pc-select-mesure">{plusLong}</span>}
      <select id={id} value={valeur} onChange={event => changer(event.target.value as T)} className="min-h-12 w-full border border-bordure bg-fond px-3 font-bold text-texte">
        {options.map(([cle, texte]) => <option key={cle} value={cle}>{texte}</option>)}
      </select>
    </div>
  </div>;
}

export function PagePC({ retour, libelleRetour }: { retour?(): void; libelleRetour?: string }) {
  const telephone = useTelephone();
  const pc = useStore(storeJeu, etat => etat.pc);
  const accesPc = useStore(storeJeu, etat => etat.accesPc);
  const equipe = useStore(storeJeu, etat => etat.equipe);
  const echange = useStore(storeJeu, etat => etat.echange);
  const [fiche, ouvrir] = useState<string | null>(null);
  const [partenaire, selectionnerPartenaire] = useState<string | null>(null);
  const [ouvert, afficher] = useState(false);
  const [glisse, glisser] = useState<string | null>(null);
  const [survol, survoler] = useState<number | null>(null);
  const [erreur, signaler] = useState<{ message: string; echange: typeof echange } | null>(null);
  const glisseDepuisEquipe = glisse !== null && equipe.some(membre => membre?.pokemon.uid === glisse);
  const declencheur = useRef<HTMLButtonElement>(null);
  const panneau = useRef<HTMLElement>(null);
  const [tri, trier] = useState<TriPc>('dps');
  const [recherche, rechercher] = useState('');
  const [filtre, filtrer] = useState<FiltrePc>('tous');
  const pokedex = useStore(storeJeu, etat => etat.pokedex);
  const actif = filtre !== 'tous';
  const liste = useMemo(() => trierPc(filtrerParAttributs(filtrerPc(pc, recherche, nomDe, nomEspece), filtre, new Set(pokedex)), tri, nomDe), [pc, tri, recherche, filtre, pokedex]);
  const [choisi, choisir] = useState(() => liste[0]?.uid);
  const [selectionLot, selectionnerLot] = useState<Set<string> | null>(null);
  const confirmation = useRef<HTMLDialogElement>(null);
  const [erreurLot, signalerLot] = useState<string | null>(null);
  const eligibles = liste.filter(p => !p.favori);
  const effectifs = eligibles.filter(p => selectionLot?.has(p.uid));
  const tousCoches = eligibles.length > 0 && effectifs.length === eligibles.length;
  const nombre = effectifs.length;
  const shiny = effectifs.filter(p => p.shiny).length;
  const selection = liste.find(pokemon => pokemon.uid === choisi)?.uid ?? liste[0]?.uid;
  const pokemon = liste.find(p => p.uid === selection);

  useEffect(() => () => storeJeu.getState().annulerEchange(), []);

  // Le mode échange (message dans les notifications) place le focus sur « Annuler » ; à sa fin, le focus revient à l'action ou au titre.
  const placer = useRef<HTMLButtonElement>(null);
  const titre = useRef<HTMLHeadingElement>(null);
  const echangeAvant = useRef(echange);
  useEffect(() => {
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

  // Glisser-déposer (PC seulement, toujours actif) : on glisse un Pokémon du PC sur une place de l'équipe.
  // Place occupée : échange ; place libre : il entre dans l'équipe.
  function deposer(index: number, event: DragEvent<HTMLElement>) {
    event.preventDefault();
    const uid = event.dataTransfer.getData('text/plain') || glisse;
    survoler(null);
    glisser(null);
    if (!uid || !pc.some(p => p.uid === uid)) return;
    const membre = equipe[index];
    const message = membre ? storeJeu.getState().echanger(uid, membre.pokemon.uid) : storeJeu.getState().placerDansEquipe(uid);
    signaler(message ? { message, echange } : null);
  }
  const cibleDepot = (index: number) => !telephone && selectionLot === null ? {
    onDragOver: (event: DragEvent<HTMLElement>) => { event.preventDefault(); survoler(index); },
    onDragLeave: () => survoler(null),
    onDrop: (event: DragEvent<HTMLElement>) => deposer(index, event),
    'data-depot': glisse && !glisseDepuisEquipe ? (survol === index ? 'actif' : 'possible') : undefined,
  } : {};
  // Sens inverse : on glisse un Pokémon de l'équipe sur la grille du PC (il en sort, sauf le dernier).
  function deposerSurPc(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    const uid = event.dataTransfer.getData('text/plain') || glisse;
    survoler(null);
    glisser(null);
    if (!uid || !equipe.some(membre => membre?.pokemon.uid === uid)) return;
    notifier(storeJeu.getState().envoyerAuPc(uid));
  }
  const cibleGrille = !telephone && selectionLot === null ? {
    onDragOver: (event: DragEvent<HTMLElement>) => { event.preventDefault(); survoler(-1); },
    onDragLeave: () => survoler(null),
    onDrop: deposerSurPc,
    'data-depot': glisseDepuisEquipe ? (survol === -1 ? 'actif' : 'possible') : undefined,
  } : {};

  function places(mobile: boolean) {
    return Array.from({ length: 6 }, (_, index) => {
      const membre = equipe[index];
      const classe = mobile ? 'flex min-w-0 items-center gap-2 border border-bordure bg-surface text-left' : 'flex min-h-14 w-full items-center gap-2 bg-surface-2 text-left';
      if (!membre) return <div key={index} {...cibleDepot(index)} className={telephone ? classe : `${classe} pc-libre`}>
        <span className={mobile ? 'sr-only' : 'p-2 text-texte-doux'}>Emplacement libre</span>
      </div>;
      const { pokemon, dps } = membre;
      const nom = nomDe(pokemon);
      const contenu = <>
        <Image src={spriteAffiche(pokemon)} genre="sprite" alt="" className={`${mobile ? 'size-16' : 'size-14'} shrink-0 ${pokemon.shiny && !pokemon.oeuf ? 'halo-shiny' : ''} ${classeSprite(pokemon)}`} />
        <span className="grid min-w-0 gap-1 break-words">
          <strong>{nom}<RepereTags pokemon={pokemon} enLigne /></strong><span>{pokemon.oeuf ? progressionOeuf(pokemon.oeuf) : `Niv. ${pokemon.niveau}`}</span>{!mobile && <span>{formaterDps(dps)} DPS</span>}
        </span>
      </>;
      return echange || !telephone ? <button key={index} type="button" aria-label={pokemon.oeuf ? `${nom}, ${progressionOeuf(pokemon.oeuf)}` : `${nom}, niveau ${pokemon.niveau}`}
        aria-pressed={!telephone ? partenaire === pokemon.uid : undefined} {...cibleDepot(index)}
        {...(!telephone && selectionLot === null ? {
          draggable: true,
          onDragStart: (event: DragEvent<HTMLElement>) => { event.dataTransfer.setData('text/plain', pokemon.uid); event.dataTransfer.effectAllowed = 'move'; glisser(pokemon.uid); },
          onDragEnd: () => { glisser(null); survoler(null); },
        } : {})}
        className={`${classe} hover:bg-selection${!telephone ? ' cursor-grab' : ''}`} onClick={() => {
          if (selectionLot !== null) return;
          if (!echange) { selectionnerPartenaire(partenaire === pokemon.uid ? null : pokemon.uid); return; }
          const message = storeJeu.getState().echanger(echange.uid, pokemon.uid);
          signaler(message ? { message, echange } : null);
        }}>{contenu}</button> : <div key={index} className={classe}>{contenu}</div>;
    });
  }

  return <section className={telephone ? 'mx-auto max-w-screen-xl text-base' : 'pc-pc text-base'}>
    {retour && telephone && <button type="button" aria-label={libelleRetour} className="mb-4 min-h-11 bg-surface-2 px-4 py-2 hover:bg-selection" onClick={retour}>Retour</button>}
    <h1 ref={titre} data-tuto="page-pc" tabIndex={-1} className="font-titre text-2xl font-semibold">PC de Léo</h1>
    {!accesPc.ouvert ? <p className="mt-4">{accesPc.raison}</p> : <>
      <div className={telephone ? 'mt-2' : 'pc-compteur'}>
        <p className="text-region-accent">{liste.length < pc.length ? `${liste.length} sur ${pc.length}` : pc.length} Pokémon</p>
      </div>
      {telephone && echange && <div role="group" aria-label="Équipe mobile" className="mt-4 lg:hidden"><p>Ton équipe · {equipe.filter(Boolean).length} / 6</p><div className="grid grid-cols-2 gap-2">{places(true)}</div></div>}
      {erreur && erreur.echange === echange && <p role="alert" className="mt-4 text-erreur-base">{erreur.message}</p>}
      <div className={`mt-4 grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]${telephone ? '' : ' pc-corps'}`}>
      <div className={`grid min-w-0 gap-4${telephone ? '' : ' pc-liste'}`}>
        <div className={telephone ? 'grid min-w-0 gap-4' : 'pc-barre'}>
          <div className={!telephone ? 'pc-tri' : undefined}>
            <ListeDeroulante<TriPc> id="tri-pc" libelle="Trie par" valeur={tri} options={optionsTri} changer={trier} compacte={!telephone} />
          </div>
          <div className={!telephone ? 'pc-filtre' : undefined}>
            <ListeDeroulante<FiltrePc> id="filtre-pc" libelle="Filtre" valeur={filtre} options={optionsFiltre} changer={filtrer} compacte={!telephone} />
          </div>
          <div className={`grid min-w-0 gap-2${telephone ? '' : ' pc-recherche'}`}>
            <label htmlFor="recherche-pc">Nom ou numéro{!telephone && <> <kbd aria-hidden="true">/</kbd></>}</label>
            <input id="recherche-pc" type="search" aria-label={!telephone ? 'Nom ou numéro' : undefined} value={recherche} onChange={event => rechercher(event.target.value)}
              className="min-h-11 min-w-0 w-full border border-bordure bg-surface px-4 py-2 text-texte" />
          </div>
          {pc.length > 0 && selectionLot === null && <button type="button" className="min-h-11 bg-surface-2 px-3 text-erreur-base" onClick={() => {
            selectionnerLot(new Set()); selectionnerPartenaire(null); glisser(null); survoler(null); storeJeu.getState().annulerEchange();
          }}>Relâcher</button>}
        </div>
        {selectionLot !== null && <div className="bandeau-choix flex flex-wrap items-center gap-2 p-4">
          <p role="status">{nombre === 0 ? 'Aucun Pokémon sélectionné' : `${nombre} Pokémon sélectionné${nombre > 1 ? 's' : ''}`}</p>
          <button type="button" className="min-h-11 bg-surface-2 px-3" onClick={() => selectionnerLot(tousCoches ? new Set() : new Set(eligibles.map(p => p.uid)))}>{tousCoches ? 'Tout désélectionner' : 'Tout sélectionner'}</button>
          <button type="button" className="min-h-11 bg-surface-2 px-3 text-erreur-base" disabled={!nombre} aria-describedby={!nombre ? 'selection-vide' : undefined} onClick={() => { signalerLot(null); confirmation.current?.showModal(); }}>Relâcher la sélection</button>
          {!nombre && <p id="selection-vide">Sélectionne au moins un Pokémon non favori.</p>}
          <button type="button" className="min-h-11 bg-surface-2 px-3" onClick={() => { confirmation.current?.close(); selectionnerLot(null); }}>Annuler</button>
        </div>}
        {(recherche || actif) && <button type="button" className="min-h-11 bg-surface-2 px-3" onClick={() => { rechercher(''); filtrer('tous'); }}>Effacer la recherche et les filtres</button>}
        {pc.length === 0 ? <p {...cibleGrille}>Ton PC est vide. Capture des Pokémon pour les ranger ici.</p>
          : liste.length === 0 ? <p role="status" {...cibleGrille}>{!recherche && actif ? 'Aucun Pokémon ne correspond à ces filtres.' : `Aucun Pokémon ne correspond à « ${recherche} ».`}</p>
            : <ul {...cibleGrille} className={telephone ? 'grid min-w-0 auto-rows-fr grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(calc(var(--spacing)*36),1fr))] gap-4' : 'pc-grille cadre'}>
              {liste.map(pokemon => {
                const nom = nomDe(pokemon);
                return <li key={pokemon.uid} className="min-w-0">
                  <button type="button" aria-label={pokemon.oeuf ? `${nom}, ${progressionOeuf(pokemon.oeuf)}` : `${nom}, niveau ${pokemon.niveau}`} aria-pressed={selectionLot !== null ? effectifs.some(p => p.uid === pokemon.uid) : selection === pokemon.uid}
                    aria-disabled={selectionLot !== null && pokemon.favori ? true : undefined}
                    {...(!telephone && selectionLot === null ? {
                      draggable: true,
                      onDragStart: (event: DragEvent<HTMLElement>) => { event.dataTransfer.setData('text/plain', pokemon.uid); event.dataTransfer.effectAllowed = 'move'; glisser(pokemon.uid); },
                      onDragEnd: () => { glisser(null); survoler(null); },
                    } : {})}
                    className={`${!telephone && selectionLot === null ? 'cursor-grab ' : ''}cadre relative flex overflow-hidden h-full min-h-11 w-full items-center gap-2 p-2 text-left lg:grid lg:grid-rows-[auto_1fr_auto] lg:justify-items-center lg:p-4 lg:text-center hover:bg-selection ${(selectionLot !== null ? effectifs.some(p => p.uid === pokemon.uid) : selection === pokemon.uid) ? 'bg-selection' : 'bg-surface'}`}
                    onClick={event => {
                      if (selectionLot !== null) {
                        if (pokemon.favori) return;
                        const prochaine = new Set(selectionLot);
                        if (prochaine.has(pokemon.uid)) prochaine.delete(pokemon.uid); else prochaine.add(pokemon.uid);
                        selectionnerLot(prochaine);
                        return;
                      }
                      choisir(pokemon.uid);
                      if (!telephone && partenaire) {
                        const message = storeJeu.getState().echanger(pokemon.uid, partenaire);
                        signaler(message ? { message, echange } : null);
                        if (!message) selectionnerPartenaire(null);
                      } else if (!telephone || !panneau.current?.getClientRects().length) ouvrirFiche(pokemon.uid, event.currentTarget);
                    }}>
                    <span className="relative isolate grid size-12 shrink-0 max-w-full overflow-hidden place-items-center lg:size-24">
                      <RepereTags pokemon={pokemon} />
                      {telephone && <span aria-hidden="true" className="socle absolute bottom-2 -z-10 hidden h-4 w-20 bg-region-socle lg:block" />}
                      <Image src={spriteAffiche(pokemon)} genre="sprite" alt="" className={`size-12 lg:size-24 max-h-full max-w-full ${pokemon.shiny && !pokemon.oeuf ? 'halo-shiny' : ''} ${classeSprite(pokemon)}`} />
                    </span>
                    <span className="grid min-w-0 gap-1 lg:contents"><strong className="flex min-w-0 max-w-full items-center gap-1 lg:justify-center">
                      <span className="min-w-0 truncate">{nom}</span>
                      {(pokemon.sexe === 'femelle' || pokemon.sexe === 'male') && <IconeSexe sexe={pokemon.sexe} className="size-4" />}
                      {pokemon.favori && <><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="size-5 shrink-0 fill-current text-lien">
                        <path d="m12 2 3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1z" />
                      </svg><span className="sr-only">Favori</span></>}
                      {pokemon.shiny && !pokemon.oeuf && <span className="sr-only">Shiny</span>}
                    </strong>
                    {(!telephone || tri === 'dps') && !pokemon.oeuf && <span className="whitespace-nowrap text-region-accent font-bold">{formaterDps(dpsPc(pokemon))} DPS</span>}
                    {pokemon.oeuf ? <span>{progressionOeuf(pokemon.oeuf)}</span>
                      : <span className={telephone ? 'grid text-sm text-texte-doux' : 'text-sm text-texte-doux'}><span>N° {pokemon.numero}</span>{!telephone && ' · '}<span>Niv. {pokemon.niveau}</span></span>}{selectionLot !== null && (pokemon.favori ? <><svg aria-hidden="true" viewBox="0 0 24 24" className="absolute bottom-2 right-2 size-5" fill="none" stroke="currentColor"><rect x="5" y="10" width="14" height="11" /><path d="M8 10V6a4 4 0 0 1 8 0v4" /></svg><span className="sr-only">Favori verrouillé</span></> : selectionLot.has(pokemon.uid) && <svg aria-hidden="true" viewBox="0 0 24 24" className="absolute bottom-2 right-2 size-5" fill="none" stroke="currentColor"><path d="m4 12 5 5L20 6" /></svg>)}</span>
                  </button>
                </li>;
              })}
            </ul>}
      </div>
      <aside ref={panneau} className="pc-panneau cadre sticky top-8 hidden min-w-0 space-y-4 bg-surface p-4 lg:block">
        <h2 className={`font-titre text-xl font-semibold${telephone ? '' : ' text-region-accent'}`}>{telephone ? 'Équipe' : 'Ton équipe'} · {equipe.filter(Boolean).length} / 6</h2>
        <div className={!telephone ? 'pc-places grid gap-2' : 'grid gap-2'}>{places(false)}</div>
        {telephone && (pokemon ? <>
          <Image src={spriteAffiche(pokemon)} genre="sprite" alt="" className={`mx-auto size-24 max-w-full ${pokemon.shiny && !pokemon.oeuf ? 'halo-shiny' : ''} ${classeSprite(pokemon)}`} />
          <h2 className="break-words font-titre text-xl font-semibold">{nomDe(pokemon)}{pokemon.shiny && !pokemon.oeuf && <IconeShiny />}</h2>
          <p>{pokemon.oeuf ? progressionOeuf(pokemon.oeuf) : `N° ${pokemon.numero} · Niveau ${pokemon.niveau}`}</p>
          <p className="text-region-accent">{formaterDps(dpsPc(pokemon))} DPS</p>
          {!pokemon.oeuf && <BarreXp xp={pokemon.xp} maximum={calculerMaxXp(pokemon.numero, pokemon.niveau)} nom={nomDe(pokemon)} />}
          <button type="button" aria-pressed={pokemon.favori} className="min-h-11 bg-surface-2 px-4 py-2 hover:bg-selection"
            onClick={() => {
              const message = storeJeu.getState().basculerFavori(pokemon.uid);
              signaler(message ? { message, echange } : null);
            }}>{pokemon.favori ? 'Retire des favoris' : 'Ajoute aux favoris'}</button>
        </> : <h2 className="font-titre text-xl font-semibold">Aucune sélection</h2>)}
        {telephone && !ouvert && <button ref={placer} type="button" disabled={!pokemon || selectionLot !== null}
          className="min-h-11 bg-action px-4 py-2 text-action-texte hover:bg-action-survol disabled:text-texte-doux"
          onClick={() => {
            if (!pokemon) return;
            const message = storeJeu.getState().placerDansEquipe(pokemon.uid);
            signaler(message ? { message, echange } : null);
          }}>Placer dans l'équipe</button>}
        {telephone && pokemon && <button type="button" className="min-h-11 bg-surface-2 px-4 py-2 text-lien hover:bg-selection"
          onClick={event => ouvrirFiche(pokemon.uid, event.currentTarget)}>Ouvre la fiche</button>}
      </aside>
      </div>
    </>}
    {fiche !== null && <FichePokemon uid={fiche} ouvert={ouvert} fermer={() => afficher(false)} declencheur={declencheur} />}
    {selectionLot !== null && <dialog ref={confirmation} aria-labelledby="titre-relacher-lot" className="fiche-pokemon cadre w-full max-w-xl bg-surface p-4 text-base text-texte lg:p-8">
      <h2 id="titre-relacher-lot">Relâcher {nombre} Pokémon ?</h2>
      {shiny > 0 && <p>Attention : {shiny} shiny en {shiny === 1 ? 'fait partie' : 'font partie'}.</p>}
      <p>Ils partent pour toujours.</p>
      {erreurLot && <p role="alert">{erreurLot}</p>}
      <button type="button" autoFocus className="min-h-11 bg-surface-2 px-3" onClick={() => confirmation.current?.close()}>Annuler</button>
      <button type="button" className="min-h-11 bg-action px-3 text-action-texte" onClick={() => {
        const raison = storeJeu.getState().relacherLot(effectifs.map(p => p.uid));
        if (raison) { signalerLot(raison); return; }
        confirmation.current?.close(); selectionnerLot(null);
        notifier(`${nombre} Pokémon relâché${nombre > 1 ? 's' : ''}.`);
        titre.current?.focus();
      }}>Relâche définitivement</button>
    </dialog>}
  </section>;
}
