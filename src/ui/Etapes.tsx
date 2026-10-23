export function Etapes({ etape }: { etape: number }) {
  return <div className="flex w-full items-center justify-between gap-4 lg:w-auto">
    <span>Étape {etape} sur 10</span>
    <ol aria-label="Étapes de la zone" className="flex items-center gap-2">
      {Array.from({ length: 10 }, (_, i) => <li key={i} aria-label={i === 9 ? 'Étape 10 : boss' : `Étape ${i + 1}`}
        aria-current={etape === i + 1 ? 'step' : undefined}
        className={`${etape === i + 1 ? 'outline-2 outline-offset-2 outline-region-accent' : ''} ${i === 9 ? 'size-6 text-region-accent' : `size-2 ${i < etape - 1 ? 'bg-region-socle' : 'bg-bordure'}`}`}>
        {i === 9 && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="9" /><path d="M3 12h6m6 0h6" /><circle cx="12" cy="12" r="3" />
        </svg>}
      </li>)}
    </ol>
  </div>;
}
