// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { IconeObjet, Menu } from './icones';

afterEach(cleanup);

it('garde l’icône Menu décorative pour laisser le bouton porter son nom', () => {
  render(<button><Menu />Menu</button>);
  expect(screen.getByRole('button', { name: 'Menu' }).querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
});

it('affiche une image locale décorative ou un SVG nommé de taille identique', () => {
  const vue = render(<IconeObjet image="img/objets/restes.png" nom="Restes" />);
  const image = vue.container.querySelector('img');
  expect(image?.getAttribute('src')).toBe('img/objets/restes.png');
  expect(image?.getAttribute('alt')).toBe('');
  expect(image?.classList.contains('h-12')).toBe(true);
  expect(image?.classList.contains('w-12')).toBe(true);
  vue.rerender(<IconeObjet image={null} nom="Chaussures" />);
  const icone = screen.getByRole('img', { name: 'Chaussures' });
  expect(icone.tagName.toLowerCase()).toBe('svg');
  expect(icone.classList.contains('h-12')).toBe(true);
  expect(icone.classList.contains('w-12')).toBe(true);
});
