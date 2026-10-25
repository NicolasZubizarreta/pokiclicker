import type { ResultatEquipe } from './equipe';
import { reglages } from './reglages';
import type { DonneesRegion } from './sauvegarde-types';
import { estZoneDeLigue } from './ligue';

type Chronos = DonneesRegion['chronos'];
type ResultatObjet = (ResultatEquipe & { ok: true; message: string }) | { ok: false; raison: string };
const effets = Object.entries(reglages.objetsActifs.temporises).map(([id, effet]) =>
  [id, effet] as const);

export function clesActives(chronos: Chronos, maintenant: number): string[] {
  return effets.filter(([, effet]) => maintenant < chronos[effet.chrono]).map(([, effet]) => effet.cle);
}

export function restants(chronos: Chronos, maintenant: number): { id: string; pastille: string; restantS: number }[] {
  return effets.filter(([, effet]) => maintenant < chronos[effet.chrono]).map(([id, effet]) => ({
    id, pastille: effet.pastille, restantS: Math.ceil((chronos[effet.chrono] - maintenant) / 1000),
  }));
}

export function utiliserTemporise(region: DonneesRegion, id: string, maintenant: number): ResultatObjet {
  const effet = effets.find(([cle]) => cle === id)?.[1];
  if (!effet) return { ok: false, raison: 'Objet invalide !' };
  const stock = region.inventaire[id] ?? 0;
  if (stock <= 0) return { ok: false, raison: 'Quantité invalide.' };
  return {
    ok: true, message: effet.message,
    region: {
      ...region,
      inventaire: { ...region.inventaire, [id]: stock - 1 },
      chronos: {
        ...region.chronos,
        [effet.chrono]: Math.max(region.chronos[effet.chrono], maintenant) + reglages.objetsActifs.dureeMs,
      },
    },
  };
}

export function refusPoupee(region: DonneesRegion, zoneId: string): string | undefined {
  if (estZoneDeLigue(zoneId) || !region.bossVaincus.includes(zoneId)) return 'Boss non vaincu !';
  if ((region.inventaire.pokeDoll ?? 0) <= 0) return 'Quantité invalide.';
}

export function utiliserPoupee(region: DonneesRegion, zoneId: string): ResultatObjet {
  const raison = refusPoupee(region, zoneId);
  if (raison) return { ok: false, raison };
  return {
    ok: true, message: 'Boss invoqué !',
    region: { ...region, inventaire: { ...region.inventaire, pokeDoll: (region.inventaire.pokeDoll ?? 0) - 1 } },
  };
}

export function etatFauchage(region: DonneesRegion, boss: boolean, maintenant: number): {
  possede: boolean; raison: string | undefined; rechargeS: number;
} {
  const possede = region.ameliorations.includes('falseSwipe');
  const rechargeS = Math.max(0, Math.ceil((region.chronos.rechargeFauchage - maintenant) / 1000));
  const raison = !possede ? 'Nécessite la CT Fauchage.'
    : boss ? 'Inutile sur un boss !' : rechargeS > 0 ? `Recharge : ${rechargeS} s` : undefined;
  return { possede, raison, rechargeS };
}

export function declencherRecharge(region: DonneesRegion, maintenant: number): DonneesRegion {
  return {
    ...region,
    chronos: { ...region.chronos, rechargeFauchage: maintenant + reglages.objetsActifs.rechargeFauchageMs },
  };
}
