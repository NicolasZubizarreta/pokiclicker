// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { reglages } from '../core/reglages';
import { Notifications } from './Notifications';
import { notifier, viderNotifications } from './pileNotifications';
import { storeJeu } from './store';

beforeEach(() => vi.useFakeTimers());
afterEach(() => { cleanup(); viderNotifications(); storeJeu.setState({ annonce: null }); vi.useRealTimers(); });

const textes = (conteneur: HTMLElement) => [...conteneur.querySelectorAll('[data-notifications] [aria-live="polite"] p')].map(p => p.textContent);

it('pose le calque en haut de l’écran, hors de la mise en page, sans intercepter le toucher', () => {
  const { container } = render(<Notifications />);
  const calque = container.querySelector('[data-notifications]')!;
  expect(calque.classList.contains('fixed')).toBe(true);
  expect(calque.classList.contains('pointer-events-none')).toBe(true);
  expect(calque.classList.contains('inset-x-4')).toBe(true);
  expect(calque.querySelector('div[aria-live]')!.getAttribute('aria-live')).toBe('polite');
});

it('affiche l’annonce du store, puis la retire seule', () => {
  const { container } = render(<Notifications />);
  act(() => storeJeu.setState({ annonce: '2 Pokémon montent de niveau !' }));
  expect(textes(container)).toEqual(['2 Pokémon montent de niveau !']);
  act(() => vi.advanceTimersByTime(reglages.interface.annonceMs));
  expect(textes(container)).toEqual([]);
});

it('empile au plus trois messages : les plus anciens sortent', () => {
  const { container } = render(<Notifications />);
  act(() => { for (const n of ['un', 'deux', 'trois', 'quatre']) notifier(n); });
  expect(textes(container)).toEqual(['deux', 'trois', 'quatre']);
});

it('passe à la ligne au lieu de dépasser l’écran', () => {
  const { container } = render(<Notifications />);
  act(() => notifier('Pokéball ×10 acheté. 2 000 ₽ dépensés. Ceci est un message particulièrement long pour un petit écran.'));
  const message = container.querySelector('[data-notifications] [aria-live="polite"] p')!;
  expect(message.className).toContain('wrap-anywhere');
  expect(message.className).not.toContain('truncate');
  expect(message.className).not.toContain('whitespace-nowrap');
});
