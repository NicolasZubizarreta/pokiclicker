import { useId } from 'react';

export function IconeShiny({ decoratif = true }: { decoratif?: boolean }) {
  const degrade = useId();
  return <svg viewBox="0 0 24 24" width="1em" height="1em" focusable="false"
    aria-hidden={decoratif ? true : undefined} role={decoratif ? undefined : 'img'}
    aria-label={decoratif ? undefined : 'Chromatique'} className="inline-block shrink-0 align-middle">
    <defs>
      <linearGradient id={degrade} x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="var(--color-accent-400)" />
        <stop offset="1" stopColor="var(--color-succes-base-sombre)" />
      </linearGradient>
    </defs>
    <g fill={`url(#${degrade})`} stroke="var(--color-neutre-950)" strokeWidth="1.8" strokeLinejoin="round">
      <path d="m9 4 2.5 6.5L18 13l-6.5 2.5L9 22l-2.5-6.5L1 13l5.5-2.5Z" />
      <path d="m19 1 1.2 3.8L23 6l-2.8 1.2L19 11l-1.2-3.8L15 6l2.8-1.2Z" />
    </g>
  </svg>;
}
