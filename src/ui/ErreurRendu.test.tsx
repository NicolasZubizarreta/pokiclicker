// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ErreurRendu } from './ErreurRendu';
import { construireCsp } from '../../csp';

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it('rend normalement les enfants', () => {
  render(<ErreurRendu><p>Partie</p></ErreurRendu>);
  expect(screen.getByText('Partie')).toBeTruthy();
  expect(screen.queryByRole('alert')).toBeNull();
});

it('affiche un secours et recharge après une erreur de rendu', () => {
  const erreur = new Error('Erreur technique');
  const journal = vi.spyOn(console, 'error').mockImplementation(() => {});
  const reload = vi.fn();
  vi.stubGlobal('window', { location: { reload } });
  function Enfant(): never { throw erreur; }
  render(<ErreurRendu><Enfant /></ErreurRendu>);
  expect(screen.getByRole('alert').textContent).toContain("Oups, l'affichage a planté.");
  expect(screen.getByText('Ta partie n’a pas été effacée. Recharge la page pour réessayer ; si l’écran replante, la sauvegarde est peut-être en cause.')).toBeTruthy();
  expect(screen.queryByText('Erreur technique')).toBeNull();
  expect(journal).toHaveBeenCalledWith(erreur);
  fireEvent.click(screen.getByRole('button', { name: 'Recharger la page' }));
  expect(reload).toHaveBeenCalledOnce();
});

it.each([
  [undefined, "connect-src 'self';"],
  ['invalide', "connect-src 'self';"],
  ['https://api.exemple.fr:8443/parties?test=1', "connect-src 'self' https://api.exemple.fr:8443;"],
])('construit la CSP avec une URL API %s', (api, connexion) => {
  const csp = construireCsp(api);
  expect(csp).toContain(connexion);
  expect(csp).toContain("script-src 'self';");
  expect(csp).toContain("worker-src 'self';");
  expect(csp).not.toContain('unsafe-eval');
});
