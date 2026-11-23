import { describe, expect, it } from 'vitest';
import donnees from '../../data/defi-chen.json';
import reference from '../../tests/fixtures/v1-fin.json';
import { avancerCombat, cliquer, creerEnnemi, reprendreCombat } from './combat';
import { chargerDefiChen, compterVictoireDefi, echec, facteurPvDefi, messageDefi, PALIERS_MAX_DEFI, palierDefi, peutLancer, peutRejouer, rejouer, victoire, victoiresDefi, zoneDuDefi } from './defi-chen';
import { kanto } from './regions';
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

  it('donne au défi des PV au-dessus de ceux de la Ligue (décision de Nicolas, 02/11)', () => {
    const ligue = kanto.zoneDeCombat('kanto.ligue-pokemon');
    expect(zoneDuDefi(1).multiplicateurPv).toBeGreaterThan(ligue.multiplicateurPv);
    expect(creerEnnemi(zoneDuDefi(1), 1, alea).pvMax)
      .toBeGreaterThan(creerEnnemi(ligue, 1, alea).pvMax);
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
  describe('rejeu', () => {
    const gagnee = () => ({ ...regionInitiale('kanto', 'kanto.labo'), drapeaux: ['defi-chen-intro-vue', 'defi-chen-gagne'] });
    it('ajoute 10 % de PV par défi déjà réussi, au plus jusqu’au dernier palier',() => {
      expect(facteurPvDefi(0)).toBe(1);
      expect(facteurPvDefi(1)).toBeCloseTo(1.1);
      expect(facteurPvDefi(99)).toBeCloseTo(1 + 0.1 * (PALIERS_MAX_DEFI - 1));
      expect(zoneDuDefi(1, 2).multiplicateurPv).toBeCloseTo(zoneDuDefi(1).multiplicateurPv * 1.2);
      expect(zoneDuDefi(1).multiplicateurPv).toBe(donnees.multiplicateurPv);
    });
    it('ne se rejoue qu’une fois réussi, et sans refaire l’introduction', () => {
      expect(peutRejouer(regionActive())).toBe(false);
      expect(peutRejouer(gagnee())).toBe(true);
      const r = rejouer(gagnee());
      expect(r.drapeaux).toContain('defi-chen-actif');
      expect(r.drapeaux).toContain('defi-chen-intro-vue');
      expect(r.drapeaux).not.toContain('defi-chen-gagne');
      expect(peutRejouer(r)).toBe(false);
      expect(rejouer(regionActive())).toEqual(regionActive());
    });
    it('compte une réussite, paie le premier succès de chaque palier à partir du 2e', () => {
      const premiere = compterVictoireDefi(gagnee());
      expect(victoiresDefi(premiere.region)).toBe(1);
      expect(premiere.region.argent).toBe(gagnee().argent);
      let r = rejouer(premiere.region);
      expect(palierDefi(r)).toBe(2);
      r = { ...r, drapeaux: r.drapeaux.filter(d => d !== 'defi-chen-actif').concat('defi-chen-gagne') };
      const seconde = compterVictoireDefi(r);
      expect(seconde.region.argent).toBe(r.argent + donnees.rejeu.recompenseArgentParPalier);
      expect(seconde.message).toMatch(/Palier 2/);
      expect(victoiresDefi(seconde.region)).toBe(2);
    });
    it('au dernier palier, plus de gain ni de palier de plus', () => {
      let r = gagnee();
      for (let i = 0; i < PALIERS_MAX_DEFI + 2; i++) r = compterVictoireDefi(r).region;
      const avant = r.argent;
      expect(palierDefi(r)).toBe(PALIERS_MAX_DEFI);
      expect(compterVictoireDefi(r).region.argent).toBe(avant);
      expect(messageDefi(r)).toMatch(new RegExp(String(PALIERS_MAX_DEFI)));
    });
    it('Chen annonce le palier suivant et le bonus de PV', () => {
      const r = compterVictoireDefi(gagnee()).region;
      expect(messageDefi(r)).toMatch(/palier 2 sur 10.*10 %/);
      expect(messageDefi(regionInitiale('kanto', 'kanto.labo'))).toMatch(/t'attend/);
    });
    it('refuse un rejeu mal réglé', () => {
      expect(() => chargerDefiChen({ ...donnees, rejeu: { ...donnees.rejeu, paliersMax: 0 } })).toThrow();
      expect(() => chargerDefiChen({ ...donnees, rejeu: undefined })).toThrow();
    });
  });
});
