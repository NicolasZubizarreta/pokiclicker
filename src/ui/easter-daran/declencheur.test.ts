// @vitest-environment node
import { expect, it, vi } from 'vitest';
import { regionInitiale } from '../../core/sauvegarde';
import { hasherEmail } from './compte-daran';
import { declencherAnniversaire } from './declencheur';
import { DRAPEAU_DARAN } from './nettoyage';

async function dependances(email: string | null = 'dresseur@exemple.test', autorise?: string, dejaFait = false) {
  const region = regionInitiale('kanto', 'kanto.route-1');
  if (dejaFait) region.drapeaux.push(DRAPEAU_DARAN);
  return {
    lireEmail: async () => email,
    autorise: autorise ?? await hasherEmail('dresseur@exemple.test'),
    appliquerRegion: vi.fn(f => f(region)),
    ouvrir: vi.fn(),
  };
}

it('nettoie et ouvre pour Daran sur le bon compte', async () => {
  const deps = await dependances();
  await declencherAnniversaire('Daran', deps);
  expect(deps.appliquerRegion).toHaveBeenCalledTimes(1);
  expect(deps.ouvrir).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ argent: expect.any(Number), jetons: expect.any(Number) }));
});

it.each([
  ['mauvais compte', 'autre@exemple.test', undefined, 'Daran'],
  ['autorisation vide', 'dresseur@exemple.test', '', 'Daran'],
  ['autre surnom', 'dresseur@exemple.test', undefined, 'Pikachu'],
  ['email absent', null, undefined, 'Daran'],
])('ignore : %s', async (_, email, autorise, surnom) => {
  const deps = await dependances(email, autorise);
  const lireEmail = vi.spyOn(deps, 'lireEmail');
  await declencherAnniversaire(surnom!, deps);
  if (surnom === 'Pikachu') expect(lireEmail).not.toHaveBeenCalled();
  expect(deps.appliquerRegion).not.toHaveBeenCalled();
  expect(deps.ouvrir).not.toHaveBeenCalled();
});

it('refuse un autre compte avec la constante configurée', async () => {
  const deps = { ...await dependances(), autorise: undefined };
  await declencherAnniversaire('Daran', deps);
  expect(deps.appliquerRegion).not.toHaveBeenCalled();
  expect(deps.ouvrir).not.toHaveBeenCalled();
});

it('ne rouvre pas une région déjà nettoyée', async () => {
  const deps = await dependances('dresseur@exemple.test', undefined, true);
  await declencherAnniversaire('Daran', deps);
  expect(deps.appliquerRegion).toHaveBeenCalledTimes(1);
  expect(deps.ouvrir).not.toHaveBeenCalled();
});

it('ignore un échec de lecture de l’e-mail', async () => {
  const deps = await dependances();
  deps.lireEmail = async () => { throw new Error('hors ligne'); };
  await declencherAnniversaire('Daran', deps);
  expect(deps.appliquerRegion).not.toHaveBeenCalled();
  expect(deps.ouvrir).not.toHaveBeenCalled();
});
