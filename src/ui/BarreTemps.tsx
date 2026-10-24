export function BarreTemps({ restantMs, totalMs }: { restantMs: number; totalMs: number }) {
  const secondes = Math.ceil(restantMs / 1000);
  const texte = `${secondes} seconde${secondes === 1 ? '' : 's'}`;
  const proportion = Math.max(0, Math.min(1, restantMs / totalMs));
  const transformation = { transform: `scaleX(${proportion})` };
  return <div>
    <p className="flex justify-between gap-2"><span>Temps</span><span className="tabular-nums">{texte}</span></p>
    <div role="progressbar" aria-label="Temps restant" aria-valuemin={0}
      aria-valuemax={totalMs / 1000} aria-valuenow={secondes} aria-valuetext={texte}
      className="relative h-1 overflow-hidden bg-fond">
      <span className="barre-pv absolute inset-0 origin-left bg-alerte-base" style={transformation} />
    </div>
  </div>;
}
