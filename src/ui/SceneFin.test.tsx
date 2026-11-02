// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { Commande } from '../core/evenements';
import { SceneFin } from './SceneFin';

type Dialogue = Extract<Commande, { type: 'dialogue' }>;
const scene = { zone: 'kanto.labo', pose: 'chen-1', entree: 'montee', entreeMs: 2000, boiteMs: 2000, glitchMs: 2000 } as const;
const replique = (etape = 0, options: Partial<Dialogue> = {}): Dialogue =>
  ({ type: 'dialogue', locuteur: 'Chen', texte: 'Incroyable.', evenement: 'kanto.fin-pokedex', etape, scene, ...options });
const reduire = (matches: boolean) => vi.stubGlobal('matchMedia', () => ({ matches }));

beforeEach(() => {
  vi.useFakeTimers();
  reduire(false);
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value(this: HTMLDialogElement) { this.open = true; } },
    close: { configurable: true, value(this: HTMLDialogElement) { this.open = false; } },
  });
});
afterEach(() => {
  cleanup();
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
  vi.useRealTimers(); vi.unstubAllGlobals();
});

const decor = (conteneur: HTMLElement) => conteneur.querySelector('.scene-fin-decor')!;
const chen = (conteneur: HTMLElement) => conteneur.querySelector('.scene-fin-chen');

it('ouvre sur le glitch avec le vrai décor du labo, sans Chen ni boîte de dialogue', () => {
  const { container } = render(<SceneFin commande={replique()} terminerEtape={vi.fn()} />);
  expect(screen.getByRole('dialog', { name: 'Dialogue de scène' }).hasAttribute('open')).toBe(true);
  expect(decor(container).getAttribute('src')).toBe('img/scenes/labo.webp');
  expect(container.querySelector('.scene-fin-glitch')).not.toBeNull();
  expect(chen(container)).toBeNull();
  expect(screen.queryByRole('button')).toBeNull();
});

it('fait monter Chen après le glitch puis ouvre la boîte de dialogue lettre par lettre', () => {
  const { container } = render(<SceneFin commande={replique()} terminerEtape={vi.fn()} />);
  act(() => { vi.advanceTimersByTime(scene.glitchMs); });
  expect(container.querySelector('.scene-fin-glitch')).toBeNull();
  expect(chen(container)?.getAttribute('src')).toBe('img/sprites/chen/chen-1.png');
  expect(chen(container)?.className).toContain('scene-fin-chen-montee');
  expect(screen.queryByRole('button')).toBeNull();
  act(() => { vi.advanceTimersByTime(scene.boiteMs); });
  const boite = screen.getByRole('button');
  expect(boite.textContent).not.toContain('Incroyable');
  act(() => { vi.advanceTimersByTime(30); });
  expect(boite.textContent).toContain('I');
  fireEvent.click(boite);
  expect(boite.textContent).toContain('Incroyable.');
});

it('passe directement à la parole sans glitch quand la scène n’en a pas (victoire du défi)', () => {
  const { container } = render(<SceneFin commande={replique(0, { scene: { ...scene, pose: 'chen-2', entree: 'fondu',
    entreeMs: 1200, boiteMs: 900, glitchMs: undefined } })} terminerEtape={vi.fn()} />);
  expect(container.querySelector('.scene-fin-glitch')).toBeNull();
  expect(chen(container)?.className).toContain('scene-fin-chen-fondu');
  act(() => { vi.advanceTimersByTime(900); });
  expect(screen.getByRole('button')).toBeTruthy();
});

it('montre le diplôme sur sa réplique, puis le fait s’envoler, puis le Charme Chroma avec son annonce', () => {
  const termine = vi.fn();
  const { container, rerender } = render(<SceneFin commande={replique(4)} terminerEtape={termine} />);
  act(() => { vi.advanceTimersByTime(scene.glitchMs); });
  act(() => { vi.advanceTimersByTime(scene.boiteMs); });
  expect(container.querySelector('[data-vitrine]')).toBeNull();
  rerender(<SceneFin commande={replique(5, { vitrine: { image: 'img/fin/diplome.webp', animation: 'entree' } })} terminerEtape={termine} />);
  expect(container.querySelector('[data-vitrine="entree"]')?.getAttribute('src')).toBe('img/fin/diplome.webp');
  rerender(<SceneFin commande={replique(6, { vitrine: { image: 'img/fin/diplome.webp', animation: 'envol' } })} terminerEtape={termine} />);
  expect(container.querySelector('[data-vitrine="envol"]')).not.toBeNull();
  rerender(<SceneFin commande={replique(7, { vitrine: { image: 'img/fin/charme-chroma.webp', animation: 'zoom',
    annonce: 'CHARME CHROMA OBTENU !' } })} terminerEtape={termine} />);
  expect(container.querySelector('[data-vitrine="zoom"]')?.getAttribute('src')).toBe('img/fin/charme-chroma.webp');
  expect(screen.getByRole('status').textContent).toBe('CHARME CHROMA OBTENU !');
  rerender(<SceneFin commande={replique(8, { vitrine: { image: 'img/fin/charme-chroma.webp', animation: 'envol' } })} terminerEtape={termine} />);
  expect(screen.queryByRole('status')).toBeNull();
  // La scène reste montée d’une réplique à l’autre : Chen n’est pas rejoué.
  expect(chen(container)).not.toBeNull();
});

it('affiche tout de suite Chen et la boîte en mouvement réduit, sans glitch', () => {
  reduire(true);
  const termine = vi.fn();
  const { container } = render(<SceneFin commande={replique()} terminerEtape={termine} />);
  expect(container.querySelector('.scene-fin-glitch')).toBeNull();
  expect(chen(container)).not.toBeNull();
  expect(screen.getByRole('button').textContent).toContain('Incroyable.');
  fireEvent.click(screen.getByRole('button'));
  expect(termine).toHaveBeenCalledOnce();
});

it('ne se ferme pas avec Échap', () => {
  render(<SceneFin commande={replique()} terminerEtape={vi.fn()} />);
  const dialogue = screen.getByRole('dialog');
  expect(fireEvent(dialogue, new Event('cancel', { cancelable: true }))).toBe(false);
  expect(dialogue.hasAttribute('open')).toBe(true);
});
