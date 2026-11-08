// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { CarteKanto } from './CarteKanto';
import { storeJeu } from './store';

beforeEach(() => { storeJeu.getState().demarrer(); });
afterEach(() => { cleanup(); storeJeu.getState().arreter(); });
it('présente la liste PC, le repère clignotant et le dresseur uniquement pendant le vol', () => {
  const carte = storeJeu.getState().carte;
  storeJeu.setState({ carte: { ...carte, formes: carte.formes.map(f => ({ ...f, ouverte: true, actuelle: f.nom === 'Bourg Palette' })) } });
  const { container } = render(<CarteKanto quandArrive={vi.fn()} />);
  expect(container.querySelectorAll('.carte-pc')).toHaveLength(1);
  expect(container.querySelector('[data-actuelle].carte-pc-clignotement')).toBeTruthy();
  expect(container.querySelector('[data-dresseur]')).toBeNull();
  fireEvent.click(within(screen.getByRole('list', { name: 'Zones de Kanto' })).getByRole('button', { name: 'Route 1 (Zone 1)' }));
  expect(screen.getByRole('status').textContent).toContain('Vol en cours');
  expect(container.querySelector('[data-dresseur]')).toBeTruthy();
});
it('fixe la bordure verte et désactive le clignotement si le mouvement est réduit', () => {
  const css = readFileSync('src/ui/CartePC.css', 'utf8');
  expect(css).toMatch(/prefers-reduced-motion: reduce/);
  expect(css).toMatch(/animation: none/);
  expect(css).toMatch(/stroke: var\(--succes-base\)/);
});
