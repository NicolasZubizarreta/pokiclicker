import { afterEach, describe, expect, it, vi } from 'vitest';
import references from '../../tests/fixtures/v1-boss.json';
import { avancerCombat, creerEnnemi, reprendreCombat } from './combat';
import * as ennemis from './ennemis';
import { kanto } from './regions';
import { reglages } from './reglages';

const alea = () => 0.5;
const ligue = kanto.zoneDeCombat('kanto.ligue-pokemon');

afterEach(() => vi.restoreAllMocks());

describe('Fidélité stricte du minuteur des boss et de la Ligue à la V1', () => {
  it('conserve la durée V1 et échoue au dernier pas de cent millisecondes', () => {
    expect(references.minuteur.topsAvantExpiration * references.minuteur.periodeMs)
      .toEqual(reglages.combat.minuteurBossMs);
    expect(reglages.combat.minuteurBossMs).toEqual(30000);
    const zone = kanto.zoneDeCombat(kanto.zones.find(zone => zone.ancienId === 5)!.id);
    const boss = reprendreCombat(zone, [], alea, 10);
    const avantExpiration = avancerCombat(boss, reglages.combat.minuteurBossMs - 100);
    expect(avantExpiration.etape).toEqual(10);
    expect(avantExpiration.minuteurMs).toEqual(100);
    expect(avantExpiration.evenements).toEqual([]);
    const echec = avancerCombat(avantExpiration, 100);
    expect(echec.etape).toEqual(9);
    expect(echec.evenements).toEqual([{ type: 'boss-echoue', zoneId: zone.id }]);
  });

  it.each(references.minuteur.cas)('applique la pénalité de la zone V1 $zoneIdx', (cas) => {
    const zone = kanto.zoneDeCombat(kanto.zones.find(zone => zone.ancienId === cas.zoneIdx)!.id);
    const creation = vi.spyOn(ennemis, 'creerEnnemi');
    const boss = reprendreCombat(zone, [], alea, 10);
    creation.mockClear();
    const echec = avancerCombat(boss, reglages.combat.minuteurBossMs);

    // correction du ticket Q : Ligue → étape 9 ; correction du ticket F : zone 20 → étape 9
    if (cas.zoneIdx === 20) {
      expect(cas.subStageFinal).toEqual(1);
      expect(zone.type === 'ligue').toEqual(false);
      expect(echec.etape).toEqual(9);
    } else if (cas.zoneIdx === 21) {
      expect(cas.subStageFinal).toEqual(9);
      expect(zone.type).toEqual('ligue');
      expect(echec.etape).toEqual(9);
    } else {
      expect(echec.etape).toEqual(cas.subStageFinal);
    }
    expect(cas.appelsSpawn).toEqual(1);
    expect(creation.mock.calls.length).toEqual(cas.appelsSpawn);
    expect(echec.ennemi === boss.ennemi).toEqual(false);
    expect(echec.attenteMs).toEqual(0);
    expect(echec.evenements).toEqual([{ type: 'boss-echoue', zoneId: zone.id }]);
  });

  it.each(references.ligue)('reproduit le boss de Ligue à l’étape $etape', (cas) => {
    const ennemi = creerEnnemi(ligue, cas.etape, alea);
    expect({
      id: ennemi.numero, niveau: ennemi.niveau, pvMax: ennemi.pvMax,
      boss: ennemi.boss, tauxCapture: ennemi.capture,
    }).toEqual({
      id: cas.id, niveau: cas.niveau, pvMax: cas.pvMax,
      boss: cas.boss, tauxCapture: cas.tauxCapture,
    });
    expect(ennemi.boss).toEqual(true);
  });

  it('compare les trois pénalités et les dix étapes de Ligue', () => {
    expect(references.minuteur.cas.map(cas => cas.zoneIdx)).toEqual([5, 20, 21]);
    expect(references.ligue.map(cas => cas.etape)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
});
