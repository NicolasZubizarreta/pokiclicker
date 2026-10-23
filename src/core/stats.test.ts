import { describe, expect, it } from 'vitest';
import { chargerPokemon } from './pokemon';
import { calculerDps, puissanceDeBase, pvDeBase, statsDeCombat } from './stats';

const bulbizarre = chargerPokemon().parNumero(1);

describe('stats de combat', () => {
  it('calcule et arrondit les formules à la main', () => {
    // Bulbizarre : 318 / 4 = 79,5 ; 14,85 + 14,7 + 19,5 + 10 = 59,05.
    expect(puissanceDeBase(bulbizarre.stats)).toBe(79);
    expect(pvDeBase(bulbizarre.stats)).toBe(59);
    const uniformes = { pv: 100, attaque: 100, defense: 100, attaqueSpe: 100, defenseSpe: 100, vitesse: 100 };
    expect(puissanceDeBase(uniformes)).toBe(150);
    expect(pvDeBase(uniformes)).toBe(103);
  });

  it('applique les surcharges indépendamment avant les formules', () => {
    expect(statsDeCombat(bulbizarre, [])).toEqual({ puissance: 79, pv: 59 });
    expect(statsDeCombat(bulbizarre, [{ pokemon: 1, puissance: 7 }])).toEqual({ puissance: 7, pv: 59 });
    expect(statsDeCombat(bulbizarre, [{ pokemon: 1, pv: 8 }])).toEqual({ puissance: 79, pv: 8 });
    expect(statsDeCombat(bulbizarre, [{ pokemon: 1, puissance: 7, pv: 8 }])).toEqual({ puissance: 7, pv: 8 });
    expect(statsDeCombat(chargerPokemon().parNumero(129)).puissance).toBe(5);
  });
});

describe('DPS de la V1', () => {
  const catalogue = chargerPokemon({ version: 1, pokemon: [
    { ...bulbizarre, numero: 19, nom: 'Rattata' },
    { ...bulbizarre, numero: 25, nom: 'Pikachu' },
    { ...bulbizarre, numero: 129, nom: 'Magicarpe' },
    { ...bulbizarre, numero: 150, nom: 'Mewtwo' },
  ] });
  const surcharges = [
    { pokemon: 19, puissance: 63 }, { pokemon: 25, puissance: 80 },
    { pokemon: 129, puissance: 5 }, { pokemon: 150, puissance: 170 },
  ];
  const base = { numero: 25, niveau: 10 };
  it.each([
    [base, 160],
    [{ ...base, shiny: true }, 240],
    [{ ...base, bonheur: 100 }, 176],
    [{ ...base, calcium: 5 }, 176],
    [{ ...base, pierreEternelle: true }, 200],
    [{ ...base, multiplicateurType: 2 }, 320],
    [{ numero: 129, niveau: 100 }, 100],
    [{ numero: 150, niveau: 50 }, 1700],
    [{ ...base, multiplicateurType: 0 }, 0],
    [{ ...base, niveau: 0 }, 0],
    [{ ...base, multiplicateurType: 0.5 }, 80],
  ])('reproduit le cas %j → %s', (entree, attendu) => {
    expect(calculerDps(entree, catalogue, surcharges)).toBe(attendu);
  });

  it('combine les bonus de Rattata sans arrondir le DPS', () => {
    // 63 × 20 / 5 × 1,5 × 1,05 × 1,25 × 1,2 = 595,35.
    expect(calculerDps({
      numero: 19, niveau: 20, shiny: true, bonheur: 50, calcium: 10, pierreEternelle: true,
    }, catalogue, surcharges)).toBeCloseTo(595.35, 12);
  });

  it('utilise le catalogue et les surcharges par défaut', () => {
    expect(calculerDps(base)).toBe(160);
  });
});
