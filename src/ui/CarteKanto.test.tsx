// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { CarteKanto } from './CarteKanto';
import { storeJeu } from './store';
import { creerHorlogeSysteme } from '../core/clock';
import { compteInitial, creerGestionnaire } from '../core/sauvegarde';
import { reglages } from '../core/reglages';
import { creerStockageLocal } from './stockage-local';

const gestionnaire = creerGestionnaire({ stockage: creerStockageLocal(), horloge: creerHorlogeSysteme(), genererId: () => 'test' });
const compte = compteInitial();
gestionnaire.ecrireCompte({ ...compte,
  preferences: { ...compte.preferences, arretAuto: { ...reglages.depart.preferences.arretAuto, actif: false } } });
beforeEach(() => { storeJeu.getState().demarrer(); });
afterEach(() => {
  cleanup();
  storeJeu.getState().arreter();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
  vi.useRealTimers();
});
const afficher = () => render(<CarteKanto quandArrive={vi.fn()} />);

it('liste les 22 zones par numéro, avec les zones verrouillées grisées sans icône', () => {
  afficher();
  const liste = screen.getByRole('listbox', { name: 'Zones de Kanto' });
  const options = within(liste).getAllByRole('option');
  const zones = storeJeu.getState().carte.formes.filter(f => f.zone !== null)
    .sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0));
  expect(options).toHaveLength(22);
  expect(options.map(option => option.getAttribute('aria-label')))
    .toEqual(zones.map(f => f.numero ? `${f.nom} (Zone ${f.numero})` : f.nom));
  expect(options[0]?.getAttribute('aria-label')).toBe('Bourg Palette');
  expect(zones.some(f => !f.ouverte)).toBe(true);
  zones.forEach((f, index) => {
    const option = options[index]!;
    expect(option.className.includes('text-texte-doux')).toBe(!f.ouverte);
    expect(option.className).toContain('min-h-11');
    expect(option.className).toContain('border-transparent');
    if (!f.ouverte) {
      expect(option.textContent).toBe(`${f.numero}${f.nom}`);
      expect(option.querySelector('svg, img, i, button')).toBeNull();
    }
  });
  const actuelle = zones.find(f => f.actuelle)!;
  const position = within(liste).getByText('position actuelle');
  expect(position.className).toBe('sr-only');
  expect(position.closest('[role="option"]')?.getAttribute('aria-label'))
    .toBe(actuelle.numero ? `${actuelle.nom} (Zone ${actuelle.numero})` : actuelle.nom);
  expect(position.previousElementSibling?.className).toContain('bg-succes-base');
});

it('sélectionne une zone verrouillée depuis la liste et relie son contour à la carte', () => {
  afficher();
  const option = screen.getByRole('option', { name: /Forêt de Jade/ });
  fireEvent.click(option);
  expect(option.getAttribute('aria-selected')).toBe('true');
  expect(option.className).toContain('border-succes-base');
  const fiche = screen.getByRole('region', { name: 'Zone sélectionnée' });
  expect(within(fiche).getByRole('heading', { name: 'Forêt de Jade' })).toBeTruthy();
  expect(within(fiche).getByText('Bloquée')).toBeTruthy();
  const forme = screen.getByRole('button', { name: /Forêt de Jade/ });
  expect(forme.getAttribute('class')).toContain('stroke-succes-base stroke-2');
  fireEvent.click(screen.getByRole('button', { name: 'Route 1 (Zone 1)' }));
  expect(option.getAttribute('aria-selected')).toBe('false');
  expect(forme.getAttribute('class')).not.toContain('stroke-succes-base');
  expect(screen.getByRole('option', { name: 'Route 1 (Zone 1)' }).getAttribute('aria-selected')).toBe('true');
});

it('sélectionne avec Entrée et Espace et déplace le focus avec les flèches', () => {
  afficher();
  const options = screen.getAllByRole('option');
  const premiere = options[0]!, deuxieme = options[1]!;
  premiere.focus();
  fireEvent.keyDown(premiere, { key: 'Enter' });
  expect(premiere.getAttribute('aria-selected')).toBe('true');
  expect(within(screen.getByRole('region', { name: 'Zone sélectionnée' }))
    .getByRole('heading', { name: 'Bourg Palette' })).toBeTruthy();
  fireEvent.keyDown(premiere, { key: 'ArrowDown' });
  expect(document.activeElement).toBe(deuxieme);
  expect(premiere.getAttribute('aria-selected')).toBe('true');
  expect(fireEvent.keyDown(deuxieme, { key: ' ' })).toBe(false);
  expect(deuxieme.getAttribute('aria-selected')).toBe('true');
  expect(premiere.getAttribute('aria-selected')).toBe('false');
  fireEvent.keyDown(deuxieme, { key: 'ArrowUp' });
  expect(document.activeElement).toBe(premiere);
});

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
  expect(screen.getByRole('heading', { name: 'Route 1' })).toBeTruthy();
  expect(screen.getByText('Zone 1')).toBeTruthy();
  fireEvent.keyDown(route, { key: ' ' });
  expect(aller).not.toHaveBeenCalled();
});

it('permet de sélectionner une zone fermée', () => {
  afficher();
  const fermee = storeJeu.getState().carte.formes.find(f => f.zone && !f.ouverte)!;
  fireEvent.click(screen.getByRole('button', { name: `${fermee.nom} (Zone ${fermee.numero})` }));
  expect(screen.getByRole('heading', { name: fermee.nom })).toBeTruthy();
  expect(screen.getByText(`Zone ${fermee.numero}`)).toBeTruthy();
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
  expect(screen.getByText('Touche une zone pour la voir.')).toBeTruthy();
  pointer(route, 'pointerdown', 1, 100);
  pointer(svg, 'pointerup', 1, 100);
  expect(screen.getByRole('heading', { name: 'Route 1' })).toBeTruthy();
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

it('présente le voyage avec une progression native accessible', () => {
  afficher();
  expect(screen.getByRole('heading', { name: 'Ton voyage' })).toBeTruthy();
  expect(screen.getByText(/0 badges sur 8 · .* en cours/)).toBeTruthy();
  const progress = screen.getByRole('progressbar', { name: 'Badges obtenus' });
  expect(progress.tagName).toBe('PROGRESS');
  expect(progress.getAttribute('value')).toBe('0');
  expect(progress.getAttribute('max')).toBe('8');
});

it('voyage vers une zone ouverte avant de signaler l’arrivée', () => {
  vi.useFakeTimers();
  storeJeu.getState().allerVers(storeJeu.getState().carte.formes.find(f => f.numero === 0)!.zone!);
  const aller = vi.spyOn(storeJeu.getState(), 'allerVers');
  const arrive = vi.fn();
  render(<CarteKanto quandArrive={arrive} />);
  fireEvent.click(screen.getByRole('button', { name: 'Route 1 (Zone 1)' }));
  expect(screen.getByRole('heading', { name: 'Route 1' })).toBeTruthy();
  expect(screen.getByText('Zone 1')).toBeTruthy();
  const image = screen.getByRole('img', { name: 'Décor de Route 1' });
  expect(image.className).toContain('aspect-video');
  fireEvent.click(screen.getByRole('button', { name: 'Y aller' }));
  act(() => { vi.advanceTimersByTime(3800); });
  expect(aller).toHaveBeenCalledWith(storeJeu.getState().carte.formes.find(f => f.numero === 1)!.zone);
  expect(arrive).toHaveBeenCalledTimes(1);
  expect(aller.mock.invocationCallOrder[0]).toBeLessThan(arrive.mock.invocationCallOrder[0]!);
});

it('explique le verrouillage de la Forêt de Jade sans action', () => {
  afficher();
  fireEvent.click(screen.getByRole('button', { name: /Forêt de Jade/ }));
  expect(screen.getByText('Bloquée')).toBeTruthy();
  expect(screen.getByText('Bats le boss de Route 1.')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Y aller' })).toBeNull();
});

it('propose les trois entrées de Céladopole et explique les deux indisponibles', () => {
  vi.useFakeTimers();
  const carte = storeJeu.getState().carte;
  const ville = carte.formes.find(f => f.nom === 'Céladopole')!;
  storeJeu.setState({ carte: { ...carte, formes: carte.formes.map(f => f === ville ? { ...f, ouverte: true, actuelle: false } : f) } });
  const aller = vi.spyOn(storeJeu.getState(), 'allerVers').mockImplementation(() => {});
  afficher();
  const fiche = screen.getByRole('region', { name: 'Zone sélectionnée' });
  fireEvent.click(screen.getByRole('button', { name: /Céladopole/ }));
  expect(within(fiche).getByRole('heading', { name: 'Céladopole' })).toBeTruthy();
  expect(within(fiche).getByRole('button', { name: 'Arène' })).toBeTruthy();
  expect(within(fiche).queryByRole('heading', { name: 'Arène' })).toBeNull();
  for (const nom of ['Centre commercial', 'Casino']) {
    expect((within(fiche).getByRole('button', { name: nom }) as HTMLButtonElement).disabled).toBe(true);
  }
  expect(within(fiche).getAllByText('Bientôt disponible.')).toHaveLength(2);
  fireEvent.click(within(fiche).getByRole('button', { name: 'Arène' }));
  act(() => { vi.advanceTimersByTime(3800); });
  expect(aller).toHaveBeenCalledWith(ville.zone);
});

it('réserve la même bande sous l’image et indique la zone actuelle sans action', () => {
  const { container } = afficher();
  const fiche = screen.getByRole('region', { name: 'Zone sélectionnée' });
  const classes = fiche.className;
  expect(classes).toContain('carte-bande-reservee');
  expect(fiche.previousElementSibling?.querySelector('svg[aria-label="Carte de Kanto"]')).toBeTruthy();
  expect(fiche.previousElementSibling?.className).toContain('cadre');
  expect(fiche.parentElement?.className).toContain('carte-grille');
  for (const nom of [/Céladopole/, /Forêt de Jade/, /Route 1 \(Zone 1\)/]) {
    fireEvent.click(screen.getByRole('button', { name: nom }));
    expect(fiche.className).toBe(classes);
  }
  const actuelle = storeJeu.getState().carte.formes.find(f => f.actuelle)!;
  fireEvent.click(screen.getByRole('button', { name: actuelle.numero ? `${actuelle.nom} (Zone ${actuelle.numero})` : actuelle.nom }));
  expect(screen.getByText('Tu es ici.')).toBeTruthy();
  expect(within(fiche).queryByRole('button', { name: 'Y aller' })).toBeNull();
  expect(container.textContent).not.toMatch(/\b(locked|travel|current|coming soon|select a zone)\b/i);
});

it('annonce les zones débloquées puis les marque vues après 600 ms', () => {
  vi.useFakeTimers();
  const route = storeJeu.getState().carte.formes.find(f => f.numero === 1)!;
  storeJeu.getState().allerVers(route.zone!);
  for (let i = 0; i < 10000 && !storeJeu.getState().carte.nouvelles.length; i++) {
    vi.advanceTimersByTime(100);
    storeJeu.getState().attaquer();
    storeJeu.getState().tick();
  }
  const nouvelles = [...storeJeu.getState().carte.nouvelles];
  expect(nouvelles.length).toBeGreaterThan(0);
  const { container } = afficher();
  expect(screen.getByRole('status').textContent).toContain('Zone débloquée !');
  expect(screen.getByRole('status').textContent).toContain('Forêt de Jade');
  expect(container.querySelector('[data-forme="Forêt de Jade"]')?.getAttribute('class')).not.toContain('carte-deblocage');
  act(() => { vi.advanceTimersByTime(599); });
  expect(storeJeu.getState().carte.nouvelles).toEqual(nouvelles);
  expect(container.querySelector('.carte-deblocage')).toBeNull();
  act(() => { vi.advanceTimersByTime(1); });
  expect(storeJeu.getState().carte.nouvelles).toEqual([]);
  expect(screen.getByRole('status').textContent).toContain('Zone débloquée !');
  expect(container.querySelector('[data-forme="Forêt de Jade"]')?.getAttribute('class')).toContain('carte-deblocage');
  fireEvent.click(screen.getByRole('button', { name: /Forêt de Jade/ }));
  expect(screen.queryByRole('status')).toBeNull();
});

it('annule la prise en compte des déblocages si la carte est quittée avant la fin', () => {
  vi.useFakeTimers();
  const carte = storeJeu.getState().carte;
  const zone = carte.formes.find(f => f.nom === 'Forêt de Jade')!.zone!;
  storeJeu.setState({ carte: { ...carte, nouvelles: [zone] } });
  const voir = vi.spyOn(storeJeu.getState(), 'voirCarte');
  const { unmount } = afficher();
  unmount();
  act(() => { vi.advanceTimersByTime(600); });
  expect(voir).not.toHaveBeenCalled();
  expect(storeJeu.getState().carte.nouvelles).toEqual([zone]);
});
