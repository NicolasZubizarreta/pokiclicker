import { useEffect, useRef, useState } from 'react';
import type { Commande } from '../core/evenements';
import { reglages } from '../core/reglages';

type Dialogue = Extract<Commande, { type: 'dialogue' }>;

const mouvementReduit = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function Boite({ commande, reduit, terminer, annonce }: {
  commande: Dialogue; reduit: boolean; terminer(): void; annonce: string | null;
}) {
  const { texte } = commande;
  const [lettres, ecrire] = useState(reduit ? texte.length : 0);
  const rendue = useRef(false);
  useEffect(() => {
    if (lettres >= texte.length) return;
    const minuteur = setTimeout(() => ecrire(lettres + 1), reglages.intro.caractereMs);
    return () => clearTimeout(minuteur);
  }, [lettres, texte]);
  const fini = lettres >= texte.length;
  return <div className="grid gap-2">
    {annonce && <p aria-live="polite" className="cadre flex items-center justify-center gap-2 bg-surface p-2 text-center font-titre">
      {annonce.startsWith('+') && <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" className="size-6 motion-safe:cadenas-brise"><rect x="5" y="11" width="14" height="10" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>}
      {annonce}
    </p>}
    <button type="button" aria-label={`${commande.locuteur} : ${texte}`}
      onClick={() => {
        if (!fini) { ecrire(texte.length); return; }
        if (rendue.current) return;
        rendue.current = true;
        terminer();
      }}
      className="cadre relative min-h-24 w-full bg-surface p-4 pr-10 text-left">
      <span aria-hidden="true" className="block font-titre text-lien">{commande.locuteur}</span>
      <span aria-hidden="true" className="block break-words leading-loose">{texte.slice(0, lettres)}</span>
      {fini && <span aria-hidden="true" className="absolute bottom-2 right-2 text-alerte-base motion-safe:animate-bounce">▼</span>}
    </button>
  </div>;
}

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
      className={`image-rendering-pixelated pointer-events-none absolute bottom-24 left-1/2 h-1/2 w-auto max-w-[70%] object-contain object-bottom chen-en-place motion-safe:chen-entree motion-safe:intro-pose-fondu ${opaque ? 'opacity-100' : 'opacity-0'}`} />
    {ligne && boiteVisible && <Boite key={ligne.etape} commande={ligne} reduit={reduit}
      terminer={terminerEtape} annonce={annonce} />}
  </section>;
}
