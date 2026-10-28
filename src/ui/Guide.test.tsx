// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { guide } from '../core/guide';
import { Guide } from './Guide';

beforeEach(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value(this: HTMLDialogElement) { this.open = true; } },
    close: { configurable: true, value(this: HTMLDialogElement) { this.open = false; } },
  });
});
afterEach(() => {
  cleanup();
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
  vi.restoreAllMocks();
});

function Exemple() {
  const [ouvert, ouvrir] = useState(false);
  return <><button onClick={() => ouvrir(true)}>Guide du jeu</button>
    {ouvert && <Guide fermer={() => ouvrir(false)} />}</>;
}

it('montre les 11 sections du guide dans l\'ordre, chacune repliable, avec le texte lu dans les données', () => {
  render(<Guide fermer={vi.fn()} />);
  const fenetre = screen.getByRole('dialog', { name: 'Guide du jeu' });
  const sections = fenetre.querySelectorAll('details');
  expect(sections).toHaveLength(11);
  expect([...sections].map(section => section.querySelector('summary')!.textContent)).toEqual(guide.sections.map(s => s.titre));
  expect(sections[0]!.open).toBe(true);
  expect(sections[1]!.open).toBe(false);
  expect(within(fenetre).getByText(/Tu as 30 secondes pour tuer le boss/)).toBeTruthy();
  expect(within(fenetre).getByText(/Auto-clique \(Restes\): débloqué en zone 14/)).toBeTruthy();
  expect(fenetre.textContent).not.toMatch(/[{}]/);
});

it('a une croix de 44 px, défile dans son contenu et se ferme par la croix', async () => {
  render(<Exemple />);
  const origine = screen.getByRole('button', { name: 'Guide du jeu' });
  await userEvent.click(origine);
  const croix = screen.getByRole('button', { name: 'Fermer le guide' });
  expect(croix.className).toContain('min-h-11');
  expect(croix.className).toContain('min-w-11');
  expect(document.activeElement).toBe(croix);
  expect(document.querySelector('[data-guide-contenu]')!.className).toContain('fiche-contenu');
  await userEvent.click(croix);
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(origine);
});

it('se ferme avec Échap et rend le focus au bouton d\'ouverture', async () => {
  render(<Exemple />);
  const origine = screen.getByRole('button', { name: 'Guide du jeu' });
  await userEvent.click(origine);
  // Le navigateur traduit Échap en événement cancel sur un dialogue modal.
  fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(origine);
});
