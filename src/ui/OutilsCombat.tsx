import { useId } from 'react';
import { Radar } from './icones';

const bouton = 'cadre min-h-11 min-w-11 bg-surface p-3 aria-pressed:bg-selection disabled:text-texte-doux';

export function OutilsCombat({ fauchage, radar, faucher, ouvrirRadar }: {
  fauchage: { possede: boolean; disponible: boolean; raison: string | null; rechargeS: number; actif: boolean };
  radar: boolean;
  faucher(): void;
  ouvrirRadar(declencheur: HTMLButtonElement): void;
}) {
  const raisonFauchage = useId();
  const raisonRadar = useId();
  const raison = fauchage.raison || (fauchage.rechargeS > 0 ? `Recharge : ${fauchage.rechargeS} s` : null);

  return <div className="flex min-w-0 flex-wrap gap-2 text-base text-texte">
    <button type="button" className={bouton} aria-pressed={fauchage.actif}
      disabled={!fauchage.disponible} aria-describedby={raison ? raisonFauchage : undefined}
      onClick={faucher}>Fauchage</button>
    {raison && <p id={raisonFauchage} className="self-center text-texte-doux">{raison}</p>}
    <button type="button" className={bouton} disabled={!radar} aria-label="Poké-Radar" title="Poké-Radar"
      aria-describedby={!radar ? raisonRadar : undefined}
      onClick={event => ouvrirRadar(event.currentTarget)}><Radar /></button>
    {!radar && <p id={raisonRadar} className="self-center text-texte-doux">Nécessite le Poké-Radar.</p>}
  </div>;
}
