// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ObtentionBadge } from './ObtentionBadge';

beforeEach(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value: vi.fn(function (this: HTMLDialogElement) {
      this.open = true;
      this.querySelector('button')?.focus();
    }) },
    close: { configurable: true, value: vi.fn(function (this: HTMLDialogElement) {
      this.open = false;
      this.dispatchEvent(new Event('close'));
    }) },
  });
});
afterEach(() => {
  cleanup();
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
});

const badges = [{ id: 'roche', nom: 'Roche', description: 'Dégâts Clic +50%',
  image: 'img/badges/roche.png', arene: "Arène d'Argenta", obtenu: true }];

it.each([
  [true, 'Survole ou touche un badge pour voir son effet.'],
  [false, "Aucun badge obtenu. Bats les champions d'arène !"],
] as const)('compare le texte complet de la boîte (badge obtenu : %s)', (obtenu, texte) => {
  render(<ObtentionBadge badges={badges.map(badge => ({ ...badge, obtenu }))} fermer={() => {}} ouvert />);
  expect(screen.getByRole('dialog', { name: 'Boîte à badges' }).textContent).toBe(`FermerBoîte à badges${texte}`);
  expect(screen.getByRole('status').textContent).toBe(texte);
});

it('ouvre le dialogue modal nommé et transmet les phases sans rogner le badge', () => {
  const props = { badges, fermer: vi.fn() };
  const { rerender } = render(<ObtentionBadge {...props} ouvert={false} />);
  expect(HTMLDialogElement.prototype.showModal).not.toHaveBeenCalled();
  rerender(<ObtentionBadge {...props} ouvert cache="roche" />);
  const dialogue = screen.getByRole('dialog', { name: 'Boîte à badges' });
  expect(dialogue.tagName).toBe('DIALOG');
  expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledOnce();
  expect(dialogue.classList.contains('overflow-visible')).toBe(true);
  const badge = screen.getByRole('button', { name: 'Badge Roche' });
  expect(badge.classList.contains('opacity-0')).toBe(true);
  rerender(<ObtentionBadge {...props} ouvert claque="roche" />);
  expect(badge.classList.contains('badge-slam')).toBe(true);
  expect(badge.classList.contains('overflow-visible')).toBe(true);
  expect(badge.parentElement?.classList.contains('overflow-visible')).toBe(true);
  expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledOnce();
  const fermer = screen.getByRole('button', { name: 'Fermer' });
  expect(fermer.classList.contains('min-h-11')).toBe(true);
  expect(fermer.classList.contains('min-w-11')).toBe(true);
  expect(dialogue.querySelector('.bg-action')).toBeNull();
});

it.each(['bouton', 'Échap', 'prop', 'natif'])('ferme et rend le focus au déclencheur (%s)', mode => {
  const fermer = vi.fn();
  const { rerender } = render(<button>Badges</button>);
  const declencheur = screen.getByRole('button');
  const props = { badges, fermer, declencheur };
  rerender(<><button>Badges</button><ObtentionBadge {...props} ouvert /></>);
  const dialogue = screen.getByRole<HTMLDialogElement>('dialog');
  if (mode === 'bouton') fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
  if (mode === 'Échap') expect(fireEvent(dialogue, new Event('cancel', { cancelable: true }))).toBe(false);
  if (mode === 'prop') rerender(<><button>Badges</button><ObtentionBadge {...props} ouvert={false} /></>);
  if (mode === 'natif') dialogue.close();
  expect(dialogue.open).toBe(false);
  expect(fermer).toHaveBeenCalledOnce();
  expect(document.activeElement).toBe(declencheur);
});

it('rend le focus au body sans déclencheur et peut rouvrir la boîte', () => {
  const props = { badges, fermer: vi.fn() };
  const { rerender } = render(<ObtentionBadge {...props} ouvert />);
  fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
  expect(document.activeElement).toBe(document.body);
  expect(document.body.hasAttribute('tabindex')).toBe(false);
  rerender(<ObtentionBadge {...props} ouvert={false} />);
  rerender(<ObtentionBadge {...props} ouvert />);
  expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledTimes(2);
});
