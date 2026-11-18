// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ObjectifPermanent } from './ObjectifPermanent';
import { createStore } from 'zustand/vanilla';
import { storeJeu } from './store';

beforeEach(() => {
  vi.useFakeTimers();
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new Event('close')); };
});
afterEach(() => { cleanup(); vi.useRealTimers(); });
function preparer(aller?: (page: 'Shop') => void) {
  const store = createStore(() => storeJeu.getState());
  const e = { zone: { nom: 'Arène', type: 'arene', etapes: 10, boss: { nom: 'Pierre (Onix)' } }, zoneSuivante: { nom: 'Route 2', ouverte: false },
    progression: { pokedex: { nombre: 3, total: 151 }, prochain: { palier: 10, restantes: 7 }, paliers: [{ palier: 10, titre: 'Palier', description: 'Dégâts Clic x2', recu: false }] } };
  store.setState({ zone: { ...store.getState().zone!, ...e.zone } as NonNullable<ReturnType<typeof store.getState>['zone']>, zoneSuivante: { id: 'suite', raison: null, ...e.zoneSuivante! },
    progression: { ...store.getState().progression, ...e.progression }, boutique: { acces: { ouvert: true, raison: null }, objets: [] } });
  render(<ObjectifPermanent store={store} aller={aller as (page: import('./Navigation').Page) => void} />);
  return store;
}
it('affiche le boss, alterne à huit secondes et retire un objectif terminé', () => {
  const store = preparer(); expect(screen.getByRole('button', { name: /Objectifs : Boss : Pierre/ })).toBeTruthy();
  act(() => vi.advanceTimersByTime(8000)); expect(screen.getByRole('button', { name: /Objectifs : Pokédex/ })).toBeTruthy();
  act(() => vi.advanceTimersByTime(8000)); expect(screen.getByRole('button', { name: /Objectifs : Boss/ })).toBeTruthy();
  act(() => store.setState({ progression: { ...store.getState().progression, prochain: null } }));
  act(() => vi.advanceTimersByTime(8000)); expect(screen.getByRole('button', { name: /Objectifs : Boss/ })).toBeTruthy();
});
it('ouvre les états, navigue vers le Shop et ferme avec la croix', () => {
  const aller = vi.fn(); preparer(aller);
  fireEvent.click(screen.getByRole('button', { name: /Objectifs :/ }));
  const dialogue = screen.getByRole('dialog'); expect(dialogue.hasAttribute('open')).toBe(true);
  expect(screen.getAllByText('À faire').length).toBeGreaterThan(0);
  fireEvent.click(screen.getAllByRole('button', { name: 'Y aller' })[0]!);
  expect(aller).toHaveBeenCalledWith('Shop'); expect(dialogue.hasAttribute('open')).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: /Objectifs :/ })); fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
  expect(dialogue.hasAttribute('open')).toBe(false);
});
it('montre les objectifs faits et masque la navigation sans aller', () => {
  const store = preparer();
  act(() => store.setState({ progression: { ...store.getState().progression, prochain: null } }));
  fireEvent.click(screen.getByRole('button', { name: /Objectifs :/ }));
  expect(screen.getByText('Fait')).toBeTruthy(); expect(screen.queryByRole('button', { name: 'Y aller' })).toBeNull();
});
