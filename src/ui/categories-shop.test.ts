import { expect, it } from 'vitest';
import { categorieShop } from './categories-shop';

it.each([
  ['balles', false, 'balles'],
  ['soins', false, 'objets'],
  ['equipement', true, 'accessoires'],
  ['soins', true, 'accessoires'],
] as const)('classe %s (unique : %s)', (categorie, unique, attendu) => {
  expect(categorieShop({ categorie, unique })).toBe(attendu);
});
