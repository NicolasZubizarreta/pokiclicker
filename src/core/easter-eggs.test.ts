import { expect, it } from 'vitest';
import donnees from '../../data/easter-eggs.json';
import fixture from '../../tests/fixtures/v1-easter-eggs.json';
import { chargerEasterEggs, effetDe, stadeEvolution } from './easter-eggs';

it('normalise les surnoms et respecte les effets inactifs', () => {
  expect(effetDe(' DinnerBone ')).toBe('retourne');
  expect(effetDe('DARAN')).toBe('photo');
  expect(effetDe('Bjorn')).toBeNull();
  expect(effetDe()).toBeNull();
});
it.each(fixture.stades)('retrouve le stade V1 de $numero', ({ numero, stade }) => {
  expect(stadeEvolution(numero)).toBe(stade);
});
it('valide les données sans les modifier et signale les erreurs en français', () => {
  const copie = structuredClone(donnees);
  expect(chargerEasterEggs(copie)).toEqual(donnees);
  expect(copie).toEqual(donnees);
  expect(() => chargerEasterEggs({ ...donnees, version: 2 })).toThrow(/Easter eggs invalides/);
  expect(() => chargerEasterEggs({ ...donnees, effets: [{ effet: 'inconnu' }] })).toThrow(/Easter eggs invalides/);
  expect(() => stadeEvolution(0)).toThrow(/Numéro de Pokémon invalide/);
});
