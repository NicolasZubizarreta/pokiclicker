// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createStore } from 'zustand/vanilla';
import { FenetreEvolution } from './FenetreEvolution';
import { storeJeu } from './store';
import { proposerModal, type ModalEvolution } from './store-evolution';

const pokemon = { uid: 'a', numero: 1, niveau: 16, xp: 0, shiny: false, sexe: 'male' as const, bonheur: 0, calcium: 0,
  pierreEternelle: false, favori: false };
beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value(this: HTMLDialogElement) { this.setAttribute('open', ''); } },
    close: { configurable: true, value(this: HTMLDialogElement) { this.removeAttribute('open'); } },
  });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
function preparer(modal: ModalEvolution | null = proposerModal(pokemon, 2)) {
  const actions = { confirmerEvolution: vi.fn(), reporterEvolution: vi.fn(), fermerEvolution: vi.fn(), passerAnimationEvolution: vi.fn() };
  const store = createStore(() => ({ ...storeJeu.getState(), modalEvolution: modal, ...actions }));
  render(<FenetreEvolution store={store} />);
  return { store, ...actions };
}
const echap = () => act(() => { fireEvent(screen.getByRole('dialog', { hidden: true }), new Event('cancel', { cancelable: true })); });

it('ne montre rien sans évolution à proposer', () => {
  preparer(null);
  expect(screen.queryByRole('dialog', { hidden: true })).toBeNull();
});

it('propose Confirmer ou Plus tard, focus sur Confirmer', () => {
  const { confirmerEvolution, reporterEvolution } = preparer();
  expect(screen.getByRole('heading', { name: "Bulbizarre est sur le point d'évoluer" })).toBeTruthy();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Confirmer' }));
  expect(screen.getByAltText('Bulbizarre')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Confirmer' }));
  expect(confirmerEvolution).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Plus tard' }));
  expect(reporterEvolution).toHaveBeenCalledTimes(1);
});

it('Échap veut dire « Plus tard » à la proposition', () => {
  const { reporterEvolution, fermerEvolution } = preparer();
  echap();
  expect(reporterEvolution).toHaveBeenCalledTimes(1);
  expect(fermerEvolution).not.toHaveBeenCalled();
});

it('pendant l’animation, on peut la passer et Échap est ignoré', () => {
  const { passerAnimationEvolution, reporterEvolution, fermerEvolution } = preparer({ ...proposerModal(pokemon, 2), phase: 'animation' });
  expect(screen.getByRole('heading', { name: 'Bulbizarre évolue…' })).toBeTruthy();
  echap();
  expect(reporterEvolution).not.toHaveBeenCalled();
  expect(fermerEvolution).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: "Passer l'animation" }));
  expect(passerAnimationEvolution).toHaveBeenCalledTimes(1);
});

it('à la fin, affiche les félicitations et se ferme avec le bouton ou Échap', () => {
  const { fermerEvolution } = preparer({ ...proposerModal(pokemon, 2), phase: 'fin' });
  expect(screen.getByRole('heading', { name: 'Félicitations ! Ton « Bulbizarre » a évolué en « Herbizarre »' })).toBeTruthy();
  expect(screen.getByAltText('Herbizarre')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
  echap();
  expect(fermerEvolution).toHaveBeenCalledTimes(2);
});
