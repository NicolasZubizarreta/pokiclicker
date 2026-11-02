import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Commande } from '../core/evenements';
import { kanto } from '../core/regions';
import taillesImages from '../../public/img/tailles.json';
import { BoiteDialogue, mouvementReduit } from './BoiteDialogue';
import { cheminDecor } from './precharger';
import './SceneFin.css';

const tailles: Record<string, { largeur: number; hauteur: number }> = taillesImages;

type Phase = 'glitch' | 'entree' | 'parole';

/**
 * Scène plein écran d'un événement de la fin de partie (V1 : `startEndingSequence`, `startChenChallengeIntro`,
 * `startChenVictorySequence`) : glitch noir, décor du lieu, Chen qui entre, puis dialogue lettre par lettre.
 * Montée une seule fois par événement (clé = identifiant de l'événement) : seules les répliques changent.
 */
export function SceneFin({ commande, terminerEtape }: {
  commande: Extract<Commande, { type: 'dialogue' }>; terminerEtape(): void;
}) {
  const scene = commande.scene!;
  const [reduit] = useState(mouvementReduit);
  const dialogue = useRef<HTMLDialogElement>(null);
  const [phase, fixerPhase] = useState<Phase>(reduit ? 'parole' : scene.glitchMs ? 'glitch' : 'entree');
  useEffect(() => {
    const fenetre = dialogue.current;
    fenetre?.showModal();
    return () => fenetre?.close();
  }, []);
  useEffect(() => {
    if (phase === 'parole') return;
    const minuteur = setTimeout(() => fixerPhase(phase === 'glitch' ? 'entree' : 'parole'),
      phase === 'glitch' ? scene.glitchMs : scene.boiteMs);
    return () => clearTimeout(minuteur);
  }, [phase, scene.glitchMs, scene.boiteMs]);

  // Les lieux hors carte (le labo) sont identifiés par leur dernier segment : « kanto.labo » → « labo ».
  const decor = cheminDecor(kanto.lieu(scene.zone.split('.').at(-1)!));
  const dimensions = tailles[decor]!;
  const vitrine = phase === 'parole' ? commande.vitrine : undefined;
  const taille = vitrine && tailles[vitrine.image];
  const style = {
    '--scene-ratio': dimensions.largeur / dimensions.hauteur,
    '--scene-entree': `${scene.entreeMs}ms`,
    '--scene-glitch': `${scene.glitchMs ?? 0}ms`,
  } as CSSProperties;

  return <dialog ref={dialogue} aria-label="Dialogue de scène" data-region="kanto" data-theme="dark"
    className="scene-fin bg-fond text-texte" style={style} onCancel={event => event.preventDefault()}>
    <div className="scene-fin-cadre">
      <img src={decor} alt="" width={dimensions.largeur} height={dimensions.hauteur} className="scene-fin-decor" />
      {phase !== 'glitch' && <img src={`img/sprites/chen/${scene.pose}.png`} alt="" width={120} height={120}
        className={`scene-fin-chen scene-fin-chen-${scene.entree} image-rendering-pixelated`} />}
      {vitrine && <img key={commande.etape} src={vitrine.image} alt="" data-vitrine={vitrine.animation}
        width={taille?.largeur} height={taille?.hauteur}
        className={`scene-fin-vitrine scene-fin-vitrine-${vitrine.animation}`} />}
      {vitrine?.annonce && <p role="status" aria-live="polite"
        className="scene-fin-annonce cadre bg-surface p-2 text-center font-titre">{vitrine.annonce}</p>}
      {phase === 'parole' && <div className="scene-fin-boite">
        <BoiteDialogue key={`${commande.evenement}:${commande.etape}`} commande={commande} reduit={reduit}
          terminer={terminerEtape} />
      </div>}
      {phase === 'glitch' && <div aria-hidden="true" className="scene-fin-glitch" />}
    </div>
  </dialog>;
}
