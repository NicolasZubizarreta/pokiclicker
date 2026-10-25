export function ConfirmationObjet({ objet, nom, valider, annuler }: {
  objet: string;
  nom: string;
  valider(): void;
  annuler(): void;
}) {
  const question = `Utiliser ${objet} sur ${nom} ?`;
  return <div role="group" aria-label={question} className="flex flex-wrap items-center gap-2 text-base text-texte">
    <p>{question}</p>
    <button type="button" aria-label="Valider" className="cadre min-h-11 min-w-11 bg-action p-3 text-action-texte"
      onClick={valider}>✓</button>
    <button type="button" aria-label="Annuler" className="cadre min-h-11 min-w-11 bg-surface p-3"
      onClick={annuler}>✗</button>
  </div>;
}
