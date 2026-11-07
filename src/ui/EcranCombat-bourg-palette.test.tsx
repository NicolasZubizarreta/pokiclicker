// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { creerStockageMemoire } from '../core/sauvegarde';
import { kanto } from '../core/regions';
import { EcranCombat } from './EcranCombat';
import { creerStoreJeu } from './store';

afterEach(() => { cleanup(); vi.useRealTimers(); });

it('intègre les visites à Bourg Palette, garde Chen dessous et une seule phrase d’état accessible', () => {
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
    // Une annonce du jeu n'écrase plus la phrase d'état du lieu : elle s'affiche dans le calque de notifications.
    act(() => store.setState({ annonce: 'Zone débloquée !' }));
    expect(screen.getByRole('status').textContent).toContain('Tour Pokémon');
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

// V1 (update.js l.320-344) : le labo est montré en entier (object-contain) avec une zone « Sortie » qui ramène à Bourg Palette.
it('montre le labo en entier avec sa Sortie clignotante, qui ramène à Bourg Palette', () => {
  vi.useFakeTimers();
  const store = creerStoreJeu({ horloge: creerHorlogeSimulee(), stockage: creerStockageMemoire(),
    alea: () => .1, genererId: () => 'labo' });
  store.getState().demarrer();
  try {
    const allerVers = vi.fn();
    const labo = kanto.lieu('labo');
    act(() => store.setState({ allerVers, zone: null, ennemi: null,
      lieu: { id: 'kanto.labo', nom: labo.nom, decor: labo.decor, ancienId: labo.ancienId, sansCombat: true, liens: [{ vers: labo.depuis }] } }));
    render(<EcranCombat store={store} />);
    const image = screen.getByRole('img', { name: labo.nom });
    expect(image.getAttribute('src')).toBe('img/scenes/labo.webp');
    expect(image.className).toContain('object-contain');
    const sortie = screen.getByRole('button', { name: 'Sortie' });
    expect(document.querySelector('[data-forme="Sortie"]')?.getAttribute('class')).toContain('flash-vert');
    fireEvent.click(sortie);
    act(() => vi.advanceTimersByTime(450));
    expect(allerVers).toHaveBeenCalledExactlyOnceWith('kanto.bourg-palette');
  } finally { store.getState().arreter(); }
});
