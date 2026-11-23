// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { suiviVide } from '../core/suivi';
import { storeJeu } from './store';
import { ScoresCasino } from './ScoresCasino';
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
it('affiche le vide puis les scores et les totaux', () => {
  const suivi = suiviVide();
  vi.spyOn(storeJeu, 'getState').mockReturnValue({ ...storeJeu.getState(), suivi });
  const vue = render(<ScoresCasino />);
  expect(screen.getByText("Aucune partie jouée pour l'instant.")).toBeTruthy();
  suivi.casino.machine = { parties: 4, meilleurGain: 20, meilleureSerie: 2, serieActuelle: 1 };
  suivi.jetons = { gagnes: 30, perdus: 10, mises: 0 };
  vue.rerender(<ScoresCasino />);
  expect(screen.getByText('Machine à sous')).toBeTruthy();
  expect(screen.getByText('20')).toBeTruthy();
  expect(screen.getByText(/Jetons gagnés : 30/).textContent).toContain('Jetons perdus : 10');
});
