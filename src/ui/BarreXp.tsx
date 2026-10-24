export function BarreXp({ xp, maximum, nom }: { xp: number; maximum: number; nom: string }) {
  if (maximum === 0) return null;
  const proportion = Math.max(0, Math.min(1, xp / maximum));
  // Seule la transformation sans unité varie ; dimensions et couleurs viennent des jetons.
  const transformation = { transform: `scaleX(${proportion})` };
  return <div role="progressbar" aria-label={`XP de ${nom}`} aria-valuemin={0}
    aria-valuemax={maximum} aria-valuenow={xp} className="relative h-1 overflow-hidden bg-fond">
    <span className="barre-pv absolute inset-0 origin-left bg-info-base" style={transformation} />
  </div>;
}
