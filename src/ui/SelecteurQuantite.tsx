import { plafondQuantite, quantiteMoinsPlafond, quantitePlusDixPlafond, quantitePlusPlafond } from '../core/quantite';

/**
 * Commandes de quantité d'utilisation, comme au Shop : − et + bouclent de 1 au plafond (99 au plus), +10 et Max,
 * puis « Utiliser ». Deux rangées qui passent à la ligne : rien ne sort du cadre, même étroit.
 */
export function CommandesQuantite({ nom, valeur, max, changer, utiliser, annuler }: {
  nom?: string;
  valeur: number;
  max: number;
  changer(n: number): void;
  utiliser(): void;
  annuler?(): void;
}) {
  const plafond = plafondQuantite(max);
  const bouton = 'cadre grid min-h-11 min-w-11 shrink-0 flex-none place-items-center bg-surface px-2 py-0';
  return <div role="group" aria-label={nom ? `Quantité de ${nom}` : 'Quantité'} className="flex min-w-0 flex-wrap items-center justify-center gap-2 text-base tabular-nums">
    <button type="button" aria-label="Moins" className={bouton} onClick={() => changer(quantiteMoinsPlafond(valeur, plafond))}>−</button>
    <output aria-label="Quantité" className="min-w-8 text-center">{valeur}</output>
    <button type="button" aria-label="Plus" className={bouton} onClick={() => changer(quantitePlusPlafond(valeur, plafond))}>+</button>
    <button type="button" aria-label="Plus dix" className={bouton} onClick={() => changer(quantitePlusDixPlafond(valeur, plafond))}>+10</button>
    <button type="button" aria-label="Maximum possible" className={bouton} onClick={() => changer(plafond)}>Max</button>
    <span className="flex basis-full items-center justify-center gap-2">
      <button type="button" className="cadre min-h-11 min-w-11 flex-none bg-action px-4 py-0 font-bold text-action-texte" onClick={utiliser}>Utiliser</button>
      {annuler && <button type="button" aria-label="Annuler" className={bouton} onClick={annuler}>✗</button>}
    </span>
  </div>;
}

/** Fenêtre de quantité posée sur la carte d'un Pokémon (équipe) : mêmes commandes que le Shop. */
export function SelecteurQuantite({ titre, valeur, max, changer, valider, annuler }: {
  titre?: string;
  valeur: number;
  max: number;
  changer(n: number): void;
  valider(): void;
  annuler(): void;
}) {
  return <div className="cadre absolute inset-0 z-20 grid place-content-center place-items-center gap-2 overflow-auto bg-surface p-3 text-texte">
    {titre && <p className="text-center">{titre}</p>}
    <CommandesQuantite valeur={valeur} max={max} changer={changer} utiliser={valider} annuler={annuler} />
  </div>;
}
