// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { EcranChoixVersion } from './EcranChoixVersion';
import { kanto } from '../../core/regions';

afterEach(cleanup);
it('propose de garder ou abandonner une partie supprimée ailleurs', () => {
  const resume = { regionId: 'kanto', zoneId: '', ecritLe: '', tempsJeuMs: null };
  const quandChoisir = vi.fn();
  render(<EcranChoixVersion choix={{ local: resume, supprimee: 'test' }} occupe={false} erreur="" quandChoisir={quandChoisir} />);
  expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Partie supprimée ailleurs' }));
  fireEvent.click(screen.getByRole('button', { name: 'La garder' }));
  fireEvent.click(screen.getByRole('button', { name: "L'abandonner" }));
  expect(quandChoisir.mock.calls).toEqual([['local'], ['serveur']]);
});
it('affiche les résumés, le focus, les choix et leur état occupé', () => {
  const local = { regionId: 'kanto', zoneId: 'zone-inconnue', ecritLe: '2026-11-04T12:00:00Z', tempsJeuMs: 43_500_000 };
  const choix = { local, serveur: { ...local, tempsJeuMs: null } };
  const quandChoisir = vi.fn();
  const { rerender } = render(<EcranChoixVersion choix={choix} occupe={false} erreur="" quandChoisir={quandChoisir} />);
  expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Deux versions de ta partie' }));
  expect(screen.getAllByText('Kanto')).toHaveLength(2);
  expect(screen.getAllByText('zone-inconnue')).toHaveLength(2);
  expect(screen.getAllByText(new Date(local.ecritLe).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' }))).toHaveLength(2);
  expect(screen.getByText('12 h 05')).toBeTruthy();
  expect(screen.getByText('Non disponible')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Garder cet appareil' }));
  fireEvent.click(screen.getByRole('button', { name: "Récupérer l'autre version" }));
  expect(quandChoisir.mock.calls).toEqual([['local'], ['serveur']]);
  rerender(<EcranChoixVersion choix={choix} occupe erreur="Connexion impossible" quandChoisir={quandChoisir} />);
  expect(screen.getAllByRole('button', { name: 'Un instant…' }).every(b => (b as HTMLButtonElement).disabled)).toBe(true);
  expect(screen.getByRole('alert').textContent).toBe('Connexion impossible');
  rerender(<EcranChoixVersion choix={{ ...choix, local: { ...local, zoneId: kanto.premierCombat, tempsJeuMs: 2_700_000 } }} occupe={false} erreur="" quandChoisir={quandChoisir} />);
  expect(screen.getByText(kanto.zone(kanto.premierCombat).nom)).toBeTruthy();
  expect(screen.getByText('45 min')).toBeTruthy();
});
