// @vitest-environment jsdom
import { useState } from 'react';
import { act, cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MiseAJour } from './MiseAJour';
import { storeJeu } from './store';

const double = vi.hoisted(() => ({ actualiser: false, horsLigne: false, mettreAJour: vi.fn() }));
vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({ needRefresh: useState(double.actualiser), offlineReady: useState(double.horsLigne),
    updateServiceWorker: double.mettreAJour }),
}));
beforeEach(() => { double.actualiser = false; double.horsLigne = false; double.mettreAJour.mockReset(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

it('ne montre rien au départ', () => {
  const { container } = render(<MiseAJour />);
  expect(container.innerHTML).toBe('');
});

it('annonce la mise à jour en français et permet de la remettre à plus tard', () => {
  double.actualiser = true;
  render(<MiseAJour />);
  const bandeau = screen.getByRole('status');
  expect(bandeau.classList.contains('fixed')).toBe(true);
  expect(bandeau.getAttribute('aria-live')).toBe('polite');
  expect(screen.getByText("Une mise à jour est prête. Recharge pour l'utiliser.")).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Recharger' })).toBeTruthy();
  expect(bandeau.textContent).toBe("Une mise à jour est prête. Recharge pour l'utiliser.RechargerPlus tard");
  fireEvent.click(screen.getByRole('button', { name: 'Plus tard' }));
  expect(screen.queryByRole('status')).toBeNull();
  expect(double.mettreAJour).not.toHaveBeenCalled();
});
it('ferme le toast hors connexion après six secondes et nettoie son minuteur', () => {
  vi.useFakeTimers();
  double.horsLigne = true;
  const vue = render(<MiseAJour />);
  act(() => vi.advanceTimersByTime(5999));
  expect(screen.getByRole('status').classList.contains('fixed')).toBe(true);
  act(() => vi.advanceTimersByTime(1));
  expect(screen.queryByRole('status')).toBeNull();
  vue.unmount();
  const suivante = render(<MiseAJour />);
  expect(vi.getTimerCount()).toBe(1);
  suivante.unmount();
  expect(vi.getTimerCount()).toBe(0);
});
it('garde le toast de mise à jour jusqu’à une action', () => {
  vi.useFakeTimers();
  double.actualiser = true;
  double.horsLigne = true;
  render(<MiseAJour />);
  act(() => vi.advanceTimersByTime(10000));
  expect(screen.getByRole('button', { name: 'Recharger' })).toBeTruthy();
});

it('sauvegarde avant de demander le rechargement', () => {
  double.actualiser = true;
  const ordre: string[] = [];
  vi.spyOn(storeJeu.getState(), 'fermer').mockImplementation(() => { ordre.push('sauvegarde'); });
  double.mettreAJour.mockImplementation(() => { ordre.push('rechargement'); return Promise.resolve(); });
  render(<MiseAJour />);
  fireEvent.click(screen.getByRole('button', { name: 'Recharger' }));
  expect(ordre).toEqual(['sauvegarde', 'rechargement']);
  expect(double.mettreAJour).toHaveBeenCalledExactlyOnceWith(true);
});

it('annonce la disponibilité hors connexion avec un bouton secondaire masquable', () => {
  double.horsLigne = true;
  render(<MiseAJour />);
  expect(screen.getByText('Le jeu est prêt hors connexion.')).toBeTruthy();
  const bouton = screen.getByRole('button', { name: 'Fermer' });
  expect(bouton.className).not.toContain('bg-action');
  fireEvent.click(bouton);
  expect(screen.queryByRole('status')).toBeNull();
});
