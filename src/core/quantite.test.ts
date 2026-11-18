import { describe, expect, it } from 'vitest';
import { plafondQuantite, quantiteMoinsPlafond, quantitePlusDixPlafond, quantitePlusPlafond } from './quantite';

describe('quantité d’utilisation', () => {
  it('boucle de 1 au plafond et inversement', () => {
    expect(quantiteMoinsPlafond(1, 99)).toBe(99);
    expect(quantiteMoinsPlafond(1, 7)).toBe(7);
    expect(quantitePlusPlafond(99, 99)).toBe(1);
    expect(quantitePlusPlafond(7, 7)).toBe(1);
    expect(quantitePlusPlafond(3, 7)).toBe(4);
    expect(quantiteMoinsPlafond(4, 7)).toBe(3);
  });
  it('+10 s’arrête au plafond, jamais au-dessus de 99', () => {
    expect(quantitePlusDixPlafond(5, 99)).toBe(15);
    expect(quantitePlusDixPlafond(95, 99)).toBe(99);
    expect(quantitePlusDixPlafond(5, 8)).toBe(8);
    expect(plafondQuantite(281)).toBe(99);
    expect(plafondQuantite(0)).toBe(1);
  });
  it('ramène une quantité devenue trop grande sous le plafond', () => {
    expect(quantiteMoinsPlafond(50, 12)).toBe(11);
  });
});
