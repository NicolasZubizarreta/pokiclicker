// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { BadgesTelephone } from './BadgesTelephone';

const badges = ['Roche', 'Cascade', 'Foudre', 'Prisme', 'Âme', 'Marais', 'Volcan', 'Terre'].map((nom, i) => ({
  id: String(i), nom, description: 'Dégâts Clic +50%', image: null,
  arene: "Arène d'Argenta", obtenu: false,
}));

beforeEach(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value: vi.fn(function (this: HTMLDialogElement) { this.open = true; }) },
    close: { configurable: true, value: vi.fn(function (this: HTMLDialogElement) { this.open = false; this.dispatchEvent(new Event('close')); }) },
  });
});
afterEach(cleanup);

it('affiche huit badges à gagner et le compteur vide', () => {
  render(<BadgesTelephone badges={badges} retour={vi.fn()} />);
  expect(screen.getByRole('status').textContent).toBe("Aucun badge obtenu. Bats les champions d'arène !");
  expect(screen.getByText('0 / 8')).toBeTruthy();
  expect(screen.getAllByRole('button', { name: /à gagner/ })).toHaveLength(8);
});

it('compte les badges obtenus et annonce leur effet', () => {
  render(<BadgesTelephone badges={badges.map((badge, i) => ({ ...badge, obtenu: i === 0 }))} retour={vi.fn()} />);
  expect(screen.getByText('1 / 8')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Badge Roche : Dégâts Clic +50%' })).toBeTruthy();
});

it('ouvre le détail et rend le focus après fermeture', () => {
  render(<BadgesTelephone badges={badges.slice(0, 3)} retour={vi.fn()} />);
  const carte = screen.getByRole('button', { name: /Badge Roche,/ });
  carte.focus();
  fireEvent.click(carte);
  const dialogue = screen.getByRole('dialog');
  expect(within(dialogue).getByText('Effet')).toBeTruthy();
  expect(within(dialogue).getByText('Arène')).toBeTruthy();
  expect(within(dialogue).getByText('Dégâts Clic +50%')).toBeTruthy();
  fireEvent.click(within(dialogue).getByRole('button', { name: 'Fermer le badge' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(carte);
});

it('revient au menu', () => {
  const retour = vi.fn();
  render(<BadgesTelephone badges={badges} retour={retour} />);
  fireEvent.click(screen.getByRole('button', { name: 'Retour au menu' }));
  expect(retour).toHaveBeenCalledOnce();
});

it('offre des cibles tactiles sur tous les boutons', () => {
  render(<BadgesTelephone badges={badges} retour={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: /Badge Roche,/ }));
  for (const bouton of screen.getAllByRole('button', { hidden: true })) {
    expect(bouton.classList.contains('min-h-11')).toBe(true);
    expect(bouton.classList.contains('min-w-11')).toBe(true);
  }
});
