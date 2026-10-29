import { Fauchage, Radar } from './icones';
import { BoutonAction } from './BoutonAction';

export function OutilsCombat({ fauchage, radar, faucher, ouvrirRadar }: {
  fauchage: { possede: boolean; disponible: boolean; raison: string | null; rechargeS: number; actif: boolean };
  radar: boolean;
  faucher(): void;
  ouvrirRadar(declencheur: HTMLButtonElement): void;
}) {
  const raison = fauchage.raison || (fauchage.rechargeS > 0 ? `Recharge : ${fauchage.rechargeS} s` : null);

  return <div className="bandeau-action-groupe">
    {fauchage.possede && <BoutonAction icone={<Fauchage />} nom="Fauchage" actif={fauchage.actif}
      verrouille={!fauchage.disponible} infobulle={raison ?? undefined} onClick={faucher} />}
    {radar && <BoutonAction icone={<Radar />} nom="Poké-Radar"
      onClick={event => ouvrirRadar(event.currentTarget)} />}
  </div>;
}
