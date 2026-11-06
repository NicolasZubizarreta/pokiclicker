import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { PropsBoiteBadges } from './BoiteBadges';
import { Image } from './Image';
import { IconeBadge } from './icones';
import { IconeRetour } from './icones-menu';

type Badge = PropsBoiteBadges['badges'][number];
type Props = { badges: Badge[]; retour(): void };

function Illustration({ badge, grand = false }: { badge: Badge; grand?: boolean }) {
  return <div className={`${grand ? 'size-32' : 'size-16'} mx-auto flex items-center justify-center ${badge.obtenu ? '' : 'brightness-0 invert opacity-30'}`}>
    {badge.image === null ? <IconeBadge /> : <Image src={badge.image} genre="badge" alt="" className="h-auto w-full" />}
  </div>;
}

function DetailBadge({ badge, fermer }: { badge: Badge; fermer(): void }) {
  const dialogue = useRef<HTMLDialogElement>(null);
  const titre = useId();
  useEffect(() => {
    const origine = document.activeElement;
    const fenetre = dialogue.current!;
    fenetre.showModal();
    fenetre.querySelector('button')?.focus();
    return () => {
      fenetre.close();
      if (origine instanceof HTMLElement && origine.isConnected) origine.focus();
    };
  }, []);
  return createPortal(<dialog ref={dialogue} aria-labelledby={titre}
    className="guide-fenetre cadre w-full max-w-3xl bg-surface p-0 text-base text-texte"
    onCancel={event => { event.preventDefault(); fermer(); }}
    onPointerDown={event => { if (event.target === event.currentTarget) fermer(); }}>
    <header className="flex items-center justify-between gap-4 p-4">
      <h2 id={titre} className="font-titre text-2xl font-semibold">Badge {badge.nom}</h2>
      <button type="button" onClick={fermer} aria-label="Fermer le badge" className="min-h-11 min-w-11 bg-surface-2 text-xl hover:bg-selection">×</button>
    </header>
    <div className="fiche-contenu grid min-w-0 gap-2 px-4 pb-4">
      <Illustration badge={badge} grand />
      <span className={`cadre justify-self-center px-2 py-1 ${badge.obtenu ? 'bg-succes-fond text-succes-texte' : 'bg-surface-2'}`}>
        {badge.obtenu ? 'Obtenu' : 'Pas encore obtenu'}
      </span>
      <dl>
        <dt className="font-bold">Effet</dt><dd>{badge.description}</dd>
        <dt className="font-bold">Arène</dt><dd>{badge.arene}</dd>
      </dl>
      {!badge.obtenu && <p className="text-texte-doux">Bats le champion de l'arène pour gagner ce badge. Son effet est permanent.</p>}
    </div>
  </dialog>, document.body);
}

export function BadgesTelephone({ badges, retour }: Props) {
  const [selection, selectionner] = useState<Badge | null>(null);
  const obtenus = badges.filter(badge => badge.obtenu).length;
  return <section className="mx-auto max-w-screen-xl space-y-4 text-base">
    <header className="flex items-center gap-2">
      <button type="button" aria-label="Retour au menu" onClick={retour} className="flex min-h-11 min-w-11 items-center justify-center bg-surface-2 hover:bg-selection"><IconeRetour /></button>
      <h1 tabIndex={-1} className="font-titre text-2xl font-semibold">Badges</h1>
      <span className={`cadre ml-auto px-2 py-1 ${obtenus ? 'bg-succes-fond text-succes-texte' : 'bg-surface-2'}`}>{obtenus} / {badges.length}</span>
    </header>
    <p role="status">{obtenus ? 'Touche un badge pour voir son effet.' : "Aucun badge obtenu. Bats les champions d'arène !"}</p>
    <div className="grid grid-cols-2 gap-2">
      {badges.map(badge => <button key={badge.id} type="button" onClick={() => selectionner(badge)}
        aria-label={badge.obtenu ? `Badge ${badge.nom} : ${badge.description}` : `Badge ${badge.nom}, à gagner : ${badge.arene}`}
        className={`cadre flex min-h-11 min-w-11 flex-col items-center gap-2 bg-surface p-3 ${badge.obtenu ? 'border-succes-base' : ''}`}>
        <Illustration badge={badge} />
        <span className="font-titre text-lg font-bold">{badge.nom}</span>
        <span className="text-sm text-texte-doux">{badge.obtenu ? badge.description : `À gagner : ${badge.arene}`}</span>
      </button>)}
    </div>
    {selection && <DetailBadge badge={selection} fermer={() => selectionner(null)} />}
  </section>;
}
