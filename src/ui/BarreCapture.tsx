import { useId, useState } from 'react';

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

  return <section aria-label="Capture" className="grid min-w-0 gap-1 text-sm text-texte lg:flex lg:flex-wrap lg:items-center lg:gap-2">
    {!selection && explication && <p id={description} className="self-center text-texte-doux">{explication}</p>}
    {selection && <div className="grid grid-cols-3 gap-1 lg:flex lg:flex-wrap lg:gap-2">
      {possedees.map(balle => <button key={balle.cle} type="button"
        aria-label={`${balle.nom} ×${balle.quantite}`} aria-pressed={selection?.cle === balle.cle} disabled={raison !== null}
        className="cadre flex min-h-11 min-w-11 items-center justify-center gap-1 bg-surface p-1 aria-pressed:bg-selection"
        onClick={() => choisir(balle.cle)}>
        <img src={balle.image} alt="" width={24} height={24} className="image-rendering-pixelated h-6 w-6 shrink-0" />
        <span aria-hidden="true">×{balle.quantite}</span>
      </button>)}
    </div>}
    <button type="button" className="cadre min-h-11 min-w-11 bg-surface px-2 py-1"
      disabled={!possible || enCours || !selection} aria-describedby={explication ? description : undefined}
      onClick={() => { if (selection) capturer(selection.cle); }}>Capturer</button>
    {selection && explication && <p id={description} className="w-full text-texte-doux">{explication}</p>}
  </section>;
}
