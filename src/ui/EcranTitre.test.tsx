// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { EcranTitre } from './EcranTitre';

afterEach(cleanup);

it('présente le titre V1 animé et une seule action accessible', () => {
  const { container } = render(<EcranTitre quandJouer={vi.fn()} />);
  const titre = screen.getByRole('heading', { level: 1, name: 'POKÉ CLICKER' });
  expect(titre.parentElement?.classList.contains('motion-safe:animate-bounce')).toBe(true);
  expect(titre.parentElement?.contains(screen.getByText('KANTO ORIGINS'))).toBe(true);
  const jouer = screen.getByRole('button', { name: 'JOUER' });
  expect(screen.getAllByRole('button')).toHaveLength(1);
  expect(jouer.classList.contains('min-h-11')).toBe(true);
  expect(jouer.classList.contains('min-w-11')).toBe(true);
  expect(container.querySelectorAll('.bg-action')).toHaveLength(1);
  expect(screen.getByRole('status').textContent).toBe('');
});

it('appelle quandJouer une seule fois au toucher ou au clic', async () => {
  const quandJouer = vi.fn();
  render(<EcranTitre quandJouer={quandJouer} />);
  await userEvent.click(screen.getByRole('button', { name: 'JOUER' }));
  expect(quandJouer).toHaveBeenCalledTimes(1);
});

it('permet de jouer au clavier avec Entrée et Espace', async () => {
  const user = userEvent.setup();
  const quandJouer = vi.fn();
  render(<EcranTitre quandJouer={quandJouer} />);
  await user.tab();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'JOUER' }));
  await user.keyboard('{Enter}');
  expect(quandJouer).toHaveBeenCalledTimes(1);
  await user.keyboard(' ');
  expect(quandJouer).toHaveBeenCalledTimes(2);
});
