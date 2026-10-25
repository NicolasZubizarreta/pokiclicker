import { expect, it } from 'vitest';
import fixture from './fixtures/v1-capture.json';
import { appliquerCapture, chanceCapture, retirerBalle } from '../src/core/capture';
import { motifArret } from '../src/core/combat';
import { reglages } from '../src/core/reglages';
import type { Rarete } from '../src/core/monde';
import type { DonneesRegion } from '../src/core/sauvegarde-types';

it('compare les 30 chances affichées par la V1 sans tolérance', () => {
  expect(fixture.chances.length).toBe(30);
  for (const cas of fixture.chances) {
    expect(Math.min(chanceCapture(cas.ennemi, cas.cle, cas.marais ? ['badge:marais'] : []), 1) * 100).toBe(cas.chance);
  }
});

it('compare les stocks, récompenses et destinations des quatre lancers V1', () => {
  expect(fixture.lancers.length).toBe(4);
  for (const cas of fixture.lancers) {
    const membre = { uid: 'ancien', numero: 19, niveau: 2, xp: 0, shiny: false,
      bonheur: 0, calcium: 0, pierreEternelle: false, favori: false, sexe: 'male' as const };
    const avant: DonneesRegion = { ...structuredClone(reglages.depart.region), regionId: 'kanto',
      zoneId: 'kanto.route-1', etape: 1, badges: [], bossVaincus: [], objetsCles: [], quetes: [],
      drapeaux: [], evenementsJoues: [], ligueGagnee: 0,
      equipe: Array.from({ length: cas.taille }, () => ({ ...membre })), pc: [],
      argent: 100, inventaire: { pokeball: 2, superball: 2, hyperball: 2, masterball: 2 } };
    const inventaire = retirerBalle(avant.inventaire, cas.cle);
    const succes = cas.alea < chanceCapture(cas.ennemi, cas.cle, []);
    const resultat = succes ? appliquerCapture({ ...avant, inventaire }, {
      numero: 19, niveau: cas.ennemi.niveau, shiny: false, boss: false, rarete: 'commun',
    }, [], () => 0.5, () => 'capture') : null;
    expect(succes).toBe(cas.succes);
    for (const cle of ['pokeball', 'superball', 'hyperball', 'masterball']) {
      expect(inventaire[cle]).toBe(cas.stocks[cle as keyof typeof cas.stocks]);
    }
    expect(resultat?.destination ?? null).toBe(cas.destination);
    expect((resultat?.region.argent ?? avant.argent) - avant.argent).toBe(cas.or);
    const prise = resultat ? resultat.region[resultat.destination].at(-1) : null;
    expect(prise?.numero ?? null).toBe(cas.succes ? 19 : null);
    expect(prise?.niveau ?? null).toBe(cas.niveau);
    expect(prise ? 'Rattata' : null).toBe(cas.nom);
  }
});

it('compare les arrêts et la priorité des messages de spawnEnemy V1', () => {
  expect(fixture.arrets.length >= 14).toBe(true);
  for (const cas of fixture.arrets) {
    const motif = motifArret({ numero: 19, niveau: 2, pv: 10, pvMax: 10,
      capture: 255, shiny: cas.shiny, boss: cas.boss, rarete: cas.rarete as Rarete },
    cas.nouveau, cas.reglages, cas.auto);
    expect(motif !== null).toBe(cas.arret);
    const libelles = { commun: 'COMMUN', 'peu-commun': 'PEU COMMUN', rare: 'RARE',
      'tres-rare': 'TRÈS RARE', legendaire: 'LÉGENDAIRE' };
    const message = motif === null ? null : motif === 'shiny' ? 'SHINY APPARU ! AUTO STOPPÉ !'
      : motif === 'nouveau' ? 'NOUVEAU POKÉMON ! AUTO STOPPÉ !'
        : `${libelles[motif]} APPARU ! AUTO STOPPÉ !`;
    expect(message).toBe(cas.message);
  }
});
