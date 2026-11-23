// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { SKINS } from '../../core/skins';
import type { ResumeCompte } from '../store';
import { BoutiqueSkins } from './BoutiqueSkins';

afterEach(cleanup);
const compte = (extra: Partial<ResumeCompte> = {}): ResumeCompte => ({ diamants: 50, succes: [], skins: [], skinsEquipes: {}, ...extra });

it('montre chaque skin du catalogue avec son prix, grise ceux qu\'on ne peut pas payer', () => {
  render(<BoutiqueSkins compte={compte()} actions={{ acheter: vi.fn(() => null), equiper: vi.fn(() => null) }} />);
  expect(screen.getAllByRole('listitem')).toHaveLength(SKINS.length);
  expect((screen.getByRole('button', { name: 'Acheter Contour or pour 40 diamants' }) as HTMLButtonElement).disabled).toBe(false);
  expect((screen.getByRole('button', { name: 'Acheter Éclat doré pour 80 diamants' }) as HTMLButtonElement).disabled).toBe(true);
});
it('achète, équipe et retire avec un message pour chaque action', () => {
  const acheter = vi.fn(() => null);
  const equiper = vi.fn(() => null);
  render(<BoutiqueSkins compte={compte({ skins: ['balle-glace', 'balle-or'], skinsEquipes: { 'cadre-balle': 'balle-or' } })} actions={{ acheter, equiper }} />);
  fireEvent.click(screen.getByRole('button', { name: 'Acheter Contour feuille pour 40 diamants' }));
  expect(acheter).toHaveBeenCalledWith('balle-feuille');
  expect(screen.getByRole('status').textContent).toBe('Contour feuille acheté.');
  fireEvent.click(screen.getByRole('button', { name: 'Équiper Contour glace' }));
  expect(equiper).toHaveBeenCalledWith('cadre-balle', 'balle-glace');
  fireEvent.click(screen.getByRole('button', { name: 'Retirer Contour or' }));
  expect(equiper).toHaveBeenCalledWith('cadre-balle', null);
});
it('affiche la raison du refus', () => {
  render(<BoutiqueSkins compte={compte()} actions={{ acheter: () => 'Il te manque 5 diamants.', equiper: vi.fn() }} />);
  fireEvent.click(screen.getByRole('button', { name: 'Acheter Contour or pour 40 diamants' }));
  expect(screen.getByRole('status').textContent).toBe('Il te manque 5 diamants.');
});
