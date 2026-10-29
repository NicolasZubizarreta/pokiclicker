import { useEffect, useId, useRef, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { reglages } from '../core/reglages';

export function BoutonAction({ icone, nom, actif, verrouille = false, infobulle = nom, onClick }: {
  icone: ReactNode;
  nom: string;
  actif?: boolean;
  verrouille?: boolean;
  infobulle?: string;
  onClick(event: MouseEvent<HTMLButtonElement>): void;
}) {
  const id = useId();
  const [annonce, annoncer] = useState(false);
  const minuterie = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(minuterie.current), []);
  const expliquer = () => {
    if (!verrouille) return;
    clearTimeout(minuterie.current);
    annoncer(true);
    minuterie.current = setTimeout(() => annoncer(false), reglages.interface.annonceMs);
  };
  return <button type="button" aria-label={nom} aria-pressed={actif}
    aria-disabled={verrouille || undefined} aria-describedby={id}
    className="bandeau-action-bouton group min-h-11 min-w-11"
    onFocus={expliquer} onPointerDown={expliquer}
    onClick={event => { if (verrouille) expliquer(); else onClick(event); }}>
    {icone}
    <span id={id} role="tooltip" data-annonce={verrouille && annonce}
      className={`bandeau-action-infobulle invisible text-sm group-hover:visible ${verrouille ? '' : 'group-focus-visible:visible'}`}>{infobulle}</span>
  </button>;
}
