// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { suiviVide } from '../core/suivi';
import { storeJeu } from './store';
import { HallDesFameux } from './HallDesFameux';
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
it('affiche le vide, une victoire datée et le retour', () => {
  const suivi = suiviVide(), retour = vi.fn();
  vi.spyOn(storeJeu, 'getState').mockReturnValue({ ...storeJeu.getState(), suivi });
  const vue = render(<HallDesFameux retour={retour} />);
  expect(screen.getByText("Aucune victoire à la Ligue pour l'instant.")).toBeTruthy();
  suivi.hall = [{ date: '2026-11-12T12:00:00', tempsJeuMs: 36_720_000, equipe: [{ numero: 1, niveau: 50, shiny: true }] }];
  vue.rerender(<HallDesFameux retour={retour} />);
  expect(screen.getByText('Victoire n° 1')).toBeTruthy();
  expect(screen.getByText(/12 novembre 2026/).parentElement?.textContent).toContain('10 h 12 min');
  expect(screen.getByText('Chromatique')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Retour au menu' }));
  expect(retour).toHaveBeenCalledOnce();
});
