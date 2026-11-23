import { describe, expect, it } from 'vitest';
import donnees from '../../data/skins.json';
import { compteInitial } from './sauvegarde';
import { validerDonneesCompte } from './sauvegarde-validation';
import { acheterSkin, CATEGORIES_SKINS, chargerSkins, equiperSkin, SKINS, skinsEquipes } from './skins';

const compte = (diamants: number, extra = {}) => ({ ...compteInitial(), diamants, ...extra });

describe('boutique de skins', () => {
  it('le premier lot compte 8 à 10 skins, tous dans une catégorie connue, à prix positif', () => {
    expect(SKINS.length).toBeGreaterThanOrEqual(8);
    expect(SKINS.length).toBeLessThanOrEqual(10);
    for (const s of SKINS) expect(CATEGORIES_SKINS.map(c => c.id)).toContain(s.categorie);
  });
  it('achète : diamants débités, skin possédé et équipé dans sa catégorie vide', () => {
    const r = acheterSkin(compte(100), 'balle-or');
    expect(r.ok && r.compte.diamants).toBe(60);
    expect(r.ok && r.compte.skins).toEqual(['balle-or']);
    expect(r.ok && r.compte.skinsEquipes).toEqual({ 'cadre-balle': 'balle-or' });
  });
  it('un deuxième skin de la même catégorie ne remplace pas l\'équipé', () => {
    const premier = acheterSkin(compte(200), 'balle-or');
    const second = premier.ok ? acheterSkin(premier.compte, 'balle-glace') : premier;
    expect(second.ok && second.compte.skinsEquipes).toEqual({ 'cadre-balle': 'balle-or' });
  });
  it('refuse : diamants insuffisants, déjà possédé, inconnu', () => {
    expect(acheterSkin(compte(10), 'balle-or')).toMatchObject({ ok: false, raison: expect.stringMatching(/30 diamants/) });
    expect(acheterSkin(compte(100, { skins: ['balle-or'] }), 'balle-or')).toMatchObject({ ok: false });
    expect(acheterSkin(compte(100), 'inconnu')).toMatchObject({ ok: false });
  });
  it('équipe un skin possédé de la bonne catégorie, ou retire', () => {
    const base = compte(0, { skins: ['balle-or', 'balle-glace'], skinsEquipes: { 'cadre-balle': 'balle-or' } });
    const change = equiperSkin(base, 'cadre-balle', 'balle-glace');
    expect(change.ok && change.compte.skinsEquipes).toEqual({ 'cadre-balle': 'balle-glace' });
    const retire = equiperSkin(base, 'cadre-balle', null);
    expect(retire.ok && 'skinsEquipes' in retire.compte).toBe(false);
    expect(equiperSkin(base, 'cadre-balle', 'profil-or')).toMatchObject({ ok: false });
    expect(equiperSkin(base, 'cadre-profil', 'profil-or')).toMatchObject({ ok: false });
    expect(equiperSkin(base, 'nulle-part', null)).toMatchObject({ ok: false });
  });
  it('n\'applique que les skins équipés, possédés et de la bonne catégorie', () => {
    expect(skinsEquipes(compte(0, { skins: ['balle-or'], skinsEquipes: { 'cadre-balle': 'balle-or', 'cadre-profil': 'profil-or', 'fond-scene': 'balle-or' } })))
      .toMatchObject({ 'cadre-balle': { id: 'balle-or' } });
    expect(Object.keys(skinsEquipes(compte(0, { skins: ['balle-or'], skinsEquipes: { 'cadre-profil': 'profil-or', 'fond-scene': 'balle-or' } })))).toEqual([]);
  });
  it('un compte abîmé est réparé, jamais refusé', () => {
    const abime = { ...compteInitial(), skinsEquipes: { 'cadre-balle': 42 } } as unknown;
    expect(() => validerDonneesCompte(abime)).not.toThrow();
    expect((abime as { skinsEquipes?: unknown }).skinsEquipes).toBeUndefined();
    const bon = { ...compteInitial(), skinsEquipes: { 'cadre-balle': 'balle-or' } };
    validerDonneesCompte(bon);
    expect(bon.skinsEquipes).toEqual({ 'cadre-balle': 'balle-or' });
  });
  it('refuse un catalogue incohérent', () => {
    expect(() => chargerSkins(null)).toThrow();
    expect(() => chargerSkins({ ...donnees, skins: [{ ...donnees.skins[0], categorie: 'x' }] })).toThrow();
    expect(() => chargerSkins({ ...donnees, skins: [donnees.skins[0], donnees.skins[0]] })).toThrow();
    expect(() => chargerSkins({ ...donnees, skins: [{ ...donnees.skins[0], jeton: 'rouge' }] })).toThrow();
  });
});
