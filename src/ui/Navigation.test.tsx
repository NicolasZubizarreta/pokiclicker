// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { Navigation } from './Navigation';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it('conserve les cinq entrées téléphone et le mapping originePC', () => {
  vi.stubGlobal('matchMedia', vi.fn((requete: string) => ({ matches: requete === '(max-width: 1023px)', addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  render(<Navigation page="PC" originePC="Équipe" choisir={vi.fn()} />);
  const nav = screen.getByRole('navigation');
  expect(within(nav).getAllByRole('button').map(b => b.textContent)).toEqual(['Combat', 'Équipe', 'Shop', 'Carte', 'Menu']);
  expect(within(nav).getByRole('button', { name: 'Équipe' }).getAttribute('aria-current')).toBe('page');
  expect(nav.classList.contains('fixed')).toBe(true);
});
