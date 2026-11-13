import { useId } from 'react';
import { Fauchage } from './icones';
import './Plaques.css';

/** Téléphone : bouton carré à droite de « Capturer ». Actif = repère carré plein en plus de la couleur. */
export function BoutonFauchage({ fauchage, faucher }: {
  fauchage: { disponible: boolean; raison: string | null; rechargeS: number; actif: boolean };
  faucher(): void;
}) {
  const description = useId();
  const raison = !fauchage.disponible ? fauchage.raison : null;
  return <button data-tuto="fauchage" data-raccourci="fauchage" type="button" className="plaque plaque-carre" aria-label="Fauchage" aria-pressed={fauchage.actif}
    aria-describedby={raison ? description : undefined}
    aria-disabled={!fauchage.disponible || undefined} title={!fauchage.disponible ? fauchage.raison ?? undefined : undefined}
    onClick={() => { if (fauchage.disponible) faucher(); }}>
    <Fauchage taille={28} />
    <kbd aria-hidden="true" className="touche-pc">F</kbd>
    {fauchage.rechargeS > 0 && <>
      <small aria-hidden="true" className="text-texte-doux">{fauchage.rechargeS} s</small>
      {raison !== `Recharge : ${fauchage.rechargeS} s` && <span className="sr-only">Recharge : {fauchage.rechargeS} s</span>}
    </>}
    {raison && <span id={description} className="sr-only">{raison}</span>}
  </button>;
}
