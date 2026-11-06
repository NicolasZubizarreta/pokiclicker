import { useEffect, useRef, useState } from 'react';
import { reglages } from '../core/reglages';
import type { Destination } from './store';
import './ZoneLigne.css';

// `etape` est null hors d'une zone de combat (labo, Bourg Palette) : la ligne ne garde alors que les deux flèches.
type Props = { etape: number | null; precedente: Destination | null; suivante: Destination | null; aller(zoneId: string): void };

export function ZoneLigne({ etape, precedente, suivante, aller }: Props) {
  const [raison, annoncer] = useState<string | null>(null);
  const minuterie = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(minuterie.current), []);

  const naviguer = (destination: Destination | null) => {
    if (!destination) return;
    if (destination.ouverte) {
      aller(destination.id);
      return;
    }
    clearTimeout(minuterie.current);
    annoncer(destination.raison);
    if (destination.raison !== null) {
      minuterie.current = setTimeout(() => annoncer(null), reglages.interface.annonceMs);
    }
  };

  return (
    <div className="zone-ligne">
      <button type="button" className="zone-nav zone-nav-precedente" aria-label={`Zone précédente${precedente ? ` : ${precedente.nom}` : ''}`} aria-disabled={!precedente?.ouverte} onClick={() => naviguer(precedente)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      <div className="zone-etapes">
        {etape !== null && <>
          <div className="zone-marques">
            {Array.from({ length: 10 }, (_, index) => {
              const numero = index + 1;
              return <span key={numero} aria-hidden="true" className={`zone-marque${numero < etape ? ' zone-marque-passee' : ''}${numero === etape ? ' zone-marque-courante' : ''}${numero === 10 ? ' zone-marque-boss' : ''}`} />;
            })}
          </div>
          <span className="text-sm text-texte-doux">{etape}/10</span>
          <span className="sr-only">Étape {etape} sur 10</span>
        </>}
      </div>
      <button type="button" className="zone-nav zone-nav-suivante" aria-label={`Zone suivante${suivante ? ` : ${suivante.nom}` : ''}`} aria-disabled={!suivante?.ouverte} onClick={() => naviguer(suivante)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {raison !== null && <p role="status" className="zone-raison cadre">{raison}</p>}
    </div>
  );
}
