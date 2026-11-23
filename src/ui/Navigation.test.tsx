// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { Navigation } from './Navigation';
import { storeJeu } from './store';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it('conserve les six entrées téléphone et l’onglet PC actif', () => {
  vi.stubGlobal('matchMedia', vi.fn((requete: string) => ({ matches: requete === '(max-width: 1023px)', addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  render(<Navigation page="PC" choisir={vi.fn()} />);
  const nav = screen.getByRole('navigation');
  expect(within(nav).getAllByRole('button').map(b => b.textContent)).toEqual(['Combat', 'PC', 'Shop', 'Carte', 'Pension', 'Menu']);
  expect(within(nav).getByRole('button', { name: 'PC' }).getAttribute('aria-current')).toBe('page');
  expect(nav.classList.contains('fixed')).toBe(true);
});

const pensionOuverte = (ouvert: boolean) => storeJeu.setState({ pension: { ...storeJeu.getState().pension, acces: { ouvert, raison: null } } });
it('compte les œufs prêts et enlève la pastille après leur retrait', () => {
  const pension = storeJeu.getState().pension;
  storeJeu.setState({ pension: { ...pension, oeufs: [{ uid: 'oeuf-test' } as typeof pension.oeufs[number]] } });
  const { unmount } = render(<Navigation page="Combat" choisir={vi.fn()} />);
  expect(screen.getByLabelText('1 œuf prêt').textContent).toBe('1');
  unmount();
  storeJeu.setState({ pension: { ...pension, oeufs: [] } });
  render(<Navigation page="Combat" choisir={vi.fn()} />);
  expect(screen.queryByLabelText('1 œuf prêt')).toBeNull();
  storeJeu.setState({ pension });
});
it.each([false, true])('ajoute « Pension » entre Carte et Menu même verrouillée (%s)', ouvert => {
  vi.stubGlobal('matchMedia', vi.fn((requete: string) => ({ matches: requete === '(max-width: 1023px)', addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  pensionOuverte(ouvert);
  const choisir = vi.fn();
  render(<Navigation page="Pension" choisir={choisir} />);
  const nav = screen.getByRole('navigation');
  expect(within(nav).getAllByRole('button').map(b => b.textContent)).toEqual(['Combat', 'PC', 'Shop', 'Carte', 'Pension', 'Menu']);
  if (!ouvert) {
    const bouton = within(nav).getByRole('button', { name: 'Pension' });
    expect(bouton.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(bouton);
    expect(choisir).not.toHaveBeenCalled();
    expect(screen.getByRole('status').textContent).toBe('Bientôt disponible.');
    return;
  }
  expect(within(nav).getByRole('button', { name: 'Pension' }).getAttribute('aria-current')).toBe('page');
  expect(within(nav).getByRole('button', { name: 'Menu' }).getAttribute('aria-current')).toBeNull();
  fireEvent.click(within(nav).getByRole('button', { name: 'Pension' }));
  expect(choisir).toHaveBeenCalledWith('Pension');
  pensionOuverte(false);
});
