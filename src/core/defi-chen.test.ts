import { describe, expect, it } from 'vitest';
import donnees from '../../data/defi-chen.json';
import reference from '../../tests/fixtures/v1-fin.json';
import { avancerCombat, cliquer, creerEnnemi, reprendreCombat } from './combat';
import { chargerDefiChen, echec, peutLancer, victoire, zoneDuDefi } from './defi-chen';
import { regionInitiale } from './sauvegarde';

const alea = () => { throw new Error('Aléa inattendu'); };
const regionActive = (etape = 1) => ({ ...regionInitiale('kanto', 'kanto.labo'),
  etape, drapeaux: ['defi-chen-actif', 'defi-chen-intro-vue'] });

describe('Défi de Chen', () => {
  it('charge une copie indépendante des données', () => {
    const avant = structuredClone(donnees);
    const charge = chargerDefiChen(donnees);
    expect(charge).toEqual(donnees);
    charge.combats[0]!.niveau = 1;
    expect(donnees).toEqual(avant);
  });

  it.each([null, {}, { ...donnees, version: 2 }, { ...donnees, combats: [] },
    { ...donnees, combats: donnees.combats.map(c => ({ ...c, minuteurMs: 1 })) },
    { ...donnees, counter: [] }, { ...donnees, messages: {} },
  ])('refuse des données invalides %#', fichier => {
    expect(() => chargerDefiChen(fichier)).toThrow(/^Défi de Chen invalide : /);
  });

  it.each(reference.rosters)('reproduit les six combats V1 du starter $starter', cas => {
    const zone = zoneDuDefi(cas.starter);
    expect(zone).toMatchObject({ id: 'kanto.labo', etapes: 6, ancienId: -2 });
    cas.combats.forEach(combat => {
      expect(creerEnnemi(zone, combat.etape, alea)).toMatchObject({
        numero: combat.pokemon, niveau: combat.niveau, capture: combat.capture, boss: true,
      });
      expect(reprendreCombat(zone, [], alea, combat.etape).minuteurMs).toBe(combat.minuteurMs);
      expect(combat.etape === 6 ? zone.boss : zone.adversaires![combat.etape - 1])
        .toMatchObject({ nom: combat.nom });
    });
    zone.boss.pokemon = 1;
    expect(zoneDuDefi(cas.starter).boss.pokemon).toBe(149);
  });

  it.each(reference.conditions)('reproduit la condition V1 %#', cas => {
    const region = { ...regionInitiale('kanto', 'kanto.bourg-palette'),
      ligueGagnee: cas.leagueWins, drapeaux: cas.chenChallengeCompleted ? ['defi-chen-gagne'] : [] };
    const avant = structuredClone(region);
    expect(peutLancer(region, cas.pokedex, cas.hasSeenEnding)).toBe(cas.possible);
    expect(region).toEqual(avant);
  });

  it.each([1, 3, 6])('sort à Bourg Palette après expiration de l’étape %i', etape => {
    const initial = reprendreCombat(zoneDuDefi(1), [], alea, etape);
    const avant = structuredClone({ ...initial, alea: undefined });
    const expire = avancerCombat(initial, 30000);
    expect(expire.etape).toBe(1);
    expect(expire.evenements).toEqual([{ type: 'boss-echoue', zoneId: 'kanto.labo' }]);
    const region = regionActive(etape);
    const copie = structuredClone(region);
    expect(echec(region)).toEqual({ region: { ...region, zoneId: 'kanto.bourg-palette', etape: 1 },
      message: donnees.messages.echec });
    expect(region).toEqual(copie);
    expect({ ...initial, alea: undefined }).toEqual(avant);
  });

  it('enregistre une seule victoire après le sixième adversaire, sans mutation', () => {
    for (let etape = 1; etape <= 6; etape++) {
      const region = regionActive(etape);
      const avant = structuredClone(region);
      const initial = reprendreCombat(zoneDuDefi(null), [], alea, etape);
      const termine = cliquer({ ...initial, ennemi: { ...initial.ennemi, pv: 1 } }, { essayer: () => true });
      expect(termine.evenements.filter(e => e.type === 'boss-vaincu')).toHaveLength(etape === 6 ? 1 : 0);
      const gagne = victoire(region);
      expect(gagne.drapeaux.filter(d => d === 'defi-chen-gagne')).toHaveLength(etape === 6 ? 1 : 0);
      expect(victoire(gagne)).toEqual(gagne);
      expect(region).toEqual(avant);
      if (etape === 6) expect(gagne.drapeaux).not.toContain('defi-chen-actif');
    }
    const inactive = regionInitiale('kanto', 'kanto.route-1');
    expect(victoire({ ...inactive, etape: 6 })).toEqual({ ...inactive, etape: 6 });
    expect(echec(inactive)).toEqual({ region: inactive, message: null });
  });
});
