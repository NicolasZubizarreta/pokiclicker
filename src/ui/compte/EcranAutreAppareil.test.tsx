// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { EcranAutreAppareil } from './EcranAutreAppareil';

afterEach(cleanup);
const partie = { nom: 'Voyage', regionId: 'kanto', zoneId: 'inconnue', ecritLe: '2026-11-04T12:00:00Z' };
it('explique la reprise et place le focus sur le titre', () => {
  const reprendre = vi.fn();
  const plusTard = vi.fn();
  render(<EcranAutreAppareil {...partie} occupe={false} erreur="" quandReprendre={reprendre} quandPlusTard={plusTard} />);
  expect(screen.getByText('Voyage')).toBeTruthy();
  expect(screen.getByRole('status').textContent).toContain(`inconnue (Kanto), sauvegardée le ${new Date(partie.ecritLe).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}`);
  expect(screen.getByRole('heading', { name: 'Si tu la reprends ici' })).toBeTruthy();
  expect(screen.getAllByRole('listitem').map(li => li.textContent)).toEqual([
    "Tu repars exactement là où la partie en était sur l'autre appareil : même zone, même étape, mêmes Pokémon.",
    "La partie se ferme sur l'autre appareil, qui affiche « Partie reprise ailleurs ».",
    "Il n'y a toujours qu'une seule sauvegarde : rien n'est copié, rien n'est à choisir.",
  ]);
  expect(screen.getByText(/Cette partie est ouverte sur un autre appareil/)).toBeTruthy();
  expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Partie ouverte ailleurs' }));
  fireEvent.click(screen.getByRole('button', { name: 'Reprendre ici' }));
  expect(reprendre).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Pas maintenant' }));
  expect(plusTard).toHaveBeenCalledTimes(1);
});
it('désactive le bouton occupé et affiche l’erreur', () => {
  const reprendre = vi.fn();
  render(<EcranAutreAppareil {...partie} occupe erreur="Connexion impossible. Réessaie." quandReprendre={reprendre} quandPlusTard={vi.fn()} />);
  const bouton = screen.getByRole('button', { name: 'Un instant…' });
  expect((bouton as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(bouton);
  expect(reprendre).not.toHaveBeenCalled();
  expect(screen.getByRole('alert').textContent).toBe('Connexion impossible. Réessaie.');
});
