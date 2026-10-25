// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { creerStockageMemoire } from '../core/sauvegarde';
import { EcranCombat } from './EcranCombat';
import { creerStoreJeu } from './store';

afterEach(() => { cleanup(); vi.useRealTimers(); });

it('intègre les visites à Bourg Palette, garde Chen dessous et une seule annonce accessible', () => {
  vi.useFakeTimers();
  const store = creerStoreJeu({ horloge: creerHorlogeSimulee(), stockage: creerStockageMemoire(),
    alea: () => .1, genererId: () => 'bourg' });
  store.getState().demarrer();
  try {
    store.getState().allerVers(store.getState().zonePrecedente!.id);
    render(<EcranCombat store={store} />);
    const image = screen.getByRole('img', { name: 'Bourg Palette' });
    expect(image.getAttribute('src')).toBe('img/scenes/bourg-palette.webp');
    const chen = screen.getByRole('complementary', { name: 'Dialogue' });
    expect(image.compareDocumentPosition(chen) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.focus(screen.getByRole('button', { name: 'Pension Pokémon' }));
    expect(screen.getByRole('status').textContent).toContain('Tour Pokémon');
    act(() => store.setState({ annonce: 'Zone débloquée !' }));
    expect(screen.getByRole('status').textContent).toBe('Zone débloquée !');
    act(() => store.setState({ annonce: null }));
    expect(screen.getByRole('status').textContent).toContain('Tour Pokémon');
    fireEvent.click(screen.getByRole('button', { name: 'Chez Maman' }));
    act(() => vi.advanceTimersByTime(450));
    expect(screen.getByText("Il n'y a rien à faire ici, sortons.")).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Sortie' }));
    act(() => vi.advanceTimersByTime(450));
    expect(screen.getByRole('img', { name: 'Bourg Palette' })).toBeTruthy();
    act(() => store.getState().allerVers(store.getState().zoneSuivante!.id));
    expect(screen.queryByRole('button', { name: 'Chez Maman' })).toBeNull();
    expect(screen.getByRole('button', { name: /^Attaquer / })).toBeTruthy();
  } finally { store.getState().arreter(); }
});
