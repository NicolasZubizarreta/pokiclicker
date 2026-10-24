// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { CarteKanto } from './CarteKanto';
import { storeJeu } from './store';

beforeEach(() => { storeJeu.getState().demarrer(); });
afterEach(() => {
  cleanup();
  storeJeu.getState().arreter();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
});
const afficher = () => render(<CarteKanto quandArrive={vi.fn()} />);

it('dessine les 24 formes dans l’ordre, marque la zone actuelle et ne pose aucun style inline', () => {
  const voir = vi.spyOn(storeJeu.getState(), 'voirCarte');
  const { container } = afficher();
  expect([...container.querySelectorAll('[data-forme]')].map(e => e.getAttribute('data-forme')))
    .toEqual(storeJeu.getState().carte.formes.map(f => f.nom));
  expect(container.querySelectorAll('[data-forme]')).toHaveLength(24);
  expect(container.querySelector('[data-actuelle]')?.getAttribute('data-actuelle'))
    .toBe(storeJeu.getState().carte.formes.find(f => f.actuelle)?.zone);
  expect(container.querySelectorAll('svg')).toHaveLength(1);
  expect(container.querySelector('[style]')).toBeNull();
  expect(voir).not.toHaveBeenCalled();
});

it('nomme les boutons et sélectionne au clavier sans voyager', () => {
  const aller = vi.spyOn(storeJeu.getState(), 'allerVers');
  afficher();
  const route = screen.getByRole('button', { name: 'Route 1 (Zone 1)' });
  expect(route.getAttribute('tabindex')).toBe('0');
  expect(route.querySelector('title')?.textContent).toBe('Route 1 (Zone 1)');
  expect(screen.queryByRole('button', { name: /Lavanville|Daran Ass/ })).toBeNull();
  fireEvent.keyDown(route, { key: 'Enter' });
  expect(screen.getByRole('status').textContent).toBe('Route 1 (Zone 1)');
  fireEvent.keyDown(route, { key: ' ' });
  expect(aller).not.toHaveBeenCalled();
});

it('permet de sélectionner une zone fermée', () => {
  afficher();
  const fermee = storeJeu.getState().carte.formes.find(f => f.zone && !f.ouverte)!;
  fireEvent.click(screen.getByRole('button', { name: `${fermee.nom} (Zone ${fermee.numero})` }));
  expect(screen.getByRole('status').textContent).toBe(`${fermee.nom} (Zone ${fermee.numero})`);
});

it('montre les noms et halos en debug seulement', () => {
  const { container, unmount } = afficher();
  expect(container.querySelectorAll('text')).toHaveLength(0);
  unmount();
  window.history.replaceState(null, '', '/?debug=carte');
  const debug = afficher().container;
  expect(debug.querySelectorAll('text')).toHaveLength(24);
  expect(debug.querySelector('[data-halos]')?.getAttribute('class')).toContain('stroke-focus');
});

it('zoome à la molette sans défiler et borne le viewBox', () => {
  const svg = afficher().container.querySelector('svg')!;
  vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 390, height: 219.375 } as DOMRect);
  const initial = svg.getAttribute('viewBox');
  expect(fireEvent.wheel(svg, { deltaY: -100, clientX: 195, clientY: 100 })).toBe(false);
  expect(svg.getAttribute('viewBox')).not.toBe(initial);
  fireEvent.wheel(svg, { deltaY: -100000, clientX: 195, clientY: 100 });
  expect(Number(svg.getAttribute('viewBox')!.split(' ')[2])).toBeCloseTo(16 / 6);
  fireEvent.wheel(svg, { deltaY: 100000, clientX: 195, clientY: 100 });
  expect(svg.getAttribute('viewBox')).toBe(initial);
});

it('capture les pointeurs, distingue toucher et glisser et zoome à deux doigts', () => {
  const svg = afficher().container.querySelector('svg')!;
  const capture = vi.fn();
  svg.setPointerCapture = capture;
  vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 390, height: 219.375 } as DOMRect);
  const pointer = (cible: Element, type: string, id: number, x: number) => {
    const event = new MouseEvent(type, { bubbles: true, clientX: x, clientY: 100, button: 0 });
    Object.defineProperty(event, 'pointerId', { value: id });
    fireEvent(cible, event);
  };
  const route = screen.getByRole('button', { name: 'Route 1 (Zone 1)' });
  pointer(route, 'pointerdown', 1, 100);
  pointer(svg, 'pointermove', 1, 109);
  pointer(svg, 'pointerup', 1, 109);
  expect(screen.getByRole('status').textContent).toBe('Sélectionne une zone.');
  pointer(route, 'pointerdown', 1, 100);
  pointer(svg, 'pointerup', 1, 100);
  expect(screen.getByRole('status').textContent).toBe('Route 1 (Zone 1)');
  pointer(svg, 'pointerdown', 1, 100);
  pointer(svg, 'pointerdown', 2, 200);
  pointer(svg, 'pointermove', 2, 300);
  expect(Number(svg.getAttribute('viewBox')!.split(' ')[2])).toBeCloseTo(8);
  pointer(svg, 'pointerup', 2, 300);
  const avant = svg.getAttribute('viewBox');
  pointer(svg, 'pointermove', 1, 80);
  expect(svg.getAttribute('viewBox')).not.toBe(avant);
  pointer(svg, 'pointercancel', 1, 80);
  expect(capture).toHaveBeenCalledWith(2);
});
