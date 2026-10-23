// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { Image, facteurEntier } from './Image';
import tailles from '../../public/img/tailles.json';

afterEach(() => { cleanup(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

it('lit le fichier de tailles et réserve les dimensions du décor', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  Object.assign(tailles, { 'img/decors/route.webp': { largeur: 1920, hauteur: 1080 } });
  try {
    render(<Image src="img/decors/route.webp" genre="decor" alt="La Route 1 en été" />);
    const image = screen.getByRole('img', { name: 'La Route 1 en été' });
    expect(image.getAttribute('width')).toBe('1920');
    expect(image.getAttribute('height')).toBe('1080');
    expect(image.getAttribute('decoding')).toBe('async');
    expect(image.getAttribute('loading')).toBe('eager');
    expect(image.className).toContain('aspect-video');
    expect(image.className).not.toContain('object-cover');
  } finally {
    Reflect.deleteProperty(tailles, 'img/decors/route.webp');
  }
});

it('affiche un sprite pixelisé à un facteur entier', () => {
  render(<Image src="img/sprites/pokemon/19.png" genre="sprite" alt="Rattata de face"
    largeurDisponible={500} tailles={{ 'img/sprites/pokemon/19.png': { largeur: 96, hauteur: 96 } }} />);
  const image = screen.getByRole('img', { name: 'Rattata de face' });
  expect(image.className).toContain('image-rendering-pixelated');
  expect(image.getAttribute('width')).toBe('480');
  expect(image.getAttribute('height')).toBe('480');
});

it('signale une image inconnue en développement', () => {
  vi.stubEnv('DEV', true);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  expect(() => render(<Image src="absente.png" genre="decor" alt="Un décor absent" />))
    .toThrow('Image inconnue : absente.png. Lance le script de traitement des images.');
});

it('préserve le rendu en production si le manifeste est vide', () => {
  vi.stubEnv('DEV', false);
  const { container } = render(<Image src="absente.png" genre="decor" alt="Un décor absent" />);
  expect(container.childElementCount).toBe(0);
});

it.each([[500, 96, 5], [95, 96, 1], [192, 96, 2], [287, 96, 2]])(
  'calcule un facteur entier pour %s / %s', (largeur, taille, attendu) => {
    expect(facteurEntier(largeur, taille)).toBe(attendu);
  });

it.each([[0, 96], [-1, 96], [96, 0], [96, -1], [Infinity, 96], [96, NaN]])(
  'refuse une dimension invalide : %s / %s', (largeur, taille) => {
    expect(() => facteurEntier(largeur, taille)).toThrow('doivent être positives et finies');
  });
