import { describe, expect, it, vi } from 'vitest';
import { creerEnnemi } from './ennemis';
import { reglages } from './reglages';

const zone: Parameters<typeof creerEnnemi>[0] = {
  id: 'test', nom: 'Test', decor: '', etapes: 10, liens: [], ancienId: 0,
  niveaux: [5, 5], multiplicateurPv: 1,
  sauvages: [{ pokemon: 1, apparition: 1, capture: 1, rarete: 'commun' }],
  boss: { nom: 'Boss', pokemon: 1, niveau: 5, capture: 0 },
};

describe('chance de shiny', () => {
  it.each([
    { actifs: [], tirage: 0.01, shiny: false },
    { actifs: ['objet:shinyCharm'], tirage: 0.01, shiny: true },
    { actifs: ['jalon:151'], tirage: 0.007, shiny: true },
    { actifs: ['jalon:151'], tirage: 0.01, shiny: false },
    { actifs: ['jalon:151', 'objet:shinyCharm'], tirage: 0.0117, shiny: true },
    { actifs: ['objet:shinyCharm', 'jalon:151'], tirage: 0.0117, shiny: true },
    { actifs: ['objet:shinyCharm', 'jalon:151'], tirage: 0.02, shiny: false },
  ])('$actifs, tirage $tirage → shiny $shiny', ({ actifs, tirage, shiny }) => {
    const alea = vi.fn(() => tirage);
    const options = structuredClone(reglages.combat);
    const avant = structuredClone({ zone, options, actifs });

    expect(creerEnnemi(zone, 1, alea, options, actifs).shiny).toBe(shiny);
    expect(alea).toHaveBeenCalledTimes(3);
    expect({ zone, options, actifs }).toEqual(avant);
  });

  it('ne tire aucun aléa pour un boss, même avec les deux bonus', () => {
    const alea = vi.fn(() => 0);
    expect(creerEnnemi(zone, reglages.combat.etapeBoss, alea, reglages.combat,
      ['objet:shinyCharm', 'jalon:151']).shiny).toBe(false);
    expect(alea).not.toHaveBeenCalled();
  });
});
