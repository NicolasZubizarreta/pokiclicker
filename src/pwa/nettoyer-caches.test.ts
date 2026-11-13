import { expect, it, vi } from 'vitest';
import { nettoyerCachesImages } from './nettoyer-caches';

it('supprime les anciens caches d\'images lourdes et garde le courant et les autres', async () => {
  const supprimer = vi.fn(async () => true);
  const stockage = { keys: async () => ['images-lourdes', 'images-lourdes-aaa', 'images-lourdes-bbb', 'workbox-precache-v2-x'], delete: supprimer };
  expect(await nettoyerCachesImages('images-lourdes-bbb', stockage)).toEqual(['images-lourdes', 'images-lourdes-aaa']);
  expect(supprimer).toHaveBeenCalledTimes(2);
  expect(supprimer).not.toHaveBeenCalledWith('images-lourdes-bbb');
  expect(supprimer).not.toHaveBeenCalledWith('workbox-precache-v2-x');
});

it('ne fait rien sans API de cache', async () => {
  expect(await nettoyerCachesImages('x', undefined)).toEqual([]);
});
