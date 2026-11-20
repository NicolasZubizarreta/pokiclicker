// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { modeDeveloppeur } from './mode-dev';
import { armementTutoAutorise, departNouvellePartie } from './store';

afterEach(() => { vi.unstubAllEnvs(); localStorage.clear(); });
it('autorise les outils en test', () => { expect(modeDeveloppeur()).toBe(true); });
it('ignore les clés de développement en production', () => {
  vi.stubEnv('MODE', 'production'); vi.stubEnv('DEV', false);
  localStorage.setItem('pokiclicker-dev:equipe-de-depart', '1');
  expect(modeDeveloppeur()).toBe(false);
  expect(departNouvellePartie()).toEqual({ equipe: [], drapeaux: ['nouvelle-partie'] });
  expect(armementTutoAutorise()).toBe(true);
});
it('autorise les clés dans le build e2e', () => {
  vi.stubEnv('MODE', 'e2e'); vi.stubEnv('DEV', false);
  localStorage.setItem('pokiclicker-dev:equipe-de-depart', '1');
  expect(modeDeveloppeur()).toBe(true);
  expect(departNouvellePartie().equipe.length).toBeGreaterThan(0);
});
