import { useEffect, useState } from 'react';
import type { Commande } from '../core/evenements';
import { reglages } from '../core/reglages';
import { BoiteDialogue, mouvementReduit } from './BoiteDialogue';

/** Dialogue d’introduction : Chen glisse puis parle, écriture lettre par lettre, un toucher complète la ligne, le suivant passe à la suivante. */
export function DialogueIntro({ commande, sacOuvert, carteOuverte, terminerEtape }: {
  commande: Commande | null; sacOuvert: boolean; carteOuverte: boolean; terminerEtape(): void;
}) {
  const [reduit] = useState(mouvementReduit);
  const ligne = commande?.type === 'dialogue' ? commande : null;
  const [boiteVisible, montrerBoite] = useState(reduit);
  const [cible, fixerCible] = useState(ligne?.pose ?? 'chen-1');
  if (ligne?.pose && ligne.pose !== cible) fixerCible(ligne.pose);
  const [pose, poser] = useState(cible);
  const [opaque, rendreOpaque] = useState(true);
  const [vu, voir] = useState({ sacOuvert, carteOuverte, etape: ligne?.etape });
  const [annonce, annoncer] = useState<string | null>(null);
  if (vu.etape !== ligne?.etape) {
    voir({ sacOuvert, carteOuverte, etape: ligne?.etape });
    annoncer(!vu.sacOuvert && sacOuvert ? '+5 POKÉBALLS !' : !vu.carteOuverte && carteOuverte ? 'CARTE DÉBLOQUÉE !' : null);
  }

  useEffect(() => {
    if (reduit) return;
    const minuteur = setTimeout(() => montrerBoite(true), reglages.intro.dialogueDelaiMs);
    return () => clearTimeout(minuteur);
  }, [reduit]);

  useEffect(() => {
    if (reduit || cible === pose) return;
    let fondu: ReturnType<typeof setTimeout> | undefined;
    const delai = setTimeout(() => {
      rendreOpaque(false);
      fondu = setTimeout(() => { poser(cible); rendreOpaque(true); }, reglages.intro.poseFonduMs);
    }, reglages.intro.poseDelaiMs);
    return () => { clearTimeout(delai); clearTimeout(fondu); };
  }, [cible, pose, reduit]);
  const affichee = reduit ? cible : pose;

  return <section aria-label="Prof. Chen" className="relative grid min-h-64 content-end gap-2 overflow-hidden p-2">
    <img src={`img/sprites/chen/${affichee}.png`} alt="" width={120} height={120}
      className={`image-rendering-pixelated pointer-events-none absolute bottom-24 left-1/2 h-40 w-auto max-w-[70%] object-contain object-bottom chen-en-place motion-safe:chen-entree motion-safe:intro-pose-fondu ${opaque ? 'opacity-100' : 'opacity-0'}`} />
    <p aria-live="polite" className={annonce ? 'cadre flex items-center justify-center gap-2 bg-surface p-2 text-center font-titre' : 'sr-only'}>
      {annonce?.startsWith('+') && <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" className="size-6 motion-safe:cadenas-brise"><rect x="5" y="11" width="14" height="10" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>}
      {annonce}
    </p>
    {ligne && boiteVisible && <BoiteDialogue key={ligne.etape} commande={ligne} reduit={reduit}
      terminer={terminerEtape} />}
  </section>;
}
