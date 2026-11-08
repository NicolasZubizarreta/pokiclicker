// @vitest-environment jsdom
import { cleanup, render, screen, fireEvent, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { PageEquipe } from './PageEquipe';
import { storeJeu } from './store';
import { reinitialiserSac, storeSac } from './sacContexte';

afterEach(() => { cleanup(); reinitialiserSac(); });
it('affiche six emplacements dans une grille PC de trois colonnes', () => {
  storeJeu.setState({ equipe: [], echange: null });
  const { container } = render(<PageEquipe />);
  expect(container.querySelectorAll('.equipe-pc')).toHaveLength(1);
  expect(screen.getByRole('list').className).toContain('grid-cols-3');
  expect(screen.getAllByText('Emplacement libre')).toHaveLength(6);
  expect(screen.getByLabelText("Trier l'équipe")).toBeTruthy();
});
it('ouvre le Sac global depuis la plaque', () => {
  storeJeu.setState({ sac: { ...storeJeu.getState().sac, acces: { ouvert: true, raison: null } } });
  render(<PageEquipe />);
  fireEvent.click(screen.getByRole('button', { name: 'Sac' }));
  expect(storeSac.getState().ouvert).toBe(true);
});

it('trie uniquement l’affichage et conserve les types et le cadre d’évolution', () => {
  const pokemon = { uid: 'a', numero: 1, niveau: 16, xp: 0, sexe: 'male' as const,
    shiny: false, favori: false, bonheur: 128, calcium: 0, pierreEternelle: false };
  const equipe = [{ pokemon, dps: 10, xpMax: 100, multiplicateur: 1, evolution: 2 },
    { pokemon: { ...pokemon, uid: 'b', numero: 4 }, dps: 50, xpMax: 100, multiplicateur: 1 }];
  storeJeu.setState({ equipe, echange: null, evolution: null });
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true,
    value(this: HTMLDialogElement) { this.setAttribute('open', ''); } });
  const { container } = render(<PageEquipe />);
  const carte = screen.getByRole('button', { name: 'Bulbizarre, niveau 16' });
  expect(carte.classList.contains('pret-evoluer')).toBe(true);
  expect(within(carte).getByText('Plante').className).toContain('pastille-type');
  expect(within(carte).getByText('Poison').className).toContain('pastille-type');
  expect(screen.getAllByText('Emplacement libre')).toHaveLength(4);
  fireEvent.change(screen.getByLabelText("Trier l'équipe"), { target: { value: 'dps' } });
  expect(container.querySelector('li button')?.getAttribute('data-uid')).toBe('b');
  expect(storeJeu.getState().equipe).toBe(equipe);
  fireEvent.change(screen.getByLabelText("Trier l'équipe"), { target: { value: 'ordre' } });
  expect(container.querySelector('li button')?.getAttribute('data-uid')).toBe('a');
  fireEvent.click(carte);
  expect(screen.getByRole('dialog', { name: 'Bulbizarre' })).toBeTruthy();
  expect(screen.getByRole('button', { name: /Faire évoluer Bulbizarre en Herbizarre/ })).toBeTruthy();
});
