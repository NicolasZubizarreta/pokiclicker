// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ModalDaran } from './ModalDaran';
import { fermerModalDaran, ouvrirModalDaran } from './etat-modal';

afterEach(() => { cleanup(); fermerModalDaran(); vi.restoreAllMocks(); });

it('ne rend rien sans résumé', () => {
  const { container } = render(<ModalDaran />);
  expect(container.childElementCount).toBe(0);
});

it('affiche le bilan, ferme et rend le focus', () => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value(this: HTMLDialogElement) { this.open = true; } },
    close: { configurable: true, value(this: HTMLDialogElement) { this.open = false; this.dispatchEvent(new Event('close')); } },
  });
  render(<><button>Déclencheur</button><ModalDaran /></>);
  const declencheur = screen.getByRole('button', { name: 'Déclencheur' });
  declencheur.focus();
  act(() => ouvrirModalDaran({ argent: Number.MAX_SAFE_INTEGER, jetons: 1200, objetsVides: 3, pokemonNiveauRamene: 151, pokemonCalciumRamene: 2, pokemonBonheurRamene: 1 }));
  expect(screen.getByRole('heading', { name: /Joyeux anniversaire Daran/ })).toBeTruthy();
  expect(screen.getAllByRole('listitem')).toHaveLength(6);
  expect(screen.getByText(`Pokédollars : ${Number.MAX_SAFE_INTEGER.toLocaleString('fr-FR')} ₽ → 0 ₽`, { exact: true, normalizer: texte => texte })).toBeTruthy();
  expect(screen.getByText(/151 Pokémon ramenés au niveau 100/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(declencheur);
});
