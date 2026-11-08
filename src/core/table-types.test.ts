import { expect, it } from 'vitest';
import types from '../../data/types.json';
import { multiplicateurType } from './combat';
import { ficheType, multiplicateurPaire, typesDuJeu } from './table-types';

it('liste les 18 types, Ténèbres, Acier et Fée compris, pour toutes les régions', () => {
  const liste = typesDuJeu();
  expect(liste).toHaveLength(18);
  expect(liste).toEqual(expect.arrayContaining(['dark', 'steel', 'fairy']));
  expect(liste[0]).toBe('normal');
});

it('lit les multiplicateurs de la règle du combat', () => {
  for (const attaque of typesDuJeu()) for (const defense of typesDuJeu()) {
    expect(multiplicateurPaire(attaque, defense)).toBe(multiplicateurType([attaque], [defense], types.efficacite));
  }
  expect(multiplicateurPaire('fire', 'grass')).toBe(2);
  expect(multiplicateurPaire('normal', 'ghost')).toBe(0);
  expect(multiplicateurPaire('normal', 'water')).toBe(1);
});

it('suit les données : un multiplicateur changé change la fiche', () => {
  const liste = ['fire', 'grass', 'water'];
  const efficacite = { fire: { grass: 2, water: 0.5 }, water: { fire: 2 }, grass: { fire: 0.5 } };
  expect(ficheType('fire', liste, efficacite)).toEqual({
    type: 'fire',
    attaque: { fort: ['grass'], peu: ['water'], nul: [] },
    defense: { faible: ['water'], resiste: ['grass'], immunise: [] },
  });
  const change = { ...efficacite, fire: { ...efficacite.fire, grass: 0 } };
  expect(ficheType('fire', liste, change).attaque).toEqual({ fort: [], peu: ['water'], nul: ['grass'] });
});
