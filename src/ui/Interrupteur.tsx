export function Interrupteur({ nom, actif, basculer }: { nom: string; actif: boolean; basculer(): void }) {
  return <button type="button" role="switch" aria-label={nom} aria-checked={actif} onClick={basculer}
    className="flex min-h-12 min-w-12 shrink-0 items-center justify-center px-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-region-accent">
    <span aria-hidden="true" className={`cadre flex h-6 w-12 items-center p-1 ${actif ? 'bg-succes-base' : 'bg-selection'}`}>
      <span className={`h-4 w-4 bg-surface transition-transform ${actif ? 'translate-x-6' : 'translate-x-0'}`} />
    </span>
  </button>;
}
