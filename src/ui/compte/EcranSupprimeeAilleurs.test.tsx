// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { EcranSupprimeeAilleurs } from './EcranSupprimeeAilleurs';
const affichage = vi.hoisted(() => ({ telephone: false }));
vi.mock('../useTelephone', () => ({ useTelephone: () => affichage.telephone }));
afterEach(() => { affichage.telephone = false; });

it.each([false, true])('barre de confirmation réservée au PC (téléphone : %s)', telephone => {
  affichage.telephone = telephone;
  const { container } = render(<EcranSupprimeeAilleurs {...props()} />);
  const bouton = screen.getByRole('button', { name: "L'abandonner" });
  fireEvent.click(bouton);
  expect(container.querySelectorAll('.fenetre-titre')).toHaveLength(telephone ? 0 : 1);
  expect(screen.queryByRole('button', { name: 'Fermer' }) !== null).toBe(!telephone);
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(bouton);
});

afterEach(cleanup);
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});
const props = () => ({ nom: 'Voyage', regionId: 'kanto', zoneId: 'inconnue', ecritLe: '2026-11-04T12:00:00Z', tempsJeuMs: 24_480_000, occupe: false, erreur: '', quandGarder: vi.fn(), quandAbandonner: vi.fn() });
it('présente la copie locale et exige une confirmation avant de l’abandonner', () => {
  const p = props();
  render(<EcranSupprimeeAilleurs {...p} />);
  expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Partie supprimée ailleurs' }));
  expect(screen.getByRole('alert').textContent).toContain("Cette partie a été supprimée sur un autre appareil. Tu peux la garder ou l'abandonner.");
  expect(screen.getByText('Sur cet appareil')).toBeTruthy();
  expect(screen.getByText('Kanto · inconnue')).toBeTruthy();
  expect(screen.getByText('6 h 48')).toBeTruthy();
  expect(screen.getByText(new Date(p.ecritLe).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' }))).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'La garder' }));
  expect(p.quandGarder).toHaveBeenCalledTimes(1);
  const abandonner = screen.getByRole('button', { name: "L'abandonner" });
  fireEvent.click(abandonner);
  expect(p.quandAbandonner).not.toHaveBeenCalled();
  const dialogue = screen.getByRole('dialog', { name: 'Abandonner « Voyage » ?' });
  expect(dialogue.hasAttribute('open')).toBe(true);
  expect(document.activeElement).toBe(within(dialogue).getByRole('heading'));
  expect(abandonner.closest('[inert]')).toBeTruthy();
  expect(within(dialogue).getByText('Sa progression sera perdue pour de bon. Tes diamants, tes succès et tes skins restent sur ton compte.')).toBeTruthy();
  fireEvent.click(within(dialogue).getByRole('button', { name: 'Annuler' }));
  expect(document.activeElement).toBe(abandonner);
  expect(abandonner.closest('[inert]')).toBeNull();
  fireEvent.click(abandonner);
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.click(abandonner);
  fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.click(abandonner);
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: "L'abandonner" }));
  expect(p.quandAbandonner).toHaveBeenCalledTimes(1);
});
it('présente les erreurs, le temps indisponible et bloque les actions occupées', () => {
  const p = props();
  const { rerender } = render(<EcranSupprimeeAilleurs {...p} />);
  fireEvent.click(screen.getByRole('button', { name: "L'abandonner" }));
  rerender(<EcranSupprimeeAilleurs {...p} occupe erreur="Échec" tempsJeuMs={null} />);
  expect(screen.getByText('Non disponible')).toBeTruthy();
  expect(screen.getAllByRole('alert').some(a => a.textContent === 'Échec')).toBe(true);
  expect(screen.getAllByRole('button').every(b => (b as HTMLButtonElement).disabled)).toBe(true);
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: "L'abandonner" }));
  expect(p.quandAbandonner).not.toHaveBeenCalled();
});
