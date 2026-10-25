import { describe, expect, it } from 'vitest';
import { reglages } from './reglages';
import type { DonneesRegion } from './sauvegarde-types';
import {
  accorderBadge, accorderJalons, actifsDe, badgeDeZone, chargerBadges, chargerJalons, prochainJalon,
} from './progression';

function creerRegion(): DonneesRegion {
  return {
    ...structuredClone(reglages.depart.region),
    regionId: 'kanto', zoneId: 'kanto.route-1', etape: 1, equipe: [],
    badges: [], bossVaincus: [], objetsCles: [], quetes: [], drapeaux: [],
    evenementsJoues: [], argent: 100, inventaire: {}, ligueGagnee: 0,
  };
}

describe('badges', () => {
  it('charge les huit badges dans leur ordre et retrouve leur arène', () => {
    const badges = chargerBadges();
    expect(badges.map(badge => badge.id)).toEqual([
      'roche', 'cascade', 'foudre', 'prisme', 'ame', 'marais', 'volcan', 'terre',
    ]);
    for (const badge of badges) expect(badgeDeZone(badge.zone)).toEqual(badge);
  });

  it('accorde un badge une seule fois sans modifier la région reçue', () => {
    const region = creerRegion();
    const avant = structuredClone(region);
    const resultat = accorderBadge(region, 'kanto.arene-d-argenta');
    expect(resultat.badge).toEqual(badgeDeZone('kanto.arene-d-argenta'));
    expect(resultat.region.badges).toEqual(['roche']);
    expect(region).toEqual(avant);
    const repetee = accorderBadge(resultat.region, 'kanto.arene-d-argenta');
    expect(repetee.badge).toBeNull();
    expect(repetee.region).toBe(resultat.region);
  });

  it.each(['kanto.route-1', 'kanto.ligue', 'inconnue'])('ignore la zone %s', zone => {
    const region = creerRegion();
    expect(badgeDeZone(zone)).toBeNull();
    expect(accorderBadge(region, zone)).toEqual({ region, badge: null });
    expect(accorderBadge(region, zone).region).toBe(region);
  });
});

describe('jalons', () => {
  const paliers = [10, 20, 30, 40, 50, 70, 90, 110, 130, 151];

  it('accorde les dix paliers et leurs récompenses une seule fois', () => {
    const region = creerRegion();
    region.inventaire = { masterball: 2, bonbon: 3, pokeball: 7 };
    const avant = structuredClone(region);
    const resultat = accorderJalons(region, 151);
    expect(chargerJalons().map(jalon => jalon.palier)).toEqual(paliers);
    expect(resultat.recus.map(jalon => jalon.palier)).toEqual(paliers);
    expect(resultat.region.jalonsRecus).toEqual(paliers);
    expect(resultat.region.argent).toBe(2600);
    expect(resultat.region.inventaire).toEqual({
      masterball: 3, bonbon: 13, pokeball: 7, omniExp: 1, shinyToken: 1,
    });
    expect(resultat.region.ameliorations).toEqual(['shinyCharm']);
    expect(resultat.region.statistiques).toEqual(avant.statistiques);
    expect(region).toEqual(avant);
    const repetee = accorderJalons(resultat.region, 151);
    expect(repetee.recus).toEqual([]);
    expect(repetee.region).toBe(resultat.region);
  });

  it('complète seulement les paliers manquants, sans dupliquer le Charme', () => {
    const region = creerRegion();
    region.jalonsRecus = [20, 10];
    region.ameliorations = ['shinyCharm', 'protein'];
    const avant = structuredClone(region);
    const resultat = accorderJalons(region, 151);
    expect(resultat.recus.map(jalon => jalon.palier)).toEqual(paliers.slice(2));
    expect(resultat.region.argent).toBe(100);
    expect(resultat.region.ameliorations).toEqual(['shinyCharm', 'protein']);
    expect(region).toEqual(avant);
  });

  it('respecte les seuils exacts et conserve la région sans nouveau palier', () => {
    const region = creerRegion();
    expect(accorderJalons(region, 0)).toEqual({ region, recus: [] });
    expect(accorderJalons(region, 9).region).toBe(region);
    expect(accorderJalons(region, 10).region.jalonsRecus).toEqual([10]);
    expect(accorderJalons(region, 39).region.jalonsRecus).toEqual([10, 20, 30]);
    expect(accorderJalons(region, 40).region.inventaire.omniExp).toBe(1);
  });

  it.each([[0, 10, 10], [9, 10, 1], [10, 20, 10], [150, 151, 1]])(
    'trouve le prochain palier après %i espèces', (nombre, palier, restantes) => {
      expect(prochainJalon(nombre)).toEqual({
        jalon: chargerJalons().find(jalon => jalon.palier === palier), restantes,
      });
    },
  );

  it('termine la progression à 151 espèces', () => {
    expect(prochainJalon(151)).toBeNull();
    expect(prochainJalon(152)).toBeNull();
  });
});

describe('actifs', () => {
  it.each([undefined, 0, -1, 1, 2])('active Omni Exp seulement avec un stock positif (%s)', stock => {
    const region = creerRegion();
    region.ameliorations = ['protein', 'shinyCharm'];
    region.badges = ['roche', 'terre'];
    region.jalonsRecus = [10, 50];
    region.chronos.finBoostAttaque = 10000;
    if (stock !== undefined) region.inventaire.omniExp = stock;
    const avant = structuredClone(region);
    expect(actifsDe(region)).toEqual([
      'objet:protein', 'objet:shinyCharm', 'badge:roche', 'badge:terre', 'jalon:10', 'jalon:50',
      ...(stock !== undefined && stock > 0 ? ['objet:omniExp'] : []),
    ]);
    expect(region).toEqual(avant);
  });
});
