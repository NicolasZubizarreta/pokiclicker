// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { FenetreRadar } from './FenetreRadar';
import { classesRarete } from './raretes';

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

const cles = ['commun', 'peu-commun', 'rare', 'tres-rare', 'legendaire'] as const;
const libelles = ['Commun', 'Peu Commun', 'Rare', 'Très Rare', 'Légendaire'];
const especes = cles.map((rarete, i) => (
  { numero: i + 1, nom: `Espèce ${i + 1}`, rarete, libelle: libelles[i]!, capture: i !== 0 }
));

it('montre le nom et la pokéball des espèces capturées, « ??? » et la silhouette des autres', () => {
  const { container } = render(<FenetreRadar ouvert nomZone="Route 1" especes={especes}
    fermer={vi.fn()} declencheur={null} />);
  const lignes = screen.getAllByRole('listitem');
  expect(screen.queryByText('Espèce 1')).toBeNull();
  expect(lignes[0]!.textContent).toContain('???');
  expect(lignes[0]!.querySelector('[aria-label="Déjà capturé"]')).toBeNull();
  expect(screen.getByAltText('Pokémon inconnu').classList.contains('brightness-0')).toBe(true);
  for (const [i, espece] of especes.entries()) {
    if (!espece.capture) continue;
    expect(lignes[i]!.textContent).toContain(espece.nom);
    expect(lignes[i]!.querySelector('[role="img"][aria-label="Déjà capturé"]')).toBeTruthy();
  }
  expect(container.querySelectorAll('[aria-label="Déjà capturé"]')).toHaveLength(4);
  expect(container.querySelector('[title]')).toBeNull();
});

it('ouvre un dialogue nommé, avec une couleur et un libellé par rareté', () => {
  const { container } = render(<FenetreRadar ouvert nomZone="Route 1" especes={especes}
    fermer={vi.fn()} declencheur={null} />);
  expect(screen.getByRole('dialog', { name: 'Route 1' }).tagName).toBe('DIALOG');
  expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledOnce();
  const classes = new Set<string>();
  for (const [i, espece] of especes.entries()) {
    const etiquette = screen.getByText(espece.libelle);
    expect(etiquette.className).toContain(classesRarete[espece.rarete]);
    classes.add(classesRarete[espece.rarete]);
    expect(etiquette.closest('li')).toBe(screen.getAllByRole('listitem')[i]);
    expect(etiquette.closest('li')!.querySelector('img')!.getAttribute('src')).toBe(`img/sprites/pokemon/${espece.numero}.png`);
  }
  expect(classes.size).toBe(5);
  expect(screen.getByRole('list').classList.contains('grid-cols-3')).toBe(true);
  const bouton = screen.getByRole('button', { name: 'Fermer' });
  expect(bouton.classList.contains('min-h-11')).toBe(true);
  expect(bouton.classList.contains('min-w-11')).toBe(true);
  expect(container.querySelector('.bg-action')).toBeNull();
});

it.each(['bouton','Échap', 'extérieur', 'prop', 'natif'])('ferme et rend le focus au déclencheur (%s)', mode => {
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
