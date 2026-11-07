// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { BandeauHaut } from './BandeauHaut';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it('affiche les chiffres, la synchro et ouvre les raccourcis sur PC', () => {
  const ouvrir = vi.fn();
  render(<BandeauHaut etatSynchro="ok" ouvrirRaccourcis={ouvrir} />);
  const bandeau = within(screen.getByRole('banner', { name: 'Chiffres clés' }));
  for (const nom of ['Pokédollars', 'DPS', 'Zone', 'À jour']) expect(bandeau.getByText(nom)).toBeTruthy();
  fireEvent.click(bandeau.getByRole('button', { name: 'Raccourcis ?' }));
  expect(ouvrir).toHaveBeenCalledTimes(1);
});
it('conserve le bandeau téléphone sans bouton de raccourcis', () => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  render(<BandeauHaut />);
  expect(screen.getByRole('banner').classList.contains('lg:hidden')).toBe(true);
  expect(screen.queryByRole('button', { name: 'Raccourcis ?' })).toBeNull();
});
