import { describe, expect, it, vi } from 'vitest';
import fixture from '../../tests/fixtures/v1-casino.json';
import zones from '../../data/regions/kanto/zones.json';
import { chargerMonde } from './monde';
import {
  accesCasino, acheterJetons, chargerCasino, echangerJetons, gainMachine,
  jouerMachine, jouerPileOuFace, lireMise, tirerSymbole,
} from './casino';

describe('casino : données et accès', () => {
  it('reprend les constantes et animations V1 avec des images locales', () => {
    const c = chargerCasino();
    expect(c.jetons).toEqual({ achat: fixture.constantes.lot, rachat: fixture.constantes.rachat });
    expect(c.symboles.map(s => s.id)).toEqual(fixture.constantes.symboles);
    expect(c.symboles.map(s => s.poids)).toEqual(fixture.constantes.poids);
    expect(c.symboles.map(s => s.gain)).toEqual([500, 50, 20, 10, 5]);
    expect(c.animation).toEqual(fixture.animation);
    expect(c.boutique).toEqual(fixture.constantes.boutique);
    expect(c.noms).toEqual(fixture.constantes.noms);
    expect(c.symboles.every(s => s.image === null || !s.image.includes('://'))).toBe(true);
    c.symboles[0]!.poids = 99;
    expect(chargerCasino().symboles[0]!.poids).toBe(1);
  });

  it('évalue la condition du lieu, y compris une autre condition que le boss', () => {
    const monde = chargerMonde(zones as unknown as Parameters<typeof chargerMonde>[0]);
    const etat = { badges: [], bossVaincus: [], objets: [], quetes: [], drapeaux: [] };
    expect(monde.lieu('casino').si).toEqual(fixture.acces.conditionV2);
    expect(accesCasino(monde, etat)).toEqual({ ok: false, raison: chargerCasino().acces.raison });
    expect(accesCasino(monde, { ...etat, bossVaincus: [fixture.acces.zonePrecedente.id] })).toEqual({ ok: true });
    expect(accesCasino({ lieu: () => ({ ...monde.lieu('casino'), si: { type: 'drapeau', id: 'test' } }) },
      { ...etat, drapeaux: ['test'] })).toEqual({ ok: true });
    expect(accesCasino({ lieu: () => ({ ...monde.lieu('casino'), si: undefined }) }, etat)).toEqual({ ok: true });
  });

  it('refuse des données invalides au chargement', () => {
    for (const modifier of [
      (c: ReturnType<typeof chargerCasino>) => { c.symboles[0]!.poids = -1; },
      (c: ReturnType<typeof chargerCasino>) => { c.jetons.achat.tokens = 0; },
      (c: ReturnType<typeof chargerCasino>) => { c.symboles[1]!.id = c.symboles[0]!.id; },
      (c: ReturnType<typeof chargerCasino>) => { c.animation.piece = NaN; },
      (c: ReturnType<typeof chargerCasino>) => { c.messages.perdu = ''; },
    ]) {
      const c = chargerCasino();
      modifier(c);
      expect(() => chargerCasino(c)).toThrow();
    }
    expect(() => chargerCasino(null)).toThrow();
  });
});

describe('jetons et mises', () => {
  it.each(fixture.jetons)('reproduit $action aux seuils V1', cas => {
    const region = Object.freeze({ argent: cas.avant.money, jetons: cas.avant.casinoTokens, argentTotalGagne: 17 });
    const resultat = cas.action === 'buyCasinoTokens' ? acheterJetons(region) : echangerJetons(region);
    const succes = cas.avant.money !== cas.apres.money;
    expect(resultat.ok).toBe(succes);
    if (resultat.ok) {
      expect(resultat.region).toEqual({ argent: cas.apres.money, jetons: cas.apres.casinoTokens, argentTotalGagne: 17 });
      expect(resultat.region).not.toBe(region);
    }
  });
  it.each(fixture.mise)('lit $valeur comme la V1', cas => {
    expect(lireMise(cas.valeur)).toBe(cas.resultat);
  });
  it('achète et échange un seul lot et vérifie les fonds', () => {
    expect(acheterJetons({ argent: 2000, jetons: 100 })).toMatchObject({ region: { argent: 1000, jetons: 150 } });
    expect(echangerJetons({ argent: 0, jetons: 100 })).toMatchObject({ region: { argent: 1000, jetons: 50 } });
    expect(lireMise('12jetons', 11)).toBe(0);
    expect(lireMise('12jetons', 12)).toBe(12);
  });
});

describe('coups atomiques', () => {
  it('refuse avant tout tirage les mises invalides et les fonds insuffisants', () => {
    const alea = vi.fn(() => 0);
    for (const mise of [0, -1, 1.5, NaN, Infinity, 11]) {
      expect(jouerMachine({ jetons: 10 }, mise, alea).ok).toBe(false);
      expect(jouerPileOuFace({ jetons: 10 }, mise, 'face', alea).ok).toBe(false);
    }
    expect(jouerPileOuFace({ jetons: 10 }, 1, 'inconnu' as 'face', alea).ok).toBe(false);
    expect(alea).not.toHaveBeenCalled();
  });
  it('débite une seule fois avant de créditer le gain et préserve toute entrée', () => {
    const region = Object.freeze({ jetons: 3, autre: Object.freeze({ valeur: 1 }) });
    const alea = vi.fn(() => { expect(region.jetons).toBe(3); return 0; });
    expect(jouerMachine(region, 3, alea)).toMatchObject({ ok: true, region: { jetons: 1500 }, gain: 1500 });
    expect(alea).toHaveBeenCalledTimes(3);
    expect(jouerPileOuFace(region, 3, 'face', () => 0)).toMatchObject({ region: { jetons: 6 }, gain: 6, resultat: 'face' });
    expect(jouerPileOuFace(region, 3, 'face', () => 0.5)).toMatchObject({ region: { jetons: 0 }, gain: 0, resultat: 'pile' });
    expect(region).toEqual({ jetons: 3, autre: { valeur: 1 } });
    expect(gainMachine(['Baie', 'Baie', 'Baie'], 3)).toBe(30);
    expect(gainMachine(['Baie', 'Baie', '7'], 3)).toBe(6);
  });
  it('respecte les bornes inclusives de chaque poids', () => {
    // 0.07 * 100 dépasse légèrement 7 en IEEE-754, comme en V1.
    for (const [valeur, symbole] of [[0, '7'], [0.01, '7'], [0.010001, 'Pikachu'], [0.07, 'Staross'], [0.17, 'Staross'], [0.170001, 'Baie'], [0.350001, 'Magicarpe']] as const) {
      expect(tirerSymbole(() => valeur)).toBe(symbole);
    }
  });
  it('prépare la région débitée avant le premier appel à l’aléa', () => {
    for (const jouer of [
      (r: { jetons: number }, alea: () => number) => jouerMachine(r, 3, alea),
      (r: { jetons: number }, alea: () => number) => jouerPileOuFace(r, 3, 'face', alea),
    ]) {
      let lectures = 0;
      let dejaTire = false;
      const region = { get jetons() { expect(dejaTire).toBe(false); lectures++; return 3; } };
      const resultat = jouer(region, () => {
        expect(lectures).toBeGreaterThanOrEqual(3);
        dejaTire = true;
        return 0;
      });
      expect(resultat.ok).toBe(true);
    }
  });
});
