// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { Navigation } from './Navigation';
import { storeJeu } from './store';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it('conserve les cinq entrées téléphone et le mapping originePC', () => {
  vi.stubGlobal('matchMedia', vi.fn((requete: string) => ({ matches: requete === '(max-width: 1023px)', addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  render(<Navigation page="PC" originePC="Équipe" choisir={vi.fn()} />);
  const nav = screen.getByRole('navigation');
  expect(within(nav).getAllByRole('button').map(b => b.textContent)).toEqual(['Combat', 'Équipe', 'Shop', 'Carte', 'Menu']);
  expect(within(nav).getByRole('button', { name: 'Équipe' }).getAttribute('aria-current')).toBe('page');
  expect(nav.classList.contains('fixed')).toBe(true);
});

const pensionOuverte = (ouvert: boolean) => storeJeu.setState({ pension: { ...storeJeu.getState().pension, acces: { ouvert, raison: null } } });
it.each([false, true])('ajoute « Pension » entre Carte et Menu seulement si elle est débloquée (%s)', ouvert => {
  vi.stubGlobal('matchMedia', vi.fn((requete: string) => ({ matches: requete === '(max-width: 1023px)', addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  pensionOuverte(ouvert);
  const choisir = vi.fn();
  render(<Navigation page="Pension" choisir={choisir} />);
  const nav = screen.getByRole('navigation');
  expect(within(nav).getAllByRole('button').map(b => b.textContent)).toEqual(ouvert ? ['Combat', 'Équipe', 'Shop', 'Carte', 'Pension', 'Menu'] : ['Combat', 'Équipe', 'Shop', 'Carte', 'Menu']);
  if (!ouvert) { pensionOuverte(false); return; }
  expect(within(nav).getByRole('button', { name: 'Pension' }).getAttribute('aria-current')).toBe('page');
  expect(within(nav).getByRole('button', { name: 'Menu' }).getAttribute('aria-current')).toBeNull();
  fireEvent.click(within(nav).getByRole('button', { name: 'Pension' }));
  expect(choisir).toHaveBeenCalledWith('Pension');
  pensionOuverte(false);
});
