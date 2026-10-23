import { describe, expect, it } from 'vitest';
import v0 from './__fixtures__/partie-v0.json';
import v1 from './__fixtures__/partie-v1.json';
import { migrer, migrationsParDefaut } from './index';
import type { Enveloppe } from '../sauvegarde-types';

export function migrerV0versV1(donnees: unknown) {
  const { nomPartie, ...reste } = donnees as Record<string, unknown>;
  return { ...reste, nom: nomPartie };
}
const ancienne = v0 as Enveloppe<unknown>;
describe('migrations de sauvegarde', () => {
  it('transforme la fixture fictive sans perdre les autres champs ni modifier la source', () => {
    const avant = structuredClone(v0);
    expect(migrer(ancienne, { 0: migrerV0versV1 })).toEqual(v1);
    expect(v0).toEqual(avant);
    const donnees = { ...v0.donnees, futur: { valeur: 42 } };
    expect(migrer({ ...ancienne, donnees }, { 0: migrerV0versV1 }).donnees)
      .toEqual({ ...v1.donnees, futur: { valeur: 42 } });
  });
  it('signale exactement une marche manquante', () => {
    expect(() => migrer(ancienne)).toThrowError(new Error('Migration manquante : de la version 0 à la version 1.'));
  });
  it('laisse intacte une sauvegarde actuelle avec la table par défaut vide', () => {
    expect(migrationsParDefaut).toEqual({});
    expect(migrer(v1 as Enveloppe<unknown>)).toEqual(v1);
  });
  it('ne mute pas les données même si une migration travaille sur son argument', () => {
    const avant = structuredClone(v0);
    migrer(ancienne, { 0: donnees => {
      (donnees as Record<string, unknown>).nomPartie = 'Modifié';
      return donnees;
    } });
    expect(v0).toEqual(avant);
  });
  it.each([-1, 0.5, NaN])('refuse la version invalide %s', version => {
    expect(() => migrer({ ...ancienne, version })).toThrow('Version invalide');
  });
  it('refuse exactement une version future', () => {
    expect(() => migrer({ ...ancienne, version: 99 })).toThrowError(
      new Error("Cette sauvegarde vient d'une version plus récente du jeu."));
  });
});
