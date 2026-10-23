export function BarrePv({ pv, maximum, nom }: { pv: number; maximum: number; nom: string }) {
  const proportion = Math.max(0, Math.min(1, pv / maximum));
  // Seule la transformation sans unité varie ; dimensions et couleurs viennent des jetons.
  const transformation = { transform: `scaleX(${proportion})` };
  return <div>
    <div role="progressbar" aria-label={`PV de ${nom}`} aria-valuemin={0}
      aria-valuemax={maximum} aria-valuenow={Math.ceil(pv)} className="relative my-1 h-3 overflow-hidden bg-fond">
      <span className="barre-pv barre-fantome absolute inset-0 origin-left bg-texte-doux" style={transformation} />
      <span className={`barre-pv absolute inset-0 origin-left ${proportion <= .2 ? 'bg-erreur-base' : proportion <= .5 ? 'bg-alerte-base' : 'bg-succes-base'}`}
        style={transformation} />
    </div>
    <p>PV {Math.ceil(pv)} / {maximum}</p>
  </div>;
}
