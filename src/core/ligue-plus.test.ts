import { describe, expect, it } from 'vitest';
import { kanto } from './regions';
import { zoneDeLigue } from './ligue';
import { chargerLiguePlus, choisirRang, facteurPvLiguePlus, meilleurRang, RANG_MAX_LIGUE_PLUS, rangActif, rangSuivantPossible,
  recompenseRang, victoireLiguePlus, zoneLiguePlus } from './ligue-plus';
import { noterLiguePlus, suiviVide } from './suivi';
import type { DonneesRegion } from './sauvegarde-types';

const region = (ligueGagnee: number, extra: Partial<DonneesRegion> = {}) =>
  ({ ligueGagnee, argent: 100, statistiques: { argentTotalGagne: 0 }, suivi: suiviVide(), ...extra }) as unknown as DonneesRegion;

describe('Ligue+', () => {
  it('reste fermée tant que la Ligue n\'est pas gagnée', () => {
    expect(rangActif(region(0, { liguePlus: 3 }))).toBe(0);
    expect(choisirRang(region(0), 1)).toMatchObject({ ok: false });
  });
  it('propose le rang suivant du meilleur rang réussi, jamais plus que le maximum', () => {
    expect(rangSuivantPossible(region(1))).toBe(1);
    const r = region(1, { suivi: noterLiguePlus(suiviVide(), 4) });
    expect(meilleurRang(r)).toBe(4);
    expect(rangSuivantPossible(r)).toBe(5);
    expect(rangSuivantPossible(region(1, { suivi: noterLiguePlus(suiviVide(), RANG_MAX_LIGUE_PLUS) }))).toBe(RANG_MAX_LIGUE_PLUS);
    expect(choisirRang(r, 6)).toMatchObject({ ok: false });
    const choisi = choisirRang(r, 5);
    expect(choisi.ok && rangActif(choisi.region)).toBe(5);
    const normal = choisirRang(region(1, { liguePlus: 2 }), 0);
    expect(normal.ok && normal.region.liguePlus).toBeUndefined();
  });
  it('ajoute des PV aux adversaires sans toucher aux niveaux ni à la zone d\'origine', () => {
    const zone = kanto.zoneDeCombat('kanto.ligue-pokemon');
    const avant = structuredClone(zone);
    expect(zoneLiguePlus(zone, 0)).toBe(zone);
    const plus = zoneLiguePlus(zone, 2);
    expect(plus.multiplicateurPv).toBeCloseTo(zone.multiplicateurPv * facteurPvLiguePlus(2));
    expect(facteurPvLiguePlus(2)).toBeGreaterThan(facteurPvLiguePlus(1));
    expect(zone).toEqual(avant);
    expect(zoneDeLigue(zone, 1, 3).multiplicateurPv).toBeCloseTo(zone.multiplicateurPv * facteurPvLiguePlus(3));
    expect(zoneDeLigue(zone, 1).multiplicateurPv).toBe(zone.multiplicateurPv);
  });
  it('paie le premier succès d\'un rang une seule fois et note le record', () => {
    const r1 = victoireLiguePlus(region(1, { liguePlus: 2 }));
    expect(r1.region.argent).toBe(100 + recompenseRang(2));
    expect(r1.region.statistiques.argentTotalGagne).toBe(recompenseRang(2));
    expect(meilleurRang(r1.region)).toBe(2);
    expect(r1.message).toMatch(/rang 2/);
    const r2 = victoireLiguePlus({ ...r1.region, liguePlus: 1 });
    expect(r2.region.argent).toBe(r1.region.argent);
    const r3 = victoireLiguePlus({ ...r1.region, liguePlus: 2 });
    expect(r3.region.argent).toBe(r1.region.argent);
    expect(meilleurRang(r3.region)).toBe(2);
  });
  it('sans rang actif, une victoire ne change rien', () => {
    const r = region(1);
    expect(victoireLiguePlus(r)).toEqual({ region: r, message: '' });
  });
  it('refuse un fichier de règles incohérent', () => {
    expect(() => chargerLiguePlus({ version: 1, rangMax: 0, pvParRangPourCent: 15, recompenseArgentParRang: 1, messages: { victoire: '', recompense: '', record: '' } })).toThrow();
    expect(() => chargerLiguePlus(null)).toThrow();
  });
});
