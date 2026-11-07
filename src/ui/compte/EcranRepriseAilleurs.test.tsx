// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { EcranRepriseAilleurs } from './EcranRepriseAilleurs';

afterEach(cleanup);
it('annonce la fermeture, focalise le titre et ouvre les parties', () => {
  const voir = vi.fn();
  render(<EcranRepriseAilleurs nom="Voyage" quandVoirParties={voir} />);
  expect(screen.getByRole('main').getAttribute('data-theme')).toBe('dark');
  expect(screen.getByRole('alert').textContent).toContain("« Voyage » vient d'être reprise sur un autre appareil. Elle est fermée ici.");
  expect(screen.getByText("Ta progression est sauvegardée : l'autre appareil repart exactement là où tu en étais. Il n'y a toujours qu'une seule sauvegarde.")).toBeTruthy();
  expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Partie reprise ailleurs' }));
  fireEvent.click(screen.getByRole('button', { name: 'Voir mes parties' }));
  expect(voir).toHaveBeenCalledTimes(1);
});
