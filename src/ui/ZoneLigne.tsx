import { useEffect, useRef, useState } from 'react';
import { reglages } from '../core/reglages';
import type { Destination } from './store';
import './ZoneLigne.css';

// `etape` est null hors d'une zone de combat (labo, Bourg Palette) : la ligne ne garde alors que le titre et les boutons,
// et « Suivant » nomme la zone où il mène. Sans destination, le bouton n'est pas affiché.
type Props = { nom?: string; etape: number | null; precedente: Destination | null; suivante: Destination | null; aller(zoneId: string): void };

function Chevron() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>;
}

export function ZoneLigne({ nom, etape, precedente, suivante, aller }: Props) {
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
      {precedente && <button type="button" className="zone-nav zone-nav-precedente" aria-label={`Zone précédente : ${precedente.nom}`} aria-disabled={!precedente.ouverte} onClick={() => naviguer(precedente)}>
        <Chevron /><span>Précédent</span>
      </button>}
      {nom && <strong className="zone-titre font-titre text-lg">{nom}</strong>}
      <div className="zone-etapes">
        {etape !== null && <>
          <div className="zone-marques">
            {Array.from({ length: 10 }, (_, index) => {
              const numero = index + 1;
              return <span key={numero} aria-hidden="true" className={`zone-marque${numero < etape ? ' zone-marque-passee' : ''}${numero === etape ? ' zone-marque-courante' : ''}${numero === 10 ? ' zone-marque-boss' : ''}`} />;
            })}
          </div>
          <span className="zone-etape-texte text-sm text-texte-doux">{etape}/10</span>
          <span className="sr-only">Étape {etape} sur 10</span>
        </>}
      </div>
      {suivante && <button type="button" className="zone-nav zone-nav-suivante" aria-label={`Zone suivante : ${suivante.nom}`} aria-disabled={!suivante.ouverte} onClick={() => naviguer(suivante)}>
        <span>Suivant{etape === null ? ` : ${suivante.nom}` : ''}</span><Chevron />
      </button>}
      {raison !== null && <p role="status" className="zone-raison cadre">{raison}</p>}
    </div>
  );
}
