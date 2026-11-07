import { Fauchage } from './icones';
import './Plaques.css';

/** Téléphone : bouton carré à droite de « Capturer ». Actif = repère carré plein en plus de la couleur. */
export function BoutonFauchage({ fauchage, faucher }: {
  fauchage: { disponible: boolean; raison: string | null; rechargeS: number; actif: boolean };
  faucher(): void;
}) {
  return <button type="button" className="plaque plaque-carre" aria-label="Fauchage" aria-pressed={fauchage.actif}
    aria-disabled={!fauchage.disponible || undefined} title={!fauchage.disponible ? fauchage.raison ?? undefined : undefined}
    onClick={() => { if (fauchage.disponible) faucher(); }}>
    <Fauchage />
    {fauchage.rechargeS > 0 && <>
      <small aria-hidden="true" className="text-texte-doux">{fauchage.rechargeS} s</small>
      <span className="sr-only">Recharge : {fauchage.rechargeS} s</span>
    </>}
    {!fauchage.disponible && fauchage.raison && <span className="sr-only">{fauchage.raison}</span>}
  </button>;
}
