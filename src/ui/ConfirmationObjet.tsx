import { useId } from 'react';

export function ConfirmationObjet({ objet, nom, valider, annuler }: {
  objet: string;
  nom: string;
  valider(): void;
  annuler(): void;
}) {
  const question = `Utiliser ${objet} sur ${nom} ?`;
  const identifiant = useId();
  return <div role="group" aria-labelledby={identifiant} className="cadre absolute inset-0 z-20 flex flex-wrap content-center items-center justify-center gap-2 overflow-auto bg-surface p-3 text-center text-base text-texte">
    <p id={identifiant} className="basis-full">{question}</p>
    <button type="button" aria-label="Valider" className="cadre min-h-11 min-w-11 bg-action p-3 text-action-texte"
      onClick={valider}>✓</button>
    <button type="button" aria-label="Annuler" className="cadre min-h-11 min-w-11 bg-surface p-3"
      onClick={annuler}>✗</button>
  </div>;
}
