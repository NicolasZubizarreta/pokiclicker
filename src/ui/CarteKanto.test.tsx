// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { CarteKanto } from './CarteKanto';
import { storeJeu } from './store';
import { creerHorlogeSysteme } from '../core/clock';
import { compteInitial, creerGestionnaire } from '../core/sauvegarde';
import { reglages } from '../core/reglages';
import { creerStockageLocal } from './stockage-local';
import { kanto } from '../core/regions';
import userEvent from '@testing-library/user-event';

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
beforeEach(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value: function (this: HTMLDialogElement) { this.open = true; } },
    close: { configurable: true, value: function (this: HTMLDialogElement) { this.open = false; this.dispatchEvent(new Event('close')); } },
  });
});
const repere = (name: string | RegExp) => within(document.querySelector('.carte-support > svg') as unknown as HTMLElement).getByRole('button', { name });

it('ouvre Céladopole, retient Tab et ferme avec Échap en restaurant le focus', async () => {
  storeJeu.getState().arreter();
  const carte = storeJeu.getState().carte;
  storeJeu.setState({ carte: { ...carte, formes: carte.formes.map(f => f.nom === 'Céladopole' ? { ...f, ouverte: true } : f) } });
  afficher();
  const origine = within(screen.getByRole('list')).getByRole('button', { name: /Céladopole/ });
  origine.focus();
  await userEvent.keyboard('{Enter}');
  const dialogue = screen.getByRole('dialog');
  expect(within(dialogue).getAllByRole('button').map(b => b.textContent)).toEqual(['×', 'Arène de Céladopole', 'Centre commercial', 'Casino']);
  const fermer = within(dialogue).getByRole('button', { name: 'Fermer' });
  expect(fermer.className).toContain('place-items-center');
  fermer.focus();
  fireEvent.keyDown(fermer, { key: 'Tab', shiftKey: true });
  expect(document.activeElement).toBe(within(dialogue).getByRole('button', { name: 'Arène de Céladopole' }));
  fireEvent.keyDown(document.activeElement!, { key: 'Tab' });
  expect(document.activeElement).toBe(fermer);
  fireEvent.keyDown(fermer, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(origine);
});

it('lance le vol avec Entrée sur une ligne ouverte', async () => {
  storeJeu.getState().arreter();
  const carte = storeJeu.getState().carte;
  storeJeu.setState({ carte: { ...carte, nouvelles: [], formes: carte.formes.map(f => ({ ...f, terminee: false, actuelle: f.numero === 0, ouverte: f.ouverte || f.numero === 1 })) } });
  afficher();
  within(screen.getByRole('list')).getByRole('button', { name: 'Route 1 (Zone 1)' }).focus();
  await userEvent.keyboard('{Enter}');
  expect(screen.getByRole('status').textContent).toBe('Vol en cours vers Route 1…');
});

it('garde l’arène verrouillée quand Céladopole est consultée par son repère fermé', () => {
  const carte = storeJeu.getState().carte;
  storeJeu.setState({ carte: { ...carte, formes: carte.formes.map(f => f.nom === 'Céladopole' ? { ...f, ouverte: false } : f) } });
  afficher();
  fireEvent.click(repere(/Céladopole/));
  expect((screen.getByRole('button', { name: 'Arène de Céladopole' }) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.queryByText(/Vol en cours/)).toBeNull();
});

function ouvrirDialogueCeladopole(etat: { ouverte: boolean; terminee: boolean; actuelle: boolean }) {
  storeJeu.getState().arreter();
  const carte = storeJeu.getState().carte;
  storeJeu.setState({ carte: { ...carte, formes: carte.formes.map(f => f.nom === 'Céladopole' ? { ...f, ...etat } : { ...f, actuelle: etat.actuelle ? false : f.numero === 0 }) } });
  afficher();
  fireEvent.click(repere(/Céladopole/));
  return screen.getByRole('dialog');
}

it('dit « Tu es ici. » sur l’arène seulement quand le joueur est à Céladopole', () => {
  const dialogue = ouvrirDialogueCeladopole({ ouverte: true, terminee: false, actuelle: true });
  expect((within(dialogue).getByRole('button', { name: 'Arène de Céladopole' }) as HTMLButtonElement).disabled).toBe(true);
  expect(within(dialogue).getByText('Tu es ici.')).toBeTruthy();
});

it('ne dit pas « Tu es ici. » sur l’arène d’une Céladopole terminée dont le joueur est parti', () => {
  const dialogue = ouvrirDialogueCeladopole({ ouverte: true, terminee: true, actuelle: false });
  expect((within(dialogue).getByRole('button', { name: 'Arène de Céladopole' }) as HTMLButtonElement).disabled).toBe(true);
  expect(within(dialogue).queryByText('Tu es ici.')).toBeNull();
  expect(within(dialogue).getByText('Terminée, plus accessible')).toBeTruthy();
});

it('ne grise pas l’arène d’une Céladopole ouverte quand le joueur est ailleurs', () => {
  const dialogue = ouvrirDialogueCeladopole({ ouverte: true, terminee: false, actuelle: false });
  expect((within(dialogue).getByRole('button', { name: 'Arène de Céladopole' }) as HTMLButtonElement).disabled).toBe(false);
  expect(within(dialogue).queryByText('Tu es ici.')).toBeNull();
});

it('laisse consulter la route terminée sans proposer de déplacement', () => {
  const carte = storeJeu.getState().carte;
  storeJeu.setState({ carte: { ...carte, formes: carte.formes.map(f => f.zone === 'kanto.route-de-ronflex'
    ? { ...f, terminee: true, ouverte: false } : f) } });
  const aller = vi.spyOn(storeJeu.getState(), 'allerVers');
  afficher();
  const option = within(screen.getByRole('list')).getByRole('button', { name: 'Route de Ronflex' });
  expect(within(option).getByText('Terminée')).toBeTruthy();
  fireEvent.click(repere('Route de Ronflex'));
  const fiche = screen.getByRole('region', { name: 'Zone sélectionnée' });
  expect(within(fiche).getByText('Terminée, plus accessible')).toBeTruthy();
  expect(within(fiche).queryByRole('button', { name: 'Y aller' })).toBeNull();
  expect(aller).not.toHaveBeenCalled();
});

it('liste les zones et l’interzone, avec les zones verrouillées grisées sans icône', () => {
  afficher();
  const liste = screen.getByRole('list', { name: 'Zones de Kanto' });
  const options = within(liste).getAllByRole('button');
  const zones = storeJeu.getState().carte.formes.filter(f => f.zone !== null)
    .sort((a, b) => kanto.zones.findIndex(z => z.id === a.zone) - kanto.zones.findIndex(z => z.id === b.zone));
  expect(options).toHaveLength(23);
  expect(options.map(option => option.getAttribute('aria-label')))
    .toEqual(zones.map(f => `${f.numero !== null && f.numero > 0 ? `${f.nom} (Zone ${f.numero})` : f.nom}${f.actuelle ? ', tu es ici' : ''}`));
  expect(options[0]?.getAttribute('aria-label')).toBe('Bourg Palette');
  expect(zones.some(f => !f.ouverte)).toBe(true);
  zones.forEach((f, index) => {
    const option = options[index]!;
    expect(option.className.includes('text-texte-doux')).toBe(!f.ouverte);
    expect(option.className).toContain('min-h-14');
    expect(option.className).toContain(f.actuelle ? 'border-succes-base' : 'border-bordure');
    if (!f.ouverte) {
      expect(option.textContent).toContain('verrouillée');
      expect(option.getAttribute('aria-disabled')).toBe('true');
      expect(option.querySelector('svg, img, i, button')).toBeNull();
    }
  });
  const actuelle = zones.find(f => f.actuelle)!;
  const position = options[zones.indexOf(actuelle)]!;
  expect(position.textContent).toContain('tu es ici');
  expect(position.getAttribute('aria-label')).toContain(actuelle.nom);
  expect(position.querySelector('.bg-succes-base')).toBeTruthy();
});

it('sélectionne une zone verrouillée depuis la liste et relie son contour à la carte', () => {
  afficher();
  const option = repere(/Forêt de Jade/);
  fireEvent.click(option);
  expect(option.querySelector('circle')?.getAttribute('class')).toContain('stroke-succes-base');
  const fiche = screen.getByRole('region', { name: 'Zone sélectionnée' });
  expect(within(fiche).getByRole('heading', { name: 'Forêt de Jade' })).toBeTruthy();
  expect(within(fiche).getByText('Bloquée')).toBeTruthy();
  const forme = repere(/Forêt de Jade/);
  expect(forme.querySelector('circle')?.getAttribute('class')).toContain('stroke-succes-base');
  fireEvent.click(repere('Route 1 (Zone 1)'));
  expect(forme.querySelector('circle')?.getAttribute('class')).not.toContain('stroke-succes-base');
  expect(repere('Route 1 (Zone 1)').querySelector('circle')?.getAttribute('class')).toContain('stroke-succes-base');
});

it('sélectionne avec Entrée et Espace et déplace le focus avec les flèches', () => {
  afficher();
  const options = within(document.querySelector('.carte-support > svg') as unknown as HTMLElement).getAllByRole('button');
  const premiere = options[0]!, deuxieme = options[1]!;
  premiere.focus();
  fireEvent.keyDown(premiere, { key: 'Enter' });
  expect(premiere.querySelector('circle')?.getAttribute('class')).toContain('stroke-succes-base');
  expect(within(screen.getByRole('region', { name: 'Zone sélectionnée' }))
    .getByRole('heading', { name: 'Bourg Palette' })).toBeTruthy();
  fireEvent.keyDown(premiere, { key: 'ArrowDown' });
  expect(document.activeElement).toBe(deuxieme);
  expect(premiere.querySelector('circle')?.getAttribute('class')).toContain('stroke-succes-base');
  expect(fireEvent.keyDown(deuxieme, { key: ' ' })).toBe(false);
  expect(deuxieme.querySelector('circle')?.getAttribute('class')).toContain('stroke-succes-base');
  expect(premiere.querySelector('circle')?.getAttribute('class')).not.toContain('stroke-succes-base');
  fireEvent.keyDown(deuxieme, { key: 'ArrowUp' });
  expect(document.activeElement).toBe(premiere);
});

it('dessine un repère par zone dans l’ordre, marque la zone actuelle et ne pose aucun style inline', () => {
  const voir = vi.spyOn(storeJeu.getState(), 'voirCarte');
  const { container } = afficher();
  const zones = storeJeu.getState().carte.formes.filter(f => f.zone !== null)
    .sort((a, b) => kanto.zones.findIndex(z => z.id === a.zone) - kanto.zones.findIndex(z => z.id === b.zone));
  expect([...container.querySelectorAll('[data-forme]')].map(e => e.getAttribute('data-forme')))
    .toEqual(zones.map(f => f.nom));
  expect(container.querySelectorAll('[data-forme]')).toHaveLength(23);
  expect(container.querySelector('[data-actuelle]')?.getAttribute('data-actuelle'))
    .toBe(storeJeu.getState().carte.formes.find(f => f.actuelle)?.zone);
  expect(container.querySelectorAll('.carte-support > svg')).toHaveLength(1);
  expect(container.querySelector('[style]')).toBeNull();
  expect(voir).not.toHaveBeenCalled();
});

it('nomme les boutons et sélectionne au clavier sans voyager', () => {
  const aller = vi.spyOn(storeJeu.getState(), 'allerVers');
  afficher();
  const route = repere('Route 1 (Zone 1)');
  expect(route.getAttribute('tabindex')).toBe('0');
  expect(route.querySelector('title')?.textContent).toBe('Route 1 (Zone 1)');
  expect(screen.queryByRole('button', { name: /Lavanville|Daran Ass/ })).toBeNull();
  fireEvent.keyDown(route, { key: 'Enter' });
  expect(screen.getByRole('heading', { name: 'Route 1' })).toBeTruthy();
  expect(within(screen.getByRole('region', { name: 'Zone sélectionnée' })).getByText('Zone 1')).toBeTruthy();
  fireEvent.keyDown(route, { key: ' ' });
  expect(aller).not.toHaveBeenCalled();
});

it('permet de sélectionner une zone fermée', () => {
  afficher();
  const fermee = storeJeu.getState().carte.formes.find(f => f.zone && !f.ouverte)!;
  fireEvent.click(repere(`${fermee.nom} (Zone ${fermee.numero})`));
  expect(screen.getByRole('heading', { name: fermee.nom })).toBeTruthy();
  expect(within(screen.getByRole('region', { name: 'Zone sélectionnée' })).getByText(`Zone ${fermee.numero}`)).toBeTruthy();
});

it('montre les noms et halos en debug seulement', () => {
  const { container, unmount } = afficher();
  expect(container.querySelectorAll('text')).toHaveLength(0);
  unmount();
  window.history.replaceState(null, '', '/?debug=carte');
  const debug = afficher().container;
  expect(debug.querySelectorAll('text')).toHaveLength(storeJeu.getState().carte.formes.length);
  expect(debug.querySelector('[data-halos]')?.getAttribute('class')).toContain('stroke-focus');
});

it('zoome à la molette sans défiler et borne le viewBox', () => {
  const svg = afficher().container.querySelector('.carte-support > svg')!;
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
  const svg = afficher().container.querySelector('.carte-support > svg')!;
  const capture = vi.fn();
  svg.setPointerCapture = capture;
  vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 390, height: 219.375 } as DOMRect);
  const pointer = (cible: Element, type: string, id: number, x: number) => {
    const event = new MouseEvent(type, { bubbles: true, clientX: x, clientY: 100, button: 0 });
    Object.defineProperty(event, 'pointerId', { value: id });
    fireEvent(cible, event);
  };
  const route = repere('Route 1 (Zone 1)');
  pointer(route, 'pointerdown', 1, 100);
  pointer(svg, 'pointermove', 1, 109);
  pointer(svg, 'pointerup', 1, 109);
  expect(screen.queryByRole('region', { name: 'Zone sélectionnée' })).toBeNull();
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
  expect(screen.getByRole('region', { name: 'Zone sélectionnée' })).toBeTruthy();
  pointer(svg, 'pointerdown', 1, 100);
  pointer(svg, 'pointerup', 1, 100);
  expect(screen.queryByRole('region', { name: 'Zone sélectionnée' })).toBeNull();
});

it('présente le titre et l’aide PC sans progression de voyage', () => {
  afficher();
  expect(screen.getByRole('heading', { name: 'Carte de Kanto' })).toBeTruthy();
  expect(screen.getByText(/Choisis une zone dans la liste/)).toBeTruthy();
  expect(screen.queryByRole('progressbar')).toBeNull();
});

it('voyage vers une zone ouverte avant de signaler l’arrivée', () => {
  vi.useFakeTimers();
  storeJeu.getState().allerVers(storeJeu.getState().carte.formes.find(f => f.numero === 0)!.zone!);
  const aller = vi.spyOn(storeJeu.getState(), 'allerVers');
  const arrive = vi.fn();
  render(<CarteKanto quandArrive={arrive} />);
  fireEvent.click(repere('Route 1 (Zone 1)'));
  expect(screen.getByRole('heading', { name: 'Route 1' })).toBeTruthy();
  expect(within(screen.getByRole('region', { name: 'Zone sélectionnée' })).getByText('Zone 1')).toBeTruthy();
  const image = screen.getByRole('img', { name: 'Décor de Route 1' });
  expect(image.className).toContain('carte-miniature');
  fireEvent.click(screen.getByRole('button', { name: 'Y aller' }));
  expect(screen.queryByRole('region', { name: 'Zone sélectionnée' })).toBeNull();
  act(() => { vi.advanceTimersByTime(3800); });
  expect(aller).toHaveBeenCalledWith(storeJeu.getState().carte.formes.find(f => f.numero === 1)!.zone);
  expect(arrive).toHaveBeenCalledTimes(1);
  expect(aller.mock.invocationCallOrder[0]).toBeLessThan(arrive.mock.invocationCallOrder[0]!);
});

it('explique le verrouillage de la Forêt de Jade sans action', () => {
  afficher();
  fireEvent.click(repere(/Forêt de Jade/));
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
  fireEvent.click(repere(/Céladopole/));
  const fiche = screen.getByRole('dialog');
  expect(within(fiche).getByRole('heading', { name: 'Céladopole' })).toBeTruthy();
  expect(within(fiche).getByRole('button', { name: 'Arène de Céladopole' })).toBeTruthy();
  expect(within(fiche).queryByRole('heading', { name: 'Arène' })).toBeNull();
  for (const nom of ['Centre commercial', 'Casino']) {
    expect((within(fiche).getByRole('button', { name: nom }) as HTMLButtonElement).disabled).toBe(true);
  }
  expect(within(fiche).getAllByText('Bientôt disponible.')).toHaveLength(2);
  fireEvent.click(within(fiche).getByRole('button', { name: 'Arène de Céladopole' }));
  act(() => { vi.advanceTimersByTime(3800); });
  expect(aller).toHaveBeenCalledWith(ville.zone);
});

it('affiche la fiche seulement après sélection, sur la carte, et indique la zone actuelle sans action', () => {
  const { container } = afficher();
  expect(screen.queryByRole('region', { name: 'Zone sélectionnée' })).toBeNull();
  for (const nom of [/Forêt de Jade/, /Route 1 \(Zone 1\)/]) {
    fireEvent.click(repere(nom));
    const fiche = screen.getByRole('region', { name: 'Zone sélectionnée' });
    expect(fiche.className).toContain('carte-fiche');
    expect(fiche.parentElement).toBe(container.querySelector('.carte-support > svg')?.parentElement);
  }
  const actuelle = storeJeu.getState().carte.formes.find(f => f.actuelle)!;
  fireEvent.click(repere(actuelle.numero ? `${actuelle.nom} (Zone ${actuelle.numero})` : actuelle.nom));
  expect(screen.getByText('Tu es ici.')).toBeTruthy();
  const fiche = screen.getByRole('region', { name: 'Zone sélectionnée' });
  expect(within(fiche).queryByRole('button', { name: 'Y aller' })).toBeNull();
  expect(container.textContent).not.toMatch(/\b(locked|travel|current|coming soon|select a zone)\b/i);
});

it('ferme avec × et Échap depuis la fiche ou la carte, mais pas au clic dans la fiche', () => {
  afficher();
  const route = repere('Route 1 (Zone 1)');
  fireEvent.click(route);
  fireEvent.click(screen.getByRole('heading', { name: 'Route 1' }));
  expect(screen.getByRole('region', { name: 'Zone sélectionnée' })).toBeTruthy();
  const fermer = screen.getByRole('button', { name: 'Fermer' });
  expect(fermer.textContent).toBe('×');
  fireEvent.click(fermer);
  expect(screen.queryByRole('region', { name: 'Zone sélectionnée' })).toBeNull();
  fireEvent.click(route);
  fireEvent.keyDown(screen.getByRole('button', { name: 'Fermer' }), { key: 'Escape' });
  expect(screen.queryByRole('region', { name: 'Zone sélectionnée' })).toBeNull();
  fireEvent.click(route);
  fireEvent.keyDown(route, { key: 'Escape' });
  expect(screen.queryByRole('region', { name: 'Zone sélectionnée' })).toBeNull();
});

it('annonce les zones débloquées puis les marque vues après 600 ms', () => {
  vi.useFakeTimers();
  const route = storeJeu.getState().carte.formes.find(f => f.numero === 1)!;
  storeJeu.getState().allerVers(route.zone!);
  for (let i = 0; i < 10000 && !storeJeu.getState().carte.nouvelles.length; i++) {
    vi.advanceTimersByTime(100);
    // Chen explique le premier boss (ticket AI) : on lit ses répliques pour reprendre le combat.
    if (storeJeu.getState().evenement) storeJeu.getState().terminerEtape();
    storeJeu.getState().attaquer();
    storeJeu.getState().tick();
  }
  const nouvelles = [...storeJeu.getState().carte.nouvelles];
  expect(nouvelles.length).toBeGreaterThan(0);
  const { container } = afficher();
  expect(screen.getByRole('status').textContent).toContain('Zone débloquée !');
  expect(document.querySelector('.carte-aide [role="status"]')).toBe(screen.getByRole('status'));
  expect(screen.getByRole('status').textContent).toContain('Forêt de Jade');
  expect(container.querySelector('[data-forme="Forêt de Jade"]')?.getAttribute('class')).not.toContain('carte-deblocage');
  act(() => { vi.advanceTimersByTime(599); });
  expect(storeJeu.getState().carte.nouvelles).toEqual(nouvelles);
  expect(container.querySelector('.carte-deblocage')).toBeNull();
  act(() => { vi.advanceTimersByTime(1); });
  expect(storeJeu.getState().carte.nouvelles).toEqual([]);
  expect(screen.getByRole('status').textContent).toContain('Zone débloquée !');
  expect(container.querySelector('[data-forme="Forêt de Jade"]')?.getAttribute('class')).toContain('carte-deblocage');
  fireEvent.click(repere(/Forêt de Jade/));
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
