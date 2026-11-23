export function FiltreMissingno() {
  return <svg width="0" height="0" aria-hidden="true" className="absolute pointer-events-none">
    <defs><filter id="filtre-missingno" x="-15%" y="0%" width="130%" height="100%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0 0.18" numOctaves="1" seed="39" />
      <feComponentTransfer>
        <feFuncR type="discrete" tableValues="0.15 0.4 0.5 0.6 0.85" />
        <feFuncG type="discrete" tableValues="0.5" />
      </feComponentTransfer>
      <feDisplacementMap in="SourceGraphic" scale="18" xChannelSelector="R" yChannelSelector="G" />
    </filter></defs>
  </svg>;
}
