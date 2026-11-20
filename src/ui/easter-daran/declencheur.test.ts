import { expect, it, vi } from 'vitest';
import { regionInitiale } from '../../core/sauvegarde';
import { declencherAnniversaire } from './declencheur';
import { DRAPEAU_DARAN } from './nettoyage';

function dependances(identifiant: string | null = 'compte-test', autorise = 'compte-test', dejaFait = false) {
  const region = regionInitiale('kanto', 'kanto.route-1');
  if (dejaFait) region.drapeaux.push(DRAPEAU_DARAN);
  return {
    lireIdentifiant: () => identifiant,
    autorise,
    appliquerRegion: vi.fn(f => f(region)),
    ouvrir: vi.fn(),
  };
}

it('nettoie et ouvre pour Daran sur le bon compte', () => {
  const deps = dependances();
  declencherAnniversaire('Daran', deps);
  expect(deps.appliquerRegion).toHaveBeenCalledTimes(1);
  expect(deps.ouvrir).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ argent: expect.any(Number), jetons: expect.any(Number) }));
});

it.each([
  ['mauvais compte', 'autre', 'compte-test', 'Daran'],
  ['autorisation vide', 'compte-test', '', 'Daran'],
  ['autre surnom', 'compte-test', 'compte-test', 'Pikachu'],
  ['identifiant absent', null, 'compte-test', 'Daran'],
])('ignore : %s', (_, identifiant, autorise, surnom) => {
  const deps = dependances(identifiant, autorise!);
  declencherAnniversaire(surnom!, deps);
  expect(deps.appliquerRegion).not.toHaveBeenCalled();
  expect(deps.ouvrir).not.toHaveBeenCalled();
});

it('échoue sans compte configuré', () => {
  const { autorise: _, ...deps } = dependances();
  declencherAnniversaire('Daran', deps);
  expect(deps.appliquerRegion).not.toHaveBeenCalled();
  expect(deps.ouvrir).not.toHaveBeenCalled();
});

it('ne rouvre pas une région déjà nettoyée', () => {
  const deps = dependances('compte-test', 'compte-test', true);
  declencherAnniversaire('Daran', deps);
  expect(deps.appliquerRegion).toHaveBeenCalledTimes(1);
  expect(deps.ouvrir).not.toHaveBeenCalled();
});
