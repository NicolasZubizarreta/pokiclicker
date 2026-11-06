import { useId, useState } from 'react';
import './Plaques.css';
import './LigneCapture.css';

type Props = {
  balles: { cle: string; nom: string; image: string; quantite: number }[];
  possible: boolean;
  raison: string | null;
  enCours: boolean;
  capturer(cle: string): void;
};

export function LigneCapture({ balles, possible, raison, enCours, capturer }: Props) {
  const [choix, choisir] = useState<string | null>(null);
  const description = useId();
  const possedees = balles.filter(balle => balle.quantite > 0);
  const selection = possedees.find(balle => balle.cle === choix) ?? possedees[0];
  const explication = raison ?? (!selection ? "Tu n'as aucune balle." : null);

  return (
    <section aria-label="Capture" className="ligne-capture">
      {selection ? (
        <button
          type="button"
          className="plaque ligne-capture-balle"
          disabled={raison !== null}
          aria-label={`Balle choisie : ${selection.nom}, ×${selection.quantite}. Toucher pour changer`}
          onClick={() => choisir((possedees[(possedees.indexOf(selection) + 1) % possedees.length] ?? selection).cle)}
        >
          <img src={selection.image} alt="" width={30} height={30} className="image-rendering-pixelated size-8" />
          <span>
            <span className="block">{selection.nom}</span>
            <span className="block text-sm text-texte-doux">×{selection.quantite}</span>
          </span>
        </button>
      ) : (
        <p id={description} className="text-texte-doux">{explication}</p>
      )}
      {selection && explication && <p id={description} className="sr-only">{explication}</p>}
      <button
        type="button"
        className="plaque plaque-action text-lg"
        disabled={!possible || enCours || !selection}
        aria-describedby={explication ? description : undefined}
        onClick={() => { if (selection) capturer(selection.cle); }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false" className="size-6">
          <circle cx="12" cy="12" r="9" /><path d="M3 12h6m6 0h6" /><circle cx="12" cy="12" r="3" />
        </svg>Capturer
      </button>
    </section>
  );
}
