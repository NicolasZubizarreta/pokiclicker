import { formaterNombre } from './nombres';

export function BarrePv({ pv, maximum, nom, tuto }: { pv: number; maximum: number; nom: string; tuto?: string }) {
  const proportion = Math.max(0, Math.min(1, pv / maximum));
  // Seule la transformation sans unité varie ; dimensions et couleurs viennent des jetons.
  const transformation = { transform: `scaleX(${proportion})` };
  return <div data-tuto={tuto}>
    <div role="progressbar" aria-label={`PV de ${nom}`} aria-valuemin={0}
      aria-valuemax={maximum} aria-valuenow={Math.ceil(pv)} className="relative my-1 h-3 overflow-hidden bg-fond">
      <span className="barre-pv barre-fantome absolute inset-0 origin-left bg-texte-doux" style={transformation} />
      <span className={`barre-pv absolute inset-0 origin-left ${proportion <= .2 ? 'bg-erreur-base' : proportion <= .5 ? 'bg-alerte-base' : 'bg-succes-base'}`}
        style={transformation} />
    </div>
    {/* Les deux valeurs restent ensemble (jamais de retour à la ligne après la barre oblique) ; en 14 px sur téléphone, « PV 2 237 440 / 2 237 440 » tient dans les 188 px de la carte à 390 px. */}
    <p className="tabular-nums max-lg:text-sm">PV <span className="whitespace-nowrap">{formaterNombre(Math.ceil(pv))} / {formaterNombre(maximum)}</span></p>
  </div>;
}
