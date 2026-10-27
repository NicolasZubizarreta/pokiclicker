import { useEffect, useRef, useState } from 'react';
import donnees from '../../data/pantheon.json';
import { calendrierPantheon } from '../core/pantheon';
import type { PokemonPossede } from '../core/sauvegarde';
import { BoiteDialogue, mouvementReduit } from './BoiteDialogue';
import { apparenceSprite } from './easter-eggs';
import { nomAffiche } from './affichage-pokemon';
import { IconeShiny } from './IconeShiny';
import { creerConfettis } from './confettis';

export function Pantheon({ equipe, premiereVictoire, quitter }: {
  equipe: readonly PokemonPossede[]; premiereVictoire: boolean; quitter(): void;
}) {
  const [reduit] = useState(mouvementReduit);
  const [ligne, changerLigne] = useState<number | null>(null);
  const [ferme, fermer] = useState(false);
  const dialogue = useRef<HTMLDialogElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const chen = useRef<HTMLDivElement>(null);
  const rideau = useRef<HTMLDivElement>(null);
  const titre = useRef<HTMLHeadingElement>(null);
  const sortie = useRef<HTMLButtonElement>(null);
  const effets = useRef<HTMLDivElement>(null);
  const reprendre = useRef(() => {});
  const nettoyer = useRef(() => {});

  useEffect(() => {
    const fenetre = dialogue.current!;
    const precedent = document.activeElement;
    fenetre.showModal();
    sortie.current?.focus();
    const confettis = creerConfettis(effets.current!, { mouvementReduit: () => reduit });
    const animations: Animation[] = [];
    let minuteur: ReturnType<typeof setTimeout> | undefined;
    let arrete = false;
    const animer = (element: HTMLElement | null, images: Keyframe[], duration: number, iterations = 1) => {
      if (!reduit && element) animations.push(element.animate(images, { duration, iterations, fill: 'forwards', easing: 'ease-out' }));
    };
    nettoyer.current = () => {
      arrete = true;
      clearTimeout(minuteur);
      animations.forEach(animation => animation.cancel());
      confettis.arreter();
    };
    const calendrier = calendrierPantheon(equipe.length, premiereVictoire, reduit);
    let index = 0;
    let temps = 0;
    function avancer() {
      if (arrete) return;
      while (index < calendrier.length && calendrier[index]!.tMs === temps) {
        const { action } = calendrier[index++]!;
        switch (action.type) {
          case 'fondu-noir':
            animer(rideau.current, [{ opacity: 0 }, { opacity: 1 }], donnees.delais.fonduNoirMs); break;
          case 'fondu-retour':
            animer(rideau.current, [{ opacity: 1 }, { opacity: 0 }], donnees.delais.fonduRetourMs); break;
          case 'entree-chen':
            chen.current!.hidden = false;
            animer(chen.current, [{ transform: 'translateX(calc(-100% - var(--spacing) * 4))' }, { transform: 'translateX(0)' }], donnees.delais.entreeChenMs); break;
          case 'dialogues': changerLigne(0); reprendre.current = avancer; return;
          case 'sortie-chen':
            animer(chen.current, [{ transform: 'translateX(0)', opacity: 1 }, { transform: 'translateX(calc(-100% - var(--spacing) * 4))', opacity: 0 }], donnees.delais.sortieChenMs); break;
          case 'masquer-chen': chen.current!.hidden = true; break;
          case 'poser':
          case 'chute': {
            const place = scene.current!.querySelector<HTMLElement>(`[data-partenaire="${action.index}"]`)!;
            place.hidden = false;
            if (action.type === 'chute') animer(place, [
              { transform: `translateY(${(action.depart - action.y) / action.taille * 100}%)` },
              { transform: 'translateY(0)' },
            ], donnees.delais.niveauMs);
            break;
          }
          case 'niveau':
            scene.current!.querySelector<HTMLElement>(`[data-identite="${action.index}"]`)!.hidden = false; break;
          case 'titre':
            titre.current!.hidden = false;
            animer(titre.current, [{ transform: 'scale(2)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], donnees.delais.finalApresEquipeMs); break;
          case 'confettis': confettis.demarrer(); break;
          case 'fin':
            sortie.current!.classList.add('bg-action', 'text-action-texte');
            animer(sortie.current, [{ opacity: 1 }, { opacity: 0.7 }, { opacity: 1 }], donnees.delais.entrePokemonMs, Infinity); break;
        }
      }
      const prochaine = calendrier[index];
      if (prochaine) {
        const attente = prochaine.tMs - temps;
        temps = prochaine.tMs;
        minuteur = setTimeout(avancer, attente);
      }
    }
    avancer();
    return () => {
      nettoyer.current();
      fenetre.close();
      if (precedent instanceof HTMLElement && precedent.isConnected) precedent.focus();
    };
  }, [equipe, premiereVictoire, reduit]);

  function sortir() {
    if (ferme) return;
    nettoyer.current();
    fermer(true);
    quitter();
  }
  const geometrie = donnees.geometrie;
  const tailleScene = { width: 'min(100vw, 100dvh)' };
  return <dialog ref={dialogue} aria-label="Panthéon" onCancel={event => { event.preventDefault(); sortir(); }}
    className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden border-0 bg-fond p-0 text-texte backdrop:bg-fond">
    <div className="flex h-full items-center justify-center">
      <div ref={scene} style={tailleScene} className="relative aspect-square overflow-hidden">
        <img src="img/scenes/pantheon.webp" alt="" className="absolute inset-0 size-full object-contain" />
        {equipe.slice(0, donnees.socles.length).map((pokemon, index) => {
          const socle = donnees.socles[index]!;
          const apparence = apparenceSprite(pokemon);
          const position = { left: `${(socle.x - geometrie.tailleSprite / 2) * 100}%`,
            top: `${(socle.y - geometrie.tailleSprite + geometrie.decalageBase) * 100}%`, width: `${geometrie.tailleSprite * 100}%` };
          const niveau = { top: `${(geometrie.tailleSprite - geometrie.decalageBase + geometrie.decalageNiveau) / geometrie.tailleSprite * 100}%` };
          return <div key={pokemon.uid} data-partenaire={index} hidden style={position} className="absolute aspect-square text-center">
            <img src={apparence.src} alt={nomAffiche(pokemon)} className={`size-full object-contain ${apparence.photo ? '' : 'image-rendering-pixelated'} ${apparence.classe} ${pokemon.shiny ? 'halo-shiny' : ''}`} />
            <div data-identite={index} hidden style={niveau} className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-sm bg-fond px-1 text-xs lg:text-sm ${index % 2 ? 'max-lg:translate-y-9' : ''}`}>
              <strong>{nomAffiche(pokemon)} {pokemon.shiny && <IconeShiny decoratif={false} />}</strong>
              {!pokemon.oeuf && <span className="block">Niv. {pokemon.niveau}</span>}
            </div>
          </div>;
        })}
        <h1 ref={titre} hidden className="absolute inset-x-8 top-4 bg-fond p-3 text-center font-titre text-xl text-alerte-base lg:text-3xl">{donnees.titre}</h1>
        <div ref={chen} hidden className="absolute inset-x-4 bottom-20">
          <div className="flex items-end">
            <img src="img/sprites/chen/chen-2.png" alt="Professeur Chen" className="image-rendering-pixelated w-1/5 object-contain" />
            <div className="min-w-0 flex-1">
              {!ferme && ligne !== null && <BoiteDialogue key={ligne} reduit={reduit} commande={{ type: 'dialogue', evenement: 'pantheon', etape: ligne,
                locuteur: 'Professeur Chen', texte: donnees.dialogues[ligne]! }} terminer={() => {
                if (ligne + 1 < donnees.dialogues.length) changerLigne(ligne + 1);
                else { changerLigne(null); reprendre.current(); }
              }} />}
            </div>
          </div>
        </div>
        <div ref={effets} className="pointer-events-none absolute inset-0 overflow-hidden" />
        <div ref={rideau} aria-hidden="true" className="pointer-events-none absolute inset-0 bg-fond opacity-0" />
        <div className="absolute inset-x-0 bottom-4 flex justify-center">
          <button ref={sortie} type="button" onClick={sortir} className="cadre min-h-11 min-w-36 bg-surface px-4 py-2">{donnees.boutonSortie}</button>
        </div>
      </div>
    </div>
  </dialog>;
}
