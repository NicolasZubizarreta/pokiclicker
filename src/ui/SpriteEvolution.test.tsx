// @vitest-environment jsdom
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { SpriteEvolution } from './SpriteEvolution';

vi.mock('../../public/img/tailles.json', () => ({ default: {
  'img/pokemon/1.png': { largeur: 96, hauteur: 96 },
  'img/pokemon/2.png': { largeur: 96, hauteur: 96 },
} }));

const props = { ancien: 'img/pokemon/1.png', nouveau: 'img/pokemon/2.png', nom: 'Herbizarre' };

describe('SpriteEvolution', () => {
  it('superpose deux Image dimensionnées et réserve les animations au mouvement autorisé', () => {
    const element = document.createElement('div');
    element.innerHTML = renderToStaticMarkup(<SpriteEvolution {...props} actif />);
    const images = element.querySelectorAll('img');
    expect(images).toHaveLength(2);
    expect(Array.from(images, image => image.getAttribute('src'))).toEqual([props.nouveau, props.ancien]);
    for (const image of images) {
      expect(Number(image.width)).toBeGreaterThan(0);
      expect(Number(image.height)).toBeGreaterThan(0);
      expect(image.className).toContain('col-start-1 row-start-1');
      expect(image.className).toContain('motion-safe:evolution-alternance');
    }
    expect(images.item(0)?.alt).toBe(props.nom);
    expect(images.item(0)?.className).toContain('evolution-nouveau');
    expect(images.item(1)?.alt).toBe('');
    expect(images.item(1)?.className).toContain('evolution-ancien');
    expect(images.item(1)?.className).toContain('motion-reduce:hidden');
    expect(element.querySelector('.motion-safe\\:evolution-flash')).not.toBeNull();
  });

  it('affiche seulement le nouveau sprite quand elle est inactive', () => {
    const element = document.createElement('div');
    element.innerHTML = renderToStaticMarkup(<SpriteEvolution {...props} actif={false} />);
    expect(element.querySelectorAll('img')).toHaveLength(1);
    expect(element.querySelector('img')?.getAttribute('src')).toBe(props.nouveau);
    expect(element.innerHTML).not.toContain('motion-safe:');
  });
});
