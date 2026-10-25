// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { PagePlus } from './PagePlus';
import { storeJeu } from './store';

afterEach(cleanup);

it('affiche l’interrupteur Son et bascule la préférence', () => {
  const basculerSon = vi.fn(() => storeJeu.setState({ sonActive: !storeJeu.getState().sonActive }));
  storeJeu.setState({ sonActive: true, basculerSon });
  render(<PagePlus />);
  const interrupteur = screen.getByRole('switch', { name: /Son/ });
  expect(interrupteur.getAttribute('aria-checked')).toBe('true');
  fireEvent.click(interrupteur);
  expect(basculerSon).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('switch', { name: /Son/ }).getAttribute('aria-checked')).toBe('false');
});
