// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useAlerteArret } from './useAlerteArret';

let cache = true;
let reduit = false;
const vibrer = vi.fn();
beforeEach(() => {
  vi.useFakeTimers();
  cache = true;
  reduit = false;
  document.title = 'PokiClicker';
  vi.spyOn(document, 'hidden', 'get').mockImplementation(() => cache);
  vi.stubGlobal('matchMedia', () => ({ matches: reduit }));
  Object.defineProperty(navigator, 'vibrate', { configurable: true, value: vibrer });
});
afterEach(() => {
  cleanup();
  Reflect.deleteProperty(navigator, 'vibrate');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  vi.useRealTimers();
});

it('vibre une fois par arrêt et restaure le titre à la visibilité', () => {
  const { rerender } = renderHook(({ texte }) => useAlerteArret(texte), { initialProps: { texte: null as string | null } });
  rerender({ texte: 'Shiny apparu !' });
  rerender({ texte: 'Autre texte' });
  expect(vibrer).toHaveBeenCalledExactlyOnceWith([200, 100, 200]);
  act(() => vi.advanceTimersByTime(1000));
  expect(document.title).toBe('Shiny apparu !');
  rerender({ texte: null });
  act(() => vi.advanceTimersByTime(1000));
  expect(document.title).toBe('PokiClicker');
  act(() => vi.advanceTimersByTime(1000));
  cache = false;
  act(() => document.dispatchEvent(new Event('visibilitychange')));
  expect(document.title).toBe('PokiClicker');
  expect(vi.getTimerCount()).toBe(0);
  rerender({ texte: 'Nouveau !' });
  expect(vibrer).toHaveBeenCalledTimes(2);
});

it('respecte le mouvement réduit et nettoie au bout de cinq minutes puis au démontage', () => {
  reduit = true;
  const { rerender, unmount } = renderHook(({ texte }) => useAlerteArret(texte), { initialProps: { texte: 'Rare !' as string | null } });
  expect(vibrer).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(300000));
  expect(document.title).toBe('PokiClicker');
  expect(vi.getTimerCount()).toBe(0);
  rerender({ texte: null });
  rerender({ texte: 'Nouveau !' });
  act(() => vi.advanceTimersByTime(1000));
  unmount();
  expect(document.title).toBe('PokiClicker');
  expect(vi.getTimerCount()).toBe(0);
});

it('fonctionne sans API de vibration sur un onglet visible', () => {
  Reflect.deleteProperty(navigator, 'vibrate');
  cache = false;
  renderHook(() => useAlerteArret('Rare !'));
  expect(vi.getTimerCount()).toBe(0);
});
