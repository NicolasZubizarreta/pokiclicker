// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { storeJeu } from './store';
import { JaugeCadence } from './JaugeCadence';
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });
it('cache le repos, affiche le plafond et nettoie la minuterie', () => {
  vi.useFakeTimers();
  const lire = vi.spyOn(storeJeu.getState(), 'lireCadence').mockReturnValue({ actuelle: 0, maximum: 12 });
  const vue = render(<JaugeCadence />);
  expect(vue.container.textContent).toBe('');
  lire.mockReturnValue({ actuelle: 12, maximum: 12 });
  act(() => vi.advanceTimersByTime(250));
  expect(screen.getByText('12 / 12 clics par seconde, maximum').getAttribute('aria-hidden')).toBe('true');
  vue.unmount();
  expect(vi.getTimerCount()).toBe(0);
});
