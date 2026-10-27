// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { IconeShiny } from './IconeShiny';

afterEach(cleanup);

it('dessine deux étincelles avec des jetons et des dégradés indépendants', () => {
  const { container } = render(<><IconeShiny /><IconeShiny /></>);
  const icones = container.querySelectorAll('svg');
  expect(icones).toHaveLength(2);
  for (const icone of icones) {
    expect(icone.getAttribute('aria-hidden')).toBe('true');
    expect(icone.getAttribute('width')).toBe('1em');
    expect(icone.getAttribute('height')).toBe('1em');
    expect(icone.classList.contains('shrink-0')).toBe(true);
    expect(icone.querySelectorAll('path')).toHaveLength(2);
    expect(icone.querySelector('g')?.getAttribute('stroke')).toBe('var(--color-neutre-950)');
    expect(icone.querySelector('g')?.getAttribute('stroke-width')).toBe('1.8');
    expect([...icone.querySelectorAll('stop')].map(stop => stop.getAttribute('stop-color')))
      .toEqual(['var(--color-accent-400)', 'var(--color-succes-base-sombre)']);
    expect(icone.querySelector('g')?.getAttribute('fill')).toBe(`url(#${icone.querySelector('linearGradient')?.id})`);
  }
  expect(icones[0]!.querySelector('linearGradient')?.id).not.toBe(icones[1]!.querySelector('linearGradient')?.id);
});

it('annonce Chromatique uniquement sur demande', () => {
  render(<IconeShiny decoratif={false} />);
  expect(screen.getByRole('img', { name: 'Chromatique' }).hasAttribute('aria-hidden')).toBe(false);
});
