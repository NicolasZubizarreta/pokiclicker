import { expect, it, vi } from 'vitest';
import { reprendreCombat } from './combat';
import { kanto } from './regions';

const zone = kanto.zoneDeCombat('kanto.route-1');
it('reprend une étape avec un ennemi neuf sans modifier la zone ni l’équipe', () => {
  const equipe = Object.freeze([{ numero: 1, niveau: 5 }]);
  const combat = reprendreCombat(zone, equipe, () => .1, 4);
  expect(combat.etape).toBe(4);
  expect(combat.attenteMs).toBe(0);
  expect(combat.equipe).toBe(equipe);
  expect(combat.ennemi.pv).toBe(combat.ennemi.pvMax);
  expect(combat.evenements).toEqual([]);
});
it('reprend directement le boss sans tirage aléatoire superflu', () => {
  const alea = vi.fn(() => .1);
  expect(reprendreCombat(zone, [], alea, 10).ennemi.boss).toBe(true);
  expect(alea).not.toHaveBeenCalled();
});
it.each([0, 11, 1.5, NaN])('refuse une étape invalide : %s', etape => {
  expect(() => reprendreCombat(zone, [], () => .1, etape)).toThrow('Étape de reprise invalide');
});
