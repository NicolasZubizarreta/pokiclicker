// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { CarteKanto } from './CarteKanto';
import { useVol } from './VolGen1';
import { storeJeu } from './store';
import { reglages } from '../core/reglages';

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

it.each([false, true])('vole vers un lieu sans changer de zone (réduit : %s)', reduit => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: reduit })));
  const aller = vi.fn(), arrive = vi.fn(), ouvrir = vi.fn();
  const { result } = renderHook(() => useVol(aller, arrive));
  act(() => result.current.lancer('centre-commercial', null, ouvrir));
  const vol = reglages.interface.vol;
  const fin = reduit ? vol.fonduReduitMs : vol.poseMs + vol.volMs + vol.fermetureMs;
  avancer(fin - 1);
  expect(ouvrir).not.toHaveBeenCalled();
  avancer(1);
  expect(ouvrir).toHaveBeenCalledTimes(1);
  expect(aller).not.toHaveBeenCalled();
  expect(arrive).not.toHaveBeenCalled();
  expect(result.current.etat.actif).toBe(false);
});

it('ignore deux lancements rapprochés et respecte les seuils puis revient inactif', () => {
  const aller = vi.fn(), arrive = vi.fn();
  const { result } = renderHook(() => useVol(aller, arrive));
  act(() => { result.current.lancer('kanto.route1'); result.current.lancer('autre'); });
  expect(result.current.etat).toEqual({ actif: true, ms: 0, cible: 'kanto.route1', depart: null });
  avancer(3299);
  expect(aller).not.toHaveBeenCalled();
  avancer(1);
  expect(aller).toHaveBeenCalledExactlyOnceWith('kanto.route1');
  avancer(499);
  expect(arrive).not.toHaveBeenCalled();
  avancer(1);
  expect(arrive).toHaveBeenCalledTimes(1);
  expect(result.current.etat).toEqual({ actif: false, ms: 0, cible: null, depart: null });
});

it('affiche les cinq images dans le SVG à 150 ms d’intervalle et ferme la fiche au clic sur Y aller', () => {
  const aller = vi.spyOn(storeJeu.getState(), 'allerVers');
  const { container } = render(<CarteKanto quandArrive={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Route 1 (Zone 1)' }));
  const bouton = screen.getByRole('button', { name: 'Y aller' });
  fireEvent.click(bouton);
  fireEvent.click(bouton);
  const depart = container.querySelector('[data-dresseur]')!.parentElement!;
  const position = [depart.getAttribute('x'), depart.getAttribute('y')];
  expect(Number(depart.getAttribute('height'))).toBe(9 * reglages.interface.vol.tailleDresseurRatio);
  expect(screen.queryByRole('region', { name: 'Zone sélectionnée' })).toBeNull();
  expect(screen.getByRole('status').textContent).toBe('Vol en cours vers Route 1…');
  for (let image = 1; image <= 5; image++) {
    expect(container.querySelector('svg image[data-dresseur]')?.getAttribute('href')).toBe(`img/sprites/dresseur/vol-${image}.png`);
    if (image < 5) avancer(reglages.interface.vol.imageMs);
  }
  avancer(250);
  expect(container.querySelector('[data-vol-overlay][data-theme="dark"][aria-hidden="true"]')).toBeTruthy();
  avancer(2450);
  expect(aller).toHaveBeenCalledTimes(1);
  const dresseur = container.querySelector('[data-dresseur]')!.parentElement!;
  expect([dresseur.getAttribute('x'), dresseur.getAttribute('y')]).toEqual(position);
  avancer(499);
  expect(container.querySelector('[data-dresseur]')!.parentElement!.getAttribute('x')).toBe(position[0]);
  expect(screen.queryByRole('button', { name: 'Y aller' })).toBeNull();
});

it('anime la piste en 400 ms et répète les traits en 200 ms sans trou', () => {
  const { container } = render(<CarteKanto quandArrive={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Route 1 (Zone 1)' }));
  fireEvent.click(screen.getByRole('button', { name: 'Y aller' }));
  avancer(850);
  expect((container.querySelector('.vol-piste') as HTMLElement).style.getPropertyValue('--vol-ms')).toBe('400');
  const traits = container.querySelector('.vol-traits') as HTMLElement;
  expect(traits.style.getPropertyValue('--vol-ms')).toBe('200');
  expect(traits.querySelectorAll('svg')).toHaveLength(2);
});

it('réduit le mouvement à un fondu sans overlay ni dresseur, avec seuils 150 et 300 ms', () => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })));
  const aller = vi.spyOn(storeJeu.getState(), 'allerVers'), arrive = vi.fn();
  const { container } = render(<CarteKanto quandArrive={arrive} />);
  fireEvent.click(screen.getByRole('button', { name: 'Route 1 (Zone 1)' }));
  fireEvent.click(screen.getByRole('button', { name: 'Y aller' }));
  expect(container.querySelector('.fondu-carte')).toBeTruthy();
  expect(container.querySelector('[data-vol-overlay], [data-dresseur]')).toBeNull();
  avancer(reglages.interface.vol.changerReduitMs - 1);
  expect(aller).not.toHaveBeenCalled();
  avancer(1);
  expect(aller).toHaveBeenCalledTimes(1);
  avancer(reglages.interface.vol.fonduReduitMs - reglages.interface.vol.changerReduitMs - 1);
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
