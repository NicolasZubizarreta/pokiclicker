export function SelecteurQuantite({ valeur, max, changer, valider, annuler }: {
  valeur: number;
  max: number;
  changer(n: number): void;
  valider(): void;
  annuler(): void;
}) {
  const bouton = 'cadre min-h-11 min-w-11 bg-surface p-3';
  return <div role="group" aria-label="Quantité" className="flex flex-wrap items-center gap-2 text-base text-texte tabular-nums">
    <button type="button" aria-label="Moins" className={bouton} disabled={valeur <= 1}
      onClick={() => changer(Math.max(1, valeur - 1))}>−</button>
    <output aria-label="Quantité">{valeur}</output>
    <button type="button" aria-label="Plus" className={bouton} disabled={valeur >= max}
      onClick={() => changer(Math.min(max, valeur + 1))}>+</button>
    <button type="button" aria-label="Valider" className="cadre min-h-11 min-w-11 bg-action p-3 text-action-texte"
      onClick={valider}>✓</button>
    <button type="button" aria-label="Annuler" className={bouton} onClick={annuler}>✗</button>
  </div>;
}
