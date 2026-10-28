// @vitest-environment jsdom
import { expect, it, vi } from 'vitest';
import { musiques } from '../core/musiques';
import { reglages } from '../core/reglages';
import { creerVolumes } from './volumes';

it('part des valeurs par défaut des données', () => {
  localStorage.removeItem('pokiclicker:volumes');
  const neuf = creerVolumes({ enregistrer: () => {} });
  expect(neuf.instantane()).toEqual({ effets: reglages.sons.volumeParDefaut, musique: musiques.volumeParDefaut });
});

it('arrondit et borne entre 0 et 100, enregistre et prévient une seule fois par changement', () => {
  const enregistrer = vi.fn();
  const volumes = creerVolumes({ initial: { effets: 40, musique: 30 }, enregistrer });
  const abonne = vi.fn();
  const retirer = volumes.abonner(abonne);
  volumes.definir('effets', 140);
  expect(volumes.lire('effets')).toBe(100);
  volumes.definir('musique', -5);
  expect(volumes.lire('musique')).toBe(0);
  volumes.definir('musique', 12.6);
  expect(volumes.lire('musique')).toBe(13);
  expect(enregistrer).toHaveBeenLastCalledWith({ effets: 100, musique: 13 });
  expect(abonne).toHaveBeenCalledTimes(3);
  volumes.definir('musique', 13);
  volumes.definir('musique', Number.NaN);
  expect(abonne).toHaveBeenCalledTimes(3);
  retirer();
  volumes.definir('effets', 10);
  expect(abonne).toHaveBeenCalledTimes(3);
});

it('garde la même référence tant que rien ne change (useSyncExternalStore)', () => {
  const volumes = creerVolumes({ initial: { effets: 40, musique: 30 }, enregistrer: () => {} });
  const avant = volumes.instantane();
  volumes.definir('effets', 40);
  expect(volumes.instantane()).toBe(avant);
});
