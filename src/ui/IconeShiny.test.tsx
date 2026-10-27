// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { IconeShiny } from './IconeShiny';

afterEach(cleanup);

it('dessine une étoile ✦ dorée avec le jeton de la charte', () => {
  const { container } = render(<IconeShiny />);
  const icone = container.querySelector('svg')!;
  expect(icone.getAttribute('aria-hidden')).toBe('true');
  expect(icone.getAttribute('width')).toBe('1em');
  expect(icone.getAttribute('height')).toBe('1em');
  expect(icone.classList.contains('shrink-0')).toBe(true);
  expect(icone.querySelectorAll('path')).toHaveLength(1);
  expect(icone.querySelector('path')?.getAttribute('fill')).toBe('var(--color-alerte-base-sombre)');
  expect(icone.querySelector('linearGradient')).toBeNull();
});

it('annonce Chromatique uniquement sur demande', () => {
  render(<IconeShiny decoratif={false} />);
  expect(screen.getByRole('img', { name: 'Chromatique' }).hasAttribute('aria-hidden')).toBe(false);
});
