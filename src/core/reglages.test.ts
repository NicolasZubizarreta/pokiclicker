import { expect, it } from 'vitest';
import { reglages, type Ton } from './reglages';

it.each<Ton>(['hit', 'coin', 'catch', 'up', 'pc', 'alerte'])('définit les notes et la durée du ton %s', ton => {
  expect(reglages.sons.tons[ton].notes.length).toBeGreaterThan(0);
  expect(reglages.sons.tons[ton].duree).toMatch(/^\d+n$/);
});

it('définit un entraînement de trente secondes', () => {
  expect(reglages.combat.mannequinMs).toBe(30000);
  expect(reglages.sons.tons.alerte.notes).toHaveLength(2);
});
