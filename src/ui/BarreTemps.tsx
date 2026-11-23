export function BarreTemps({ restantMs, totalMs }: { restantMs: number; totalMs: number }) {
  const secondes = Math.ceil(restantMs / 1000);
  const texte = `${secondes} seconde${secondes === 1 ? '' : 's'}`;
  const proportion = Math.max(0, Math.min(1, restantMs / totalMs));
  // Dernier tiers du temps (10 s sur 30) : barre et chiffre passent au rouge d'erreur, le chiffre bat sans toucher la mise en page.
  const critique = restantMs > 0 && restantMs <= totalMs / 3;
  const transformation = { transform: `scaleX(${proportion})` };
  return <div>
    <p className="flex justify-between gap-2"><span>Temps</span><span className={`tabular-nums ${critique ? 'font-bold text-erreur-base motion-safe:animate-pulse' : ''}`}>{texte}</span></p>
    <div role="progressbar" aria-label="Temps restant" aria-valuemin={0}
      aria-valuemax={totalMs / 1000} aria-valuenow={secondes} aria-valuetext={texte}
      className="relative h-1 overflow-hidden bg-fond">
      <span className={`barre-pv absolute inset-0 origin-left ${critique ? 'bg-erreur-base' : 'bg-alerte-base'}`} style={transformation} />
    </div>
  </div>;
}
