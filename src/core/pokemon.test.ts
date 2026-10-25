import { describe, expect, it } from 'vitest';
import types from '../../data/types.json';
import { nomType } from './pokemon';

describe('nomType', () => {
  it('couvre les mêmes clés que data/types.json', () => {
    expect(Object.keys(types.efficacite).sort()).toEqual([
      'bug', 'dark', 'dragon', 'electric', 'fairy', 'fighting', 'fire', 'flying', 'ghost',
      'grass', 'ground', 'ice', 'normal', 'poison', 'psychic', 'rock', 'steel', 'water',
    ]);
    for (const cle of Object.keys(types.efficacite)) expect(nomType(cle)).toBeTruthy();
  });

  it.each([['grass', 'Plante'], ['electric', 'Électrik'], ['dark', 'Ténèbres']])(
    'traduit %s en %s',
    (cle, nom) => expect(nomType(cle)).toBe(nom),
  );

  it('signale clairement une clé inconnue en français', () => {
    expect(() => nomType('unknown')).toThrow('Type inconnu : unknown');
  });
});
