import { afterEach, describe, expect, it, vi } from 'vitest';
import { clesActives, declencherRecharge, etatFauchage, refusPoupee, restants, utiliserPoupee, utiliserTemporise } from './objets-actifs';
import { reglages } from './reglages';
import type { DonneesRegion } from './sauvegarde-types';

function region(): DonneesRegion {
  return {
    inventaire: { repel: 2, superRepel: 1, xAttack: 1, xSpecial: 1, pokeDoll: 1 },
    bossVaincus: [], ameliorations: [],
    chronos: { finRepousse: 0, finSuperRepousse: 0, finBoostAttaque: 0, finBoostAttaqueSpeciale: 0, rechargeFauchage: 0 },
  } as unknown as DonneesRegion;
}

afterEach(() => vi.useRealTimers());

describe('objets actifs', () => {
  it('cumule la Repousse sans dépendre de l’horloge système', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const entree = region();
    const avant = structuredClone(entree);
    Object.freeze(entree.chronos);
    Object.freeze(entree.inventaire);
    Object.freeze(entree);
    const premier = utiliserTemporise(entree, 'repel');
    if (!premier.ok) throw new Error(premier.raison);
    expect(premier.message).toBe('Repousse active !');
    expect(premier.region.inventaire.repel).toBe(1);
    expect(premier.region.chronos.finRepousse).toBe(30000);
    vi.setSystemTime(30999);
    expect(clesActives(premier.region.chronos)).toEqual(['repousse:commun']);
    expect(restants(premier.region.chronos)).toEqual([
      { id: 'repel', pastille: reglages.objetsActifs.temporises.repel.pastille, restantS: 30 },
    ]);
    vi.setSystemTime(30000);
    expect(clesActives(premier.region.chronos)).toEqual(['repousse:commun']);
    expect(restants({ ...premier.region.chronos, finRepousse: 0 })).toEqual([]);
    expect(clesActives({ ...premier.region.chronos, finRepousse: 0 })).toEqual([]);
    vi.setSystemTime(11000);
    const second = utiliserTemporise(premier.region, 'repel');
    if (!second.ok) throw new Error(second.raison);
    expect(second.region.chronos.finRepousse).toBe(60000);
    expect(second.region.inventaire.repel).toBe(0);
    expect(premier.region.chronos.finRepousse).toBe(30000);
    expect(entree).toEqual(avant);
  });

  it.each([
    ['xAttack', 'finBoostAttaque', 'boost:attaque', 'Attaque + active !'],
    ['xSpecial', 'finBoostAttaqueSpeciale', 'boost:dps', 'DPS ×1,5 actif !'],
    ['superRepel', 'finSuperRepousse', 'repousse:peu-commun', 'Superepousse active !'],
  ] as const)('active %s et ajoute la durée au restant', (id, chrono, cle, message) => {
    const entree = region();
    entree.chronos[chrono] = 500;
    const resultat = utiliserTemporise(entree, id);
    if (!resultat.ok) throw new Error(resultat.raison);
    expect(resultat.message).toBe(message);
    expect(resultat.region.chronos[chrono]).toBe(30500);
    expect(resultat.region.inventaire[id]).toBe(0);
    expect(clesActives(resultat.region.chronos)).toEqual([cle]);
  });

  it('garde l’ordre des pastilles des réglages', () => {
    const entree = region();
    for (const id of Object.keys(reglages.objetsActifs.temporises)) {
      const resultat = utiliserTemporise(entree, id);
      if (!resultat.ok) throw new Error(resultat.raison);
      Object.assign(entree.chronos, resultat.region.chronos);
    }
    expect(restants(entree.chronos)).toEqual(
      Object.entries(reglages.objetsActifs.temporises).map(([id, effet]) => ({ id, pastille: effet.pastille, restantS: 30 })),
    );
  });

  it('refuse un objet inconnu ou sans stock sans modifier la région', () => {
    const entree = region();
    entree.inventaire = {};
    const avant = structuredClone(entree);
    for (const id of ['repel', 'inconnu', 'toString']) {
      expect(utiliserTemporise(entree, id)).toMatchObject({ ok: false });
    }
    expect(entree).toEqual(avant);
  });

  it('réserve la Poupée aux boss vaincus et consomme une unité', () => {
    const entree = region();
    const avant = structuredClone(entree);
    expect(refusPoupee(entree, 'zone')).toBe('Boss non vaincu !');
    expect(utiliserPoupee(entree, 'zone')).toEqual({ ok: false, raison: 'Boss non vaincu !' });
    expect(entree).toEqual(avant);
    const debloquee = { ...entree, bossVaincus: ['zone'] };
    expect(refusPoupee(debloquee, 'zone')).toBeUndefined();
    const resultat = utiliserPoupee(debloquee, 'zone');
    if (!resultat.ok) throw new Error(resultat.raison);
    expect(resultat.message).toBe('Boss invoqué !');
    expect(resultat.region.inventaire.pokeDoll).toBe(0);
    expect(utiliserPoupee(resultat.region, 'zone').ok).toBe(false);
    expect(debloquee.inventaire.pokeDoll).toBe(1);
  });

  it('ordonne les refus Fauchage et conserve la recharge sans mutation', () => {
    const entree = region();
    entree.chronos.rechargeFauchage = 20000;
    expect(etatFauchage(entree, true)).toEqual({ possede: false, raison: 'Nécessite la CT Fauchage.', rechargeS: 20 });
    entree.ameliorations = ['falseSwipe'];
    expect(etatFauchage(entree, true)).toEqual({ possede: true, raison: 'Inutile sur un boss !', rechargeS: 20 });
    entree.chronos.rechargeFauchage = 1;
    expect(etatFauchage(entree, false)).toEqual({ possede: true, raison: 'Recharge : 1 s', rechargeS: 1 });
    entree.chronos.rechargeFauchage = 0;
    expect(etatFauchage(entree, false)).toEqual({ possede: true, raison: undefined, rechargeS: 0 });
    const avant = structuredClone(entree);
    Object.freeze(entree.chronos);
    Object.freeze(entree);
    const resultat = declencherRecharge(entree);
    expect(resultat.chronos.rechargeFauchage).toBe(20000);
    expect(entree).toEqual(avant);
  });

  it('plafonne la recharge d’une ancienne sauvegarde à 20 s', () => {
    const entree = region();
    entree.ameliorations = ['falseSwipe'];
    entree.chronos.rechargeFauchage = 30000;
    expect(etatFauchage(entree, false)).toEqual({ possede: true, raison: 'Recharge : 20 s', rechargeS: 20 });
  });
});
