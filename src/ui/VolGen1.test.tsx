// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { CarteKanto } from './CarteKanto';
import { useVol } from './VolGen1';
import { storeJeu } from './store';

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));
  storeJeu.getState().demarrer();
  const carte = storeJeu.getState().carte;
  storeJeu.setState({ carte: { ...carte, nouvelles: [], formes: carte.formes.map(f => ({
    ...f, actuelle: f.numero === 0, ouverte: f.ouverte || f.numero === 1,
  })) } });
});
afterEach(() => {
  cleanup();
  storeJeu.getState().arreter();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
const avancer = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });

it('ignore deux lancements rapprochés et respecte les seuils puis revient inactif', () => {
  const aller = vi.fn(), arrive = vi.fn();
  const { result } = renderHook(() => useVol(aller, arrive));
  act(() => { result.current.lancer('kanto.route1'); result.current.lancer('autre'); });
  expect(result.current.etat).toEqual({ actif: true, ms: 0, cible: 'kanto.route1' });
  avancer(3299);
  expect(aller).not.toHaveBeenCalled();
  avancer(1);
  expect(aller).toHaveBeenCalledExactlyOnceWith('kanto.route1');
  avancer(499);
  expect(arrive).not.toHaveBeenCalled();
  avancer(1);
  expect(arrive).toHaveBeenCalledTimes(1);
  expect(result.current.etat).toEqual({ actif: false, ms: 0, cible: null });
});

it('affiche les cinq images dans le SVG à 150 ms d’intervalle et désactive Y aller', () => {
  const aller = vi.spyOn(storeJeu.getState(), 'allerVers');
  const { container } = render(<CarteKanto quandArrive={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Route 1 (Zone 1)' }));
  const bouton = screen.getByRole('button', { name: 'Y aller' });
  fireEvent.click(bouton);
  fireEvent.click(bouton);
  expect((bouton as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByRole('status').textContent).toBe('Vol en cours vers Route 1…');
  for (let image = 1; image <= 5; image++) {
    expect(container.querySelector('svg image[data-dresseur]')?.getAttribute('href')).toBe(`img/sprites/dresseur/vol-${image}.png`);
    if (image < 5) avancer(150);
  }
  avancer(250);
  expect(container.querySelector('[data-vol-overlay][data-theme="dark"][aria-hidden="true"]')).toBeTruthy();
  avancer(2450);
  expect(aller).toHaveBeenCalledTimes(1);
  expect((screen.getByRole('button', { name: 'Y aller' }) as HTMLButtonElement).disabled).toBe(true);
});

it('réduit le mouvement à un fondu sans overlay ni dresseur, avec seuils 150 et 300 ms', () => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })));
  const aller = vi.spyOn(storeJeu.getState(), 'allerVers'), arrive = vi.fn();
  const { container } = render(<CarteKanto quandArrive={arrive} />);
  fireEvent.click(screen.getByRole('button', { name: 'Route 1 (Zone 1)' }));
  fireEvent.click(screen.getByRole('button', { name: 'Y aller' }));
  expect(container.querySelector('.fondu-carte')).toBeTruthy();
  expect(container.querySelector('[data-vol-overlay], [data-dresseur]')).toBeNull();
  avancer(149);
  expect(aller).not.toHaveBeenCalled();
  avancer(1);
  expect(aller).toHaveBeenCalledTimes(1);
  avancer(149);
  expect(arrive).not.toHaveBeenCalled();
  avancer(1);
  expect(arrive).toHaveBeenCalledTimes(1);
  expect(container.querySelector('.fondu-carte')).toBeNull();
});

it.each([false, true])('nettoie les minuteurs au démontage (mouvement réduit : %s)', reduit => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: reduit })));
  const aller = vi.fn(), arrive = vi.fn();
  const minuteursAvant = vi.getTimerCount();
  const { result, unmount } = renderHook(() => useVol(aller, arrive));
  act(() => result.current.lancer('kanto.route1'));
  unmount();
  expect(vi.getTimerCount()).toBe(minuteursAvant);
  avancer(5000);
  expect(aller).not.toHaveBeenCalled();
  expect(arrive).not.toHaveBeenCalled();
});
