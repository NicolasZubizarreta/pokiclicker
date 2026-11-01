import { Fragment, useId, useState } from 'react';

export function BarreCapture({ balles, possible, raison, enCours, capturer }: {
  balles: { cle: string; nom: string; image: string; quantite: number }[];
  possible: boolean;
  raison: string | null;
  enCours: boolean;
  capturer(cle: string): void;
}) {
  const [choix, choisir] = useState<string | null>(null);
  const description = useId();
  const possedees = balles.filter(balle => balle.quantite > 0);
  const selection = possedees.find(balle => balle.cle === choix) ?? possedees[0];
  const explication = raison ?? (!selection ? "Tu n'as aucune balle." : null);

  return <section aria-label="Capture" tabIndex={selection && explication ? 0 : undefined}
    aria-describedby={selection && explication ? description : undefined}
    className="group relative flex min-w-0 items-center text-sm text-texte">
    {!selection && explication && <p id={description} className="min-w-0 self-center px-2 text-texte-doux">{explication}</p>}
    {selection && <div className="capture-balles flex min-w-0 items-center overflow-x-auto">
      {possedees.map(balle => <Fragment key={balle.cle}>
        <button type="button" aria-label={`${balle.nom} ×${balle.quantite}`} aria-pressed={selection?.cle === balle.cle}
          disabled={raison !== null}
          className="flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1 px-2 py-1 aria-pressed:bg-selection disabled:opacity-60"
          onClick={() => choisir(balle.cle)}>
          <img src={balle.image} alt="" width={24} height={24} className="image-rendering-pixelated h-6 w-6 shrink-0" />
          <span aria-hidden="true">×{balle.quantite}</span>
        </button>
        <span aria-hidden="true" className="text-texte-doux">|</span>
      </Fragment>)}
    </div>}
    <button type="button" className="min-h-11 min-w-11 shrink-0 px-2 py-1 disabled:text-texte-doux disabled:opacity-60"
      disabled={!possible || enCours || !selection} aria-describedby={explication ? description : undefined}
      onClick={() => { if (selection) capturer(selection.cle); }}>Capturer</button>
    {selection && explication && <p id={description} className="sr-only">{explication}</p>}
  </section>;
}
