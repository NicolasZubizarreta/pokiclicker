// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { FenetreRadar } from './FenetreRadar';

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

const especes = ['Commun', 'Peu Commun', 'Rare', 'Très Rare', 'Légendaire'].map((rarete, i) => (
  { numero: i + 1, nom: `Espèce ${i + 1}`, rarete, vu: i !== 0 }
));

it('ouvre un dialogue nommé, montre les raretés V1 et la silhouette des espèces non vues', () => {
  const { container } = render(<FenetreRadar ouvert nomZone="Route 1" especes={especes}
    fermer={vi.fn()} declencheur={null} />);
  expect(screen.getByRole('dialog', { name: 'Route 1' }).tagName).toBe('DIALOG');
  expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledOnce();
  for (const [i, espece] of especes.entries()) {
    const image = screen.getByAltText(espece.nom);
    expect(image.getAttribute('src')).toBe(`img/sprites/pokemon/${espece.numero}.png`);
    expect(image.classList.contains('brightness-0')).toBe(!espece.vu);
    expect(screen.getByText(espece.rarete).classList.contains('bg-surface-2')).toBe(true);
    expect(image.closest('li')).toBe(screen.getAllByRole('listitem')[i]);
  }
  expect(screen.getByRole('list').classList.contains('grid-cols-3')).toBe(true);
  const bouton = screen.getByRole('button', { name: 'Fermer' });
  expect(bouton.classList.contains('min-h-11')).toBe(true);
  expect(bouton.classList.contains('min-w-11')).toBe(true);
  expect(container.querySelector('.bg-action')).toBeNull();
});

it.each(['bouton', 'Échap', 'extérieur', 'prop', 'natif'])('ferme et rend le focus au déclencheur (%s)', mode => {
  const fermer = vi.fn();
  const { rerender } = render(<button>Radar</button>);
  const declencheur = screen.getByRole<HTMLButtonElement>('button');
  const props = { ouvert: true, nomZone: 'Route 1', especes: [], fermer, declencheur };
  rerender(<><button>Radar</button><FenetreRadar {...props} /></>);
  const dialogue = screen.getByRole('dialog') as HTMLDialogElement;
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Fermer' }));
  fireEvent.pointerDown(screen.getByRole('heading'));
  expect(dialogue.open).toBe(true);
  if (mode === 'bouton') fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
  if (mode === 'Échap') expect(fireEvent(dialogue, new Event('cancel', { cancelable: true }))).toBe(false);
  if (mode === 'extérieur') fireEvent.pointerDown(dialogue);
  if (mode === 'prop') rerender(<><button>Radar</button><FenetreRadar {...props} ouvert={false} /></>);
  if (mode === 'natif') dialogue.close();
  expect(dialogue.open).toBe(false);
  expect(fermer).toHaveBeenCalledOnce();
  expect(document.activeElement).toBe(declencheur);
});

it('reste fermé initialement et peut être rouvert', () => {
  const props = { nomZone: 'Route 1', especes: [], fermer: vi.fn(), declencheur: null };
  const { rerender } = render(<FenetreRadar {...props} ouvert={false} />);
  expect(HTMLDialogElement.prototype.showModal).not.toHaveBeenCalled();
  rerender(<FenetreRadar {...props} ouvert />);
  fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
  rerender(<FenetreRadar {...props} ouvert={false} />);
  rerender(<FenetreRadar {...props} ouvert />);
  expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledTimes(2);
});
