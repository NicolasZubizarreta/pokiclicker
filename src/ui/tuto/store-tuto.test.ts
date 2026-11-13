import { afterEach, expect, it } from 'vitest';
import { tutoriel } from '../../core/tutoriels';
import { etapeSuivanteTuto, fermerTuto, lancerTuto, storeTuto } from './store-tuto';

afterEach(fermerTuto);
it('lance puis avance jusqu’à la dernière étape', () => {
  lancerTuto('route-1');
  expect(storeTuto.getState().actif).toEqual({ id: 'route-1', etape: 0, rejeu: false });
  for (let etape = 1; etape < tutoriel('route-1').etapes.length; etape++) {
    expect(etapeSuivanteTuto()).toBe(false);
    expect(storeTuto.getState().actif?.etape).toBe(etape);
  }
  expect(etapeSuivanteTuto()).toBe(true);
  expect(storeTuto.getState().actif).toBeNull();
  expect(etapeSuivanteTuto()).toBe(false);
});
it('ferme et conserve le drapeau de rejeu pendant les étapes', () => {
  lancerTuto('route-1', true);
  etapeSuivanteTuto();
  expect(storeTuto.getState().actif?.rejeu).toBe(true);
  fermerTuto();
  expect(storeTuto.getState().actif).toBeNull();
});
it('ignore un identifiant inconnu sans modifier le tutoriel actif', () => {
  lancerTuto('inconnu');
  expect(storeTuto.getState().actif).toBeNull();
  lancerTuto('pc');
  lancerTuto('inconnu');
  expect(storeTuto.getState().actif?.id).toBe('pc');
});
