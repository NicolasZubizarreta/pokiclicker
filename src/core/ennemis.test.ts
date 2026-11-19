import { describe, expect, it, vi } from 'vitest';
import { creerEnnemi } from './ennemis';
import { reglages } from './reglages';
import { kanto } from './regions';

it('respecte les proportions restantes sur la route 1 avec chaque Repousse', () => {
  const route = kanto.zone('kanto.route-1');
  if (!('sauvages' in route)) throw new Error('Route sans rencontres');
  for (const repousse of reglages.objetsActifs.repousses) {
    const pool = route.sauvages.filter(s => !repousse.exclues.includes(s.rarete));
    const total = pool.reduce((somme, s) => somme + s.apparition, 0);
    const comptes = new Map<number, number>();
    const n = 10000;
    for (let i = 0; i < n; i++) {
      const valeurs = [1, (i + 0.5) / n, 0];
      const ennemi = creerEnnemi(route, 1, () => valeurs.shift()!, reglages.combat, [repousse.cle]);
      comptes.set(ennemi.numero, (comptes.get(ennemi.numero) ?? 0) + 1);
    }
    for (const s of pool) expect(Math.abs((comptes.get(s.pokemon) ?? 0) / n - s.apparition / total)).toBeLessThan(0.0002);
  }
});

const zone: Parameters<typeof creerEnnemi>[0] = {
  id: 'test', nom: 'Test', decor: '', etapes: 10, liens: [], ancienId: 0,
  niveaux: [5, 5], multiplicateurPv: 1,
  sauvages: [{ pokemon: 1, apparition: 1, capture: 1, rarete: 'commun' }],
  boss: { nom: 'Boss', pokemon: 1, niveau: 5, capture: 0 },
};

describe('chance de shiny', () => {
  it.each([
    { actifs: [], tirage: 0.01, shiny: false },
    { actifs: ['objet:shinyCharm'], tirage: 0.005, shiny: true },
    { actifs: ['jalon:151'], tirage: 0.003, shiny: true },
    { actifs: ['jalon:151'], tirage: 0.005, shiny: false },
    { actifs: ['jalon:151', 'objet:shinyCharm'], tirage: 0.0058, shiny: true },
    { actifs: ['objet:shinyCharm', 'jalon:151'], tirage: 0.0058, shiny: true },
    { actifs: ['objet:shinyCharm', 'jalon:151'], tirage: 0.01, shiny: false },
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
