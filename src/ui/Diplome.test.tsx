// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { Diplome } from './Diplome';

const diplome = { nom: 'Nicolas', date: '2026-10-25T23:30:00.000Z' };
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
  return <><button onClick={() => ouvrir(true)}>Voir</button>
    {ouvert && <Diplome diplome={diplome} fermer={() => ouvrir(false)} />}</>;
}

it('affiche le nom, la date française UTC et le diplôme du Pokédex complet', () => {
  render(<Diplome diplome={diplome} fermer={vi.fn()} />);
  const fenetre = screen.getByRole('dialog', { name: 'Diplôme du Pokédex' });
  expect(screen.getByText('Nicolas')).toBeTruthy();
  expect(screen.getByText('25 octobre 2026').getAttribute('datetime')).toBe(diplome.date);
  expect(fenetre.textContent).toContain('(UTC)');
  expect(fenetre.textContent).not.toMatch(/fin du jeu|maître|crédits/i);
  const image = screen.getByRole('img', { name: /complété le Pokédex/ });
  expect(image.getAttribute('src')).toBe(`${import.meta.env.BASE_URL}img/fin/diplome.webp`);
  expect(image.getAttribute('width')).toBe('1280');
  expect(image.getAttribute('height')).toBe('698');
});

it.each(['bouton', 'Échap'])('ferme par %s et rend le focus à Voir', async mode => {
  render(<Exemple />);
  const origine = screen.getByRole('button', { name: 'Voir' });
  await userEvent.click(origine);
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Fermer' }));
  if (mode === 'bouton') await userEvent.click(screen.getByRole('button', { name: 'Fermer' }));
  // Le navigateur traduit Échap en événement cancel sur un dialogue modal.
  else fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(origine);
});

it('boucle le focus dans les deux sens et déclenche l’impression', async () => {
  render(<Diplome diplome={diplome} fermer={vi.fn()} />);
  const utilisateur = userEvent.setup();
  const fermer = screen.getByRole('button', { name: 'Fermer' });
  const imprimer = screen.getByRole('button', { name: 'Imprimer' });
  await utilisateur.tab({ shift: true });
  expect(document.activeElement).toBe(imprimer);
  await utilisateur.tab();
  expect(document.activeElement).toBe(fermer);
  await utilisateur.tab();
  expect(document.activeElement).toBe(imprimer);
  const impression = vi.spyOn(window, 'print').mockImplementation(() => {});
  await utilisateur.keyboard('{Enter}');
  expect(impression).toHaveBeenCalledOnce();
});
