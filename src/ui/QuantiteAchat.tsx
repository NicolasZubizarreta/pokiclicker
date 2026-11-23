import type { ReactNode } from 'react';
import { formaterNombre } from './nombres';
import { quantiteMaximale, quantiteMoins, quantitePlus, quantitePlusDix } from '../core/boutique';

/**
 * Sélecteur de quantité d'achat (Shop et Centre commercial) : − et + bouclent de 1 à 99, +10 s'arrête à 99,
 * Max prend le plus grand achat que l'argent permet. Deux rangées fixes (boutons, puis total) : les cartes restent alignées.
 */
export function QuantiteAchat({ nom, quantite, changer, prix, argent, bouton, total = null }: {
  nom: string;
  quantite: number;
  changer(quantite: number): void;
  prix: number;
  argent: number;
  /** Classes des boutons (taille, fond). */
  bouton: string;
  /** Élément placé à droite du total (bouton d'achat du téléphone). */
  total?: ReactNode;
}) {
  const court = `${bouton} px-2`;
  return <div role="group" aria-label={`Quantité de ${nom}`} className="quantite-achat grid min-w-0 gap-2">
    <div className="flex min-w-0 items-center gap-2">
      <button type="button" aria-label="− : diminuer" className={bouton} onClick={() => changer(quantiteMoins(quantite))}>−</button>
      <output aria-label="Quantité" className="min-w-8 text-center">{quantite}</output>
      <button type="button" aria-label="+ : augmenter" className={bouton} onClick={() => changer(quantitePlus(quantite))}>+</button>
      <button type="button" aria-label="+10 : ajouter dix" className={court} onClick={() => changer(quantitePlusDix(quantite))}>+10</button>
      <button type="button" aria-label="Max : maximum possible" className={court} onClick={() => changer(quantiteMaximale(prix, argent))}>Max</button>
    </div>
    <div className="flex min-w-0 items-center justify-between gap-2">
      <output aria-label="Total" className="text-region-accent">= {formaterNombre(prix * quantite)}{'\u00a0₽'}</output>
      {total}
    </div>
  </div>;
}
