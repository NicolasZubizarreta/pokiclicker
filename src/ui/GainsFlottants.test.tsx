// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { GainsFlottants } from './GainsFlottants';
import type { Gain, StoreJeu } from './store';

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

function monter() {
  let emettre: (gain: Gain) => void = () => undefined;
  const desabonner = vi.fn();
  const faux = { abonnerGains: (abonne: (gain: Gain) => void) => { emettre = abonne; return desabonner; } } as unknown as StoreJeu;
  const vue = render(<GainsFlottants store={faux} />);
  return { ...vue, emettre: (gain: Gain) => act(() => emettre(gain)), desabonner };
}

it.each([
  ['butin', ['+120 ₽', '+45 XP'], 'text-alerte-base'],
  ['capture', ['Capturé !'], 'text-succes-base'],
  ['diamants', ['+3 ◆'], 'text-info-texte'],
] as const)('affiche un gain « %s » à sa place, une ligne par information', (type, lignes, couleur) => {
  const { container, emettre } = monter();
  emettre({ type, lignes: [...lignes] });
  const gain = container.querySelector('.gain-flottant')!;
  expect([...gain.querySelectorAll('p')].map(p => p.textContent)).toEqual(lignes);
  expect(gain.className).toContain(couleur);
});

it('retire le gain après sa durée et se désabonne au démontage', () => {
  const { container, emettre, desabonner, unmount } = monter();
  emettre({ type: 'capture', lignes: ['Capturé !'] });
  act(() => vi.advanceTimersByTime(1099));
  expect(container.querySelector('.gain-flottant')).not.toBeNull();
  act(() => vi.advanceTimersByTime(1));
  expect(container.querySelector('.gain-flottant')).toBeNull();
  unmount();
  expect(desabonner).toHaveBeenCalled();
});

it('est coupé de l’animation en mouvement réduit par la règle globale, le texte restant lisible', async () => {
  const { readFileSync } = await import('node:fs');
  const css = readFileSync('src/styles/index.css', 'utf8');
  expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*\{[^}]*\*, \*::before, \*::after \{[^}]*animation: none !important/);
});
