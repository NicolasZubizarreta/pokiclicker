import { useId, useRef, useState, type ReactNode } from 'react';
import './Plaques.css';
import './LigneCapture.css';

type Props = {
  balles: { cle: string; nom: string; image: string; quantite: number }[];
  possible: boolean;
  raison: string | null;
  enCours: boolean;
  capturer(cle: string): void;
  /** Balle mémorisée par le jeu : sert tant que le joueur n'a pas touché la ligne depuis l'ouverture de la page. */
  choisie?: string | null;
  choisir?(cle: string): void;
  /** Bouton carré à droite de « Capturer » (Fauchage une fois débloqué). */
  outil?: ReactNode;
};

export function LigneCapture({ balles, possible, raison, enCours, capturer, outil, choisie, choisir: memoriser }: Props) {
  const [local, fixerLocal] = useState<string | null>(null);
  const choix = local ?? choisie ?? null;
  const choisir = (cle: string) => { fixerLocal(cle); memoriser?.(cle); };
  const description = useId();
  const dialogue = useRef<HTMLDialogElement>(null);
  const possedees = balles.filter(balle => balle.quantite > 0);
  const selection = possedees.find(balle => balle.cle === choix) ?? possedees[0];
  const explication = raison ?? (!selection ? "Tu n'as aucune balle." : null);

  return (
    <section aria-label="Capture" className={`ligne-capture ${outil ? 'ligne-capture-outil' : ''}`}>
      {selection ? (
        <button
          type="button"
          data-raccourci="balle"
          className="plaque ligne-capture-balle"
          disabled={raison !== null}
          aria-label={`${selection.nom} ×${selection.quantite}, changer de balle`}
          onClick={() => dialogue.current?.showModal()}
        >
          <kbd aria-hidden="true" className="touche-pc">B</kbd>
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
        data-tuto="capturer"
        data-raccourci="capturer"
        className="plaque plaque-action text-lg"
        disabled={!possible || enCours || !selection}
        aria-describedby={explication ? description : undefined}
        onClick={() => { if (selection) capturer(selection.cle); }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false" className="size-6 shrink-0">
          <circle cx="12" cy="12" r="9" /><path d="M3 12h6m6 0h6" /><circle cx="12" cy="12" r="3" />
        </svg>Capturer<kbd aria-hidden="true" className="touche-pc">C</kbd>
      </button>
      {outil}
      <dialog ref={dialogue} aria-label="Choisis une balle" className="fiche-pokemon cadre w-full max-w-xl bg-surface p-4 text-base text-texte">
        <h2 className="font-titre text-xl">Choisis une balle</h2>
        <div className="grid gap-2 py-4">{balles.map(balle => <button key={balle.cle} type="button" className="plaque" disabled={balle.quantite === 0}
          aria-pressed={selection?.cle === balle.cle} onClick={() => { choisir(balle.cle); dialogue.current?.close(); }}>
          <img src={balle.image} alt="" width={30} height={30} />{balle.nom} ×{balle.quantite}
        </button>)}</div>
        <button type="button" className="plaque" onClick={() => dialogue.current?.close()}>Fermer</button>
      </dialog>
    </section>
  );
}
