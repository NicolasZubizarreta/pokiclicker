import { describe, expect, it } from 'vitest';
import { acheterAuCasino, objetsDuCasino, remiseVip } from './casino';
import { chargerVip, etatVip, NIVEAUX_VIP, prixAvecRemise } from './vip';
import { noterPartieCasino, suiviVide } from './suivi';
import type { DonneesRegion } from './sauvegarde-types';

describe('niveau VIP', () => {
  it('monte avec le total misé et donne la distance au niveau suivant', () => {
    expect(etatVip(0)).toMatchObject({ niveau: null, remisePourCent: 0, suivant: NIVEAUX_VIP[0] });
    const n0 = NIVEAUX_VIP[0]!;
    expect(etatVip(n0.mises - 1).niveau).toBeNull();
    expect(etatVip(n0.mises)).toMatchObject({ niveau: n0, remisePourCent: n0.remisePourCent, suivant: NIVEAUX_VIP[1], restant: NIVEAUX_VIP[1]!.mises - n0.mises });
    const dernier = NIVEAUX_VIP.at(-1)!;
    expect(etatVip(dernier.mises * 3)).toMatchObject({ niveau: dernier, suivant: null, restant: 0 });
  });
  it('les remises croissent avec le niveau et restent modestes', () => {
    const remises = NIVEAUX_VIP.map(n => n.remisePourCent);
    expect([...remises].sort((a, b) => a - b)).toEqual(remises);
    expect(Math.max(...remises)).toBeLessThanOrEqual(10);
  });
  it('refuse des seuils non croissants ou des remises hors bornes', () => {
    expect(() => chargerVip({ version: 1, niveaux: [{ id: 'a', nom: 'A', mises: 10, remisePourCent: 1 }, { id: 'b', nom: 'B', mises: 10, remisePourCent: 2 }] })).toThrow();
    expect(() => chargerVip({ version: 1, niveaux: [{ id: 'a', nom: 'A', mises: 10, remisePourCent: 90 }] })).toThrow();
    expect(() => chargerVip({ version: 2, niveaux: [] })).toThrow();
  });
  it('le prix remisé s\'arrondit au supérieur, jamais sous 1', () => {
    expect(prixAvecRemise(250, 0)).toBe(250);
    expect(prixAvecRemise(250, 10)).toBe(225);
    expect(prixAvecRemise(5, 10)).toBe(5);
    expect(prixAvecRemise(1, 50)).toBe(1);
  });
  it('le suivi compte les jetons misés, gagnés ou perdus', () => {
    const s = noterPartieCasino(noterPartieCasino(suiviVide(), 'roulette', { mise: 10, gain: 0 }), 'roulette', { mise: 5, gain: 10 });
    expect(s.jetons.mises).toBe(15);
  });
});

describe('remise VIP dans la boutique de jetons', () => {
  const base = () => ({ jetons: 100000, equipe: [], pc: [], inventaire: {}, ameliorations: [] }) as unknown as DonneesRegion;
  const avecMises = (mises: number) => ({ ...base(), suivi: { ...suiviVide(), jetons: { gagnes: 0, perdus: 0, mises } } });
  it('sans niveau, les prix du catalogue ; avec un niveau, remise affichée et débitée', () => {
    const plein = objetsDuCasino(base()).find(o => o.id === 'abra')!.prix;
    const niveau = NIVEAUX_VIP.at(-1)!;
    const region = avecMises(niveau.mises);
    expect(remiseVip(region)).toBe(niveau.remisePourCent);
    const remise = objetsDuCasino(region).find(o => o.id === 'abra')!.prix;
    expect(remise).toBe(prixAvecRemise(plein, niveau.remisePourCent));
    const achat = acheterAuCasino(region, 'abra', () => 0.5, () => 'x');
    expect(achat.ok && achat.region.jetons).toBe(100000 - remise);
  });
  it('un solde entre le prix remisé et le prix plein suffit à acheter', () => {
    const niveau = NIVEAUX_VIP.at(-1)!;
    const plein = objetsDuCasino(base()).find(o => o.id === 'abra')!.prix;
    const remise = prixAvecRemise(plein, niveau.remisePourCent);
    const region = { ...avecMises(niveau.mises), jetons: remise };
    expect(objetsDuCasino(region).find(o => o.id === 'abra')!.abordable).toBe(true);
    expect(objetsDuCasino({ ...base(), jetons: remise }).find(o => o.id === 'abra')!.abordable).toBe(remise >= plein);
  });
});
