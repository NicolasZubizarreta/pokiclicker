// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { Credits } from './Credits';
import { planCredits } from '../core/credits';

const annuler = vi.fn();
const animer = vi.fn(() => ({ cancel: annuler }));
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value() { this.open = true; } },
    close: { configurable: true, value() { this.open = false; } },
  });
  Object.defineProperty(HTMLElement.prototype, 'animate', { configurable: true, value: animer });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
  Reflect.deleteProperty(HTMLElement.prototype, 'animate');
});

it('défile puis passe aux pages avec le même laboratoire et navigue dans les sections', () => {
  const { container } = render(<Credits fermerCredits={vi.fn()} />);
  expect(screen.getByRole('dialog', { name: planCredits(false).titre })).toBeTruthy();
  expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true);
  expect(animer).toHaveBeenCalledWith(expect.any(Array), expect.objectContaining({ duration: planCredits(false).temps.dureeMs }));
  const decor = container.querySelector('img')!;
  expect(decor.getAttribute('src')).toBe('img/scenes/labo.webp');
  fireEvent.click(screen.getByRole('button', { name: 'Lire par pages' }));
  expect(container.querySelector('img')).toBe(decor);
  expect(annuler).toHaveBeenCalledOnce();
  // JSDOM programme selectionchange à délai nul lors du focus.
  act(() => vi.advanceTimersByTime(0));
  expect(vi.getTimerCount()).toBe(0);
  expect((screen.getByRole('button', { name: 'Précédent' }) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByText('Page 1 / 6')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Suivant' }));
  expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(planCredits(true).pages[1]!.section.titre);
  fireEvent.click(screen.getByRole('button', { name: 'Précédent' }));
  expect(screen.getByText('Page 1 / 6')).toBeTruthy();
});

it('Passer et Échap appellent fermerCredits', () => {
  const fermerCredits = vi.fn();
  render(<Credits fermerCredits={fermerCredits} />);
  fireEvent.click(screen.getByRole('button', { name: 'Passer' }));
  fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
  expect(fermerCredits).toHaveBeenCalledTimes(2);
});

it('démarre en pages avec mouvement réduit et termine sur Retour à Kanto', () => {
  vi.mocked(window.matchMedia).mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as MediaQueryList);
  const fermerCredits = vi.fn();
  render(<Credits fermerCredits={fermerCredits} />);
  expect(screen.queryByRole('button', { name: 'Lire par pages' })).toBeNull();
  expect(animer).not.toHaveBeenCalled();
  for (let i = 1; i < planCredits(true).pages.length; i++) fireEvent.click(screen.getByRole('button', { name: 'Suivant' }));
  fireEvent.click(screen.getByRole('button', { name: 'Terminer' }));
  expect(screen.getByRole('heading', { name: 'Retour à Kanto' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Retour à Kanto' }));
  expect(fermerCredits).toHaveBeenCalledOnce();
});

it('termine le défilement et nettoie ses minuteurs', () => {
  render(<Credits fermerCredits={vi.fn()} alea={() => 0.5} />);
  const { temps } = planCredits(false);
  act(() => vi.advanceTimersByTime(temps.delaiMs + temps.dureeMs + temps.finMs));
  expect(screen.getByRole('heading', { name: 'Retour à Kanto' })).toBeTruthy();
  expect(vi.getTimerCount()).toBe(0);
});

it('retire les images flottantes et leurs minuteurs au démontage et restitue le focus', () => {
  const avant = document.createElement('button');
  document.body.append(avant);
  avant.focus();
  const { container, unmount } = render(<Credits fermerCredits={vi.fn()} alea={() => 0.5} />);
  act(() => vi.advanceTimersByTime(planCredits(false).imagesFlottantes!.intervalleMs));
  expect(container.querySelector('.credits-flottant')?.getAttribute('src')).toBe('img/sprites/pokemon/4.png');
  unmount();
  act(() => vi.advanceTimersByTime(0));
  expect(vi.getTimerCount()).toBe(0);
  expect(annuler).toHaveBeenCalledOnce();
  expect(document.activeElement).toBe(avant);
  avant.remove();
});
