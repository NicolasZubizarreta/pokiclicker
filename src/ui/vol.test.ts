import { expect, it } from 'vitest';
import { reglages } from '../core/reglages';
import { etapeVol } from './vol';

// save.js L759-797 : overlay affiché à 800 ms, actif 50 ms plus tard.
it.each([
  [0, 1, 'pose', false, false],
  [150, 2, 'pose', false, false],
  [600, 5, 'pose', false, false],
  [800, 5, 'pose', false, false],
  [850, 5, 'vol', false, false],
  [3299, 5, 'vol', false, false],
  [3300, 5, 'fermeture', true, false],
  [3800, 5, 'fini', true, true],
  [4000, 5, 'fini', true, true],
] as const)('vol V1 à %i ms', (ms, image, phase, changerZone, fini) => {
  expect(etapeVol(ms)).toEqual({ image, phase, changerZone, fini });
});

it('centralise les constantes V1', () => {
  expect(reglages.interface.vol).toMatchObject({ poseMs: 800, delaiOuvertureMs: 50, volMs: 2500, fermetureMs: 500, imageMs: 150, images: 5, pisteMs: 400, traitsMs: 200 });
  expect(reglages.carte).toMatchObject({ zoomMax: 6, deblocageMs: 600, seuilGlissementPx: 8, diviseurMolette: 500, rayonCiblePx: 22 });
});
