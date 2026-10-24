import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import v0 from './__fixtures__/partie-v0.json';
import v1 from './__fixtures__/partie-v1.json';
import v2 from './__fixtures__/partie-v2.json';
import regionV1 from './__fixtures__/region-v1.json';
import regionV2 from './__fixtures__/region-v2.json';
import compteV1 from './__fixtures__/compte-v1.json';
import compteV2 from './__fixtures__/compte-v2.json';
import { migrer, migrerV1versV2, migrationsParDefaut } from './index';
import { VERSION_ACTUELLE } from '../sauvegarde-types';
import { regionInitiale } from '../sauvegarde';
import type { Enveloppe } from '../sauvegarde-types';

export function migrerV0versV1(donnees: unknown) {
  const { nomPartie, ...reste } = donnees as Record<string, unknown>;
  return { ...reste, nom: nomPartie };
}
const ancienne = v0 as Enveloppe<unknown>;
describe('migrations de sauvegarde', () => {
  it('transforme la fixture fictive sans perdre les autres champs ni modifier la source', () => {
    const avant = structuredClone(v0);
    expect(migrer(ancienne, { ...migrationsParDefaut, 0: migrerV0versV1 })).toEqual(v2);
    expect(v0).toEqual(avant);
    const donnees = { ...v0.donnees, futur: { valeur: 42 } };
    expect(migrer({ ...ancienne, donnees }, { ...migrationsParDefaut, 0: migrerV0versV1 }).donnees)
      .toEqual({ ...v2.donnees, futur: { valeur: 42 } });
  });
  it('signale exactement une marche manquante', () => {
    expect(() => migrer(ancienne)).toThrowError(new Error('Migration manquante : de la version 0 à la version 1.'));
  });
  it('déclare la version 2 et laisse intacte une sauvegarde actuelle', () => {
    expect(VERSION_ACTUELLE).toBe(2);
    expect(migrationsParDefaut).toEqual({ 1: migrerV1versV2 });
    expect(migrer(v2 as Enveloppe<unknown>)).toEqual(v2);
  });
  it('ne mute pas les données même si une migration travaille sur son argument', () => {
    const avant = structuredClone(v0);
    migrer(ancienne, { ...migrationsParDefaut, 0: donnees => {
      (donnees as Record<string, unknown>).nomPartie = 'Modifié';
      return donnees;
    } });
    expect(v0).toEqual(avant);
  });
  it.each([-1, 0.5, NaN])('refuse la version invalide %s', version => {
    expect(() => migrer({ ...ancienne, version })).toThrow('Version invalide');
  });
  it('refuse exactement une version future', () => {
    expect(() => migrer({ ...ancienne, version: 3 })).toThrowError(
      new Error("Cette sauvegarde vient d'une version plus récente du jeu."));
  });
});

// Vérifie chaque clé et valeur d'origine, y compris dans les Pokémon enrichis.
function verifierConservation(source: unknown, resultat: unknown) {
  if (source !== null && typeof source === 'object') {
    for (const [cle, valeur] of Object.entries(source)) {
      expect(Object.hasOwn(resultat as object, cle)).toBe(true);
      verifierConservation(valeur, (resultat as Record<string, unknown>)[cle]);
    }
    if (Array.isArray(source)) expect(resultat).toHaveLength(source.length);
  } else expect(resultat).toEqual(source);
}

describe('marche 1 → 2', () => {
  it.each([
    ['partie', v1, v2], ['region', regionV1, regionV2], ['compte', compteV1, compteV2],
  ] as const)('migre exactement la fixture %s sans perte ni mutation et de façon reproductible', (niveau, source, attendu) => {
    const avant = structuredClone(source);
    const resultat = migrer(source as Enveloppe<unknown>);
    expect(resultat).toEqual(attendu);
    const fichier = readFileSync(new URL(`./__fixtures__/${niveau}-v2.json`, import.meta.url), 'utf8');
    expect(`${JSON.stringify(resultat, null, 2)}\n`).toBe(fichier.replace(/\r\n/g, '\n'));
    expect(migrer(source as Enveloppe<unknown>)).toEqual(resultat);
    expect(migrer(resultat)).toEqual(resultat);
    expect(migrerV1versV2(source.donnees, niveau)).toEqual(attendu.donnees);
    expect(source).toEqual(avant);
    verifierConservation(source.donnees, resultat.donnees);
  });
  it('ajoute exactement les valeurs de régionInitiale et conserve les champs inconnus', () => {
    const initiale = regionInitiale('kanto', 'kanto.route-1');
    const resultat = migrer(regionV1 as Enveloppe<unknown>).donnees as Record<string, unknown>;
    for (const [cle, valeur] of Object.entries(initiale)) {
      if (!Object.hasOwn(regionV1.donnees, cle)) expect(resultat[cle]).toEqual(valeur);
    }
    for (const niveau of ['partie', 'region'] as const) {
      const source = niveau === 'partie' ? v1 : regionV1;
      const donnees = { ...source.donnees, inconnu: { liste: [1, 'conservé'] } };
      verifierConservation(donnees, migrer({ ...source, niveau, donnees }).donnees);
    }
  });
  it('calcule le sexe depuis l’uid, indépendamment du niveau, du hasard et de l’horloge', () => {
    const hasard = vi.spyOn(Math, 'random').mockImplementation(() => { throw new Error('Hasard interdit'); });
    const horloge = vi.spyOn(Date, 'now').mockImplementation(() => { throw new Error('Horloge interdit'); });
    try {
      for (const [uid, sexe] of [['b', 'male'], ['a', 'femelle'], ['😀', 'femelle']]) {
        const pokemon = { ...v1.donnees.pcGlobal[0], uid, futur: 42 };
        const partie = migrerV1versV2({ ...v1.donnees, pcGlobal: [pokemon] }, 'partie') as typeof v2.donnees;
        const region = migrerV1versV2({ ...regionV1.donnees, equipe: [pokemon] }, 'region') as typeof regionV2.donnees;
        expect(partie.pcGlobal[0]).toEqual({ ...pokemon, sexe, favori: false });
        expect(region.equipe[0]).toEqual(partie.pcGlobal[0]);
      }
    } finally { hasard.mockRestore(); horloge.mockRestore(); }
  });
  it('passe le niveau à la migration et signale une marche absente', () => {
    const marche = vi.fn(migrerV1versV2);
    migrer(v1 as Enveloppe<unknown>, { 1: marche });
    expect(marche).toHaveBeenCalledWith(v1.donnees, 'partie');
    expect(() => migrer(v1 as Enveloppe<unknown>, {})).toThrowError(new Error('Migration manquante : de la version 1 à la version 2.'));
  });
  it('isole les valeurs ajoutées et préserve les champs présents même s’ils recouvrent les défauts', () => {
    const source = { ...regionV1.donnees, jetons: 17, pension: { futur: ['conservé'] } };
    const avant = structuredClone(source);
    const resultat = migrerV1versV2(source, 'region') as typeof regionV2.donnees;
    verifierConservation(source, resultat);
    resultat.chronos.finRepousse = 99;
    resultat.arretAuto.rare = false;
    resultat.pc.length = 1;
    expect(source).toEqual(avant);
    expect(migrer(regionV1 as Enveloppe<unknown>)).toEqual(regionV2);
    expect(migrerV1versV2(compteV1.donnees, 'compte')).toBe(compteV1.donnees);
  });
});

describe('migration 1 → 2 : données mal formées', () => {
  it("laisse la validation refuser une équipe qui n'est pas une liste, sans exception brute", () => {
    const region = { version: 1, niveau: 'region' as const, id: 'kanto', revision: 1,
      ecritLe: '2026-10-24T10:00:00.000Z', donnees: { regionId: 'kanto', equipe: 'oups' } };
    expect(() => migrer(region as Enveloppe<unknown>)).not.toThrow();
    expect(migrer(region as Enveloppe<unknown>).donnees).toMatchObject({ equipe: 'oups', pc: [] });
  });
});
