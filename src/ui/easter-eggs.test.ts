import { describe, expect, it } from 'vitest';
import fixture from '../../tests/fixtures/v1-easter-eggs.json';
import type { PokemonPossede } from '../core/sauvegarde';
import { spriteAffiche } from './affichage-pokemon';
import { apparenceSprite } from './easter-eggs';

const pokemon: PokemonPossede = {
  uid: 'test', numero: 1, niveau: 10, xp: 0, shiny: false, bonheur: 0,
  pierreEternelle: false, calcium: 0, sexe: 'male', favori: false,
};

describe('apparence des easter eggs', () => {
  it.each([
    [' DinnerBone ', 'ee-retourne'],
    ['GRUMM', 'ee-retourne'],
    ['Jeb_', 'ee-arc-en-ciel motion-safe:ee-arc-en-ciel-anime'],
    ['CACA', 'ee-caca'],
    ['Bjorn', ''], ['Gabriel', ''], ['Pikachu', ''], ['', ''],
  ])('applique l’apparence de %s', (surnom, classe) => {
    const entree = Object.freeze({ ...pokemon, surnom });
    expect(apparenceSprite(entree)).toEqual({
      src: 'img/sprites/pokemon/1.png', classe, photo: false,
    });
    expect(entree).toEqual({ ...pokemon, surnom });
  });

  it('garde le sprite ordinaire en l’absence de surnom', () => {
    expect(apparenceSprite(pokemon)).toEqual({
      src: 'img/sprites/pokemon/1.png', classe: '', photo: false,
    });
  });

  it.each(fixture.stades)('affiche la photo du stade V1 de $numero', ({ numero, stade }) => {
    const entree = Object.freeze({ ...pokemon, numero, surnom: ' daran ' });
    const src = `img/easter-eggs/daran-stade-${stade}.webp`;
    expect(apparenceSprite(entree)).toEqual({ src, classe: '', photo: true });
    expect(spriteAffiche(entree)).toBe(src);
  });

  it.each(['daran', 'DinnerBone', 'GRUMM', 'Jeb_', 'CACA'])('donne priorité à l’œuf nommé %s', surnom => {
    const entree = Object.freeze({ ...pokemon, surnom, oeuf: Object.freeze({ pasRestants: 10, pasMax: 10 }) });
    expect(apparenceSprite(entree)).toEqual({
      src: 'img/objets/lucky-egg.png', classe: '', photo: false,
    });
    expect(spriteAffiche(entree)).toBe('img/objets/lucky-egg.png');
  });

  it('retire l’effet après un renommage ordinaire', () => {
    const entree = { ...pokemon, surnom: 'daran' };
    expect(apparenceSprite(entree).photo).toBe(true);
    expect(apparenceSprite({ ...entree, surnom: 'Pikachu' })).toEqual({
      src: 'img/sprites/pokemon/1.png', classe: '', photo: false,
    });
  });
});
