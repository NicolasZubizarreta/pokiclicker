// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { PagePlus } from './PagePlus';
import { storeJeu } from './store';
import { volumes } from './volumes';

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

it('règle le volume des effets et de la musique avec deux curseurs', () => {
  render(<PagePlus />);
  const effets = screen.getByRole('slider', { name: /effets/i }) as HTMLInputElement;
  const musique = screen.getByRole('slider', { name: /musique/i }) as HTMLInputElement;
  fireEvent.change(effets, { target: { value: '70' } });
  fireEvent.change(musique, { target: { value: '0' } });
  expect(volumes.lire('effets')).toBe(70);
  expect(volumes.lire('musique')).toBe(0);
  expect(screen.getByText('70 %')).toBeTruthy();
  expect(screen.getByText('0 %')).toBeTruthy();
});
