export function IconeShiny({ decoratif = true }: { decoratif?: boolean }) {
  return <svg viewBox="0 0 24 24" width="1em" height="1em" focusable="false"
    aria-hidden={decoratif ? true : undefined} role={decoratif ? undefined : 'img'}
    aria-label={decoratif ? undefined : 'Chromatique'} className="inline-block shrink-0 align-middle">
    <path fill="var(--color-alerte-base-sombre)" d="M12 1l2.6 8.4L23 12l-8.4 2.6L12 23l-2.6-8.4L1 12l8.4-2.6Z" />
  </svg>;
}
