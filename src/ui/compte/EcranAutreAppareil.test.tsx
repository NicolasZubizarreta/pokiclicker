// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { EcranAutreAppareil } from './EcranAutreAppareil';

afterEach(cleanup);
it('explique la reprise et place le focus sur le titre', () => {
  const reprendre = vi.fn();
  render(<EcranAutreAppareil occupe={false} erreur="" quandReprendre={reprendre} />);
  expect(screen.getByText(/Cette partie est ouverte sur un autre appareil/)).toBeTruthy();
  expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Partie ouverte ailleurs' }));
  fireEvent.click(screen.getByRole('button', { name: 'Reprendre ici' }));
  expect(reprendre).toHaveBeenCalledTimes(1);
});
it('désactive le bouton occupé et affiche l’erreur', () => {
  const reprendre = vi.fn();
  render(<EcranAutreAppareil occupe erreur="Connexion impossible. Réessaie." quandReprendre={reprendre} />);
  const bouton = screen.getByRole('button', { name: 'Un instant…' });
  expect((bouton as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(bouton);
  expect(reprendre).not.toHaveBeenCalled();
  expect(screen.getByRole('alert').textContent).toBe('Connexion impossible. Réessaie.');
});
