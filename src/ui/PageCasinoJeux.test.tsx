// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { chargerEvenements } from '../core/evenements';
import { kanto } from '../core/regions';
import { creerGestionnaire, creerStockageMemoire } from '../core/sauvegarde';
import roue from '../../data/casino-roue.json';
import { creerStoreJeu, type StoreJeu } from './store';
import { PageCasino } from './PageCasino';

const stores: StoreJeu[] = [];
afterEach(() => { cleanup(); stores.forEach(s => s.getState().arreter()); stores.length = 0; vi.restoreAllMocks(); vi.useRealTimers(); vi.unstubAllGlobals(); });
function preparer(reduit: boolean, alea: number) {
  vi.useFakeTimers();
  vi.stubGlobal('matchMedia', (requete: string) => ({ matches: reduit && requete.includes('reduce') }));
  const stockage = creerStockageMemoire(), horloge = creerHorlogeSimulee();
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: () => 'test' });
  gestionnaire.creerPartie('Test', 'kanto.bourg-palette');
  const region = gestionnaire.chargerRegion('test', 'kanto')!.donnees;
  gestionnaire.ecrireRegion('test', 'kanto', { ...region, argent: 2000, jetons: 1000, bossVaincus: ['kanto.tour-pokemon'] });
  const aleatoire = vi.fn(() => alea);
  const ouvrir = () => {
    const store = creerStoreJeu({ stockage, horloge, alea: aleatoire, genererId: () => 'achat',
      evenements: chargerEvenements({ test: { version: 1, evenements: [] } }, kanto) });
    stores.push(store); store.getState().demarrer(); return store;
  };
  return { store: ouvrir(), ouvrir, alea: aleatoire, lire: () => gestionnaire.chargerRegion('test', 'kanto')!.donnees };
}
const clic = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const jetonsAffiches = () => document.querySelector('.cs-jeu-entete [data-jetons]')!.textContent!.replace(/\s/g, '');

it('l’ordre de la roue est une permutation des 37 numéros', () => {
  expect(roue.ordre).toHaveLength(37);
  expect([...roue.ordre].sort((a, b) => a - b)).toEqual(Array.from({ length: 37 }, (_, i) => i));
});

it('la salle propose les sept cartes de jeu, le décor et la mention argent virtuel', () => {
  const { store } = preparer(true, .999); render(<PageCasino store={store} retour={vi.fn()} />);
  expect(screen.getByRole('heading', { name: 'Casino', level: 1 })).toBeTruthy();
  for (const nom of ['Jouer à la machine', 'S’asseoir à la table', 'Lancer la pièce', 'Lancer la bille', 'Jouer', 'Gratter', 'Voir la boutique'])
    expect(screen.getByRole('button', { name: nom })).toBeTruthy();
  expect(screen.getByText('Argent virtuel uniquement : aucun paiement réel.')).toBeTruthy();
  expect(screen.getAllByRole('status')).toHaveLength(1);
});

it('roulette : la bille tourne 3,2 s, le gain reste caché puis apparaît avec la case gagnante', () => {
  const { store } = preparer(false, .999);
  Object.defineProperty(HTMLElement.prototype, 'animate', { configurable: true, value: () => ({ cancel() {} }) });
  try {
    const { container } = render(<PageCasino store={store} retour={vi.fn()} />);
    clic('Lancer la bille'); clic('Lancer la bille');
    expect(store.getState().casino.jetons).toBe(1001); // 1 000 − 1 + 2 : déjà joué
    expect(screen.getByRole('status').textContent).toBe('La bille tourne…');
    expect(jetonsAffiches()).toBe('999'); // le gain n'est pas encore révélé
    act(() => { vi.advanceTimersByTime(3199); });
    expect(screen.getByRole('status').textContent).toBe('La bille tourne…');
    act(() => { vi.advanceTimersByTime(1); });
    expect(screen.getByRole('status').textContent).toBe('Le 36 rouge est sorti. Gagné ×2 !');
    expect(jetonsAffiches()).toBe('1001');
    expect(container.querySelector('.cs-poche[data-gagnant="true"]')).toBeTruthy();
    expect(container.querySelector('.cs-centre b')!.textContent).toBe('36');
  } finally { delete (HTMLElement.prototype as unknown as Record<string, unknown>).animate; }
});

it('roulette : numéro plein ×36, pari refusé hors de la table, mouvement réduit sans attente', () => {
  const { store } = preparer(true, 0);
  render(<PageCasino store={store} retour={vi.fn()} />);
  clic('Lancer la bille'); clic(/^Numéro plein/);
  fireEvent.change(screen.getByLabelText('Ton numéro'), { target: { value: '40' } });
  clic('Lancer la bille');
  expect(screen.getByRole('status').textContent).toBe('Choisis un numéro de 0 à 36.');
  expect(store.getState().casino.jetons).toBe(1000);
  fireEvent.change(screen.getByLabelText('Ton numéro'), { target: { value: '0' } });
  clic('Lancer la bille');
  expect(screen.getByRole('status').textContent).toBe('Le 0 vert est sorti. Gagné ×36 !');
  expect(store.getState().casino.jetons).toBe(1035);
});

it('plus ou moins : gain annoncé, nouvelle carte sauvegardée et retrouvée après rechargement', () => {
  const p = preparer(true, .5);
  const vue = render(<PageCasino store={p.store} retour={vi.fn()} />);
  clic('Jouer');
  expect(screen.getByRole('img', { name: '7' })).toBeTruthy();
  expect(p.lire().plusOuMoinsCarte).toBe(7);
  expect(p.lire().jetons).toBe(1000); // aucune mise tant qu'on n'a pas choisi
  p.alea.mockReturnValue(.999); // le roi
  clic(/^Plus haut/);
  expect(screen.getByRole('status').textContent).toMatch(/^Roi après 7\. Gagné : \+\d+ jetons !$/);
  expect(p.lire().plusOuMoinsCarte).toBe(13);
  expect(screen.getByRole('img', { name: 'Roi' })).toBeTruthy();
  expect((screen.getByRole('button', { name: /^Plus haut/ }) as HTMLButtonElement).disabled).toBe(true); // rien au-dessus du roi
  vue.unmount(); p.store.getState().arreter();
  render(<PageCasino store={p.ouvrir()} retour={vi.fn()} />);
  clic('Jouer');
  expect(screen.getByRole('img', { name: 'Roi' })).toBeTruthy();
});

it('plus ou moins : la carte se retourne en 300 ms, l’ancienne reste visible 1,5 s, le gain est caché jusque-là', () => {
  const p = preparer(false, .5);
  render(<PageCasino store={p.store} retour={vi.fn()} />);
  clic('Jouer'); p.alea.mockReturnValue(.999);
  clic(/^Plus haut/);
  expect(screen.getByRole('status').textContent).toBe('La carte se retourne…');
  expect(jetonsAffiches()).toBe('999');
  act(() => { vi.advanceTimersByTime(300); });
  expect(screen.getByRole('status').textContent).toMatch(/^Roi après 7\. Gagné/);
  expect(screen.getByRole('img', { name: '7' })).toBeTruthy(); // la carte visible n'a pas encore été remplacée
  expect(Number(jetonsAffiches())).toBeGreaterThan(999);
  act(() => { vi.advanceTimersByTime(1500); });
  expect(screen.queryByRole('img', { name: '7' })).toBeNull();
  expect(screen.getAllByRole('img', { name: 'Roi' })).toHaveLength(1);
});
it('carte à gratter : le gain reste caché jusqu’à la dernière case, puis paie et sonne', () => {
  const p = preparer(true, 0);
  const sons = vi.fn(); p.store.abonnerSons(sons);
  render(<PageCasino store={p.store} retour={vi.fn()} />);
  clic('Gratter'); clic('Acheter une carte');
  expect(p.lire().jetons).toBe(1000 - 1 + 5000); // 6 × le 7, mise 1
  expect(jetonsAffiches()).toBe('999');
  expect(screen.getByRole('status').textContent).toBe('Gratte les 6 cases.');
  clic('Case 1, à gratter'); expect(screen.getByRole('button', { name: 'Case 1 : 7' })).toBeTruthy();
  expect(jetonsAffiches()).toBe('999');
  clic('Tout gratter');
  expect(screen.getByRole('status').textContent).toBe('6 × 7 ! Gagné ×5000 !');
  expect(jetonsAffiches()).toBe('5999');
  expect(sons).toHaveBeenCalledWith('coin');
});

it('carte à gratter : refuse un second achat avant la fin du ticket, puis le rouvre', () => {
  const p = preparer(true, .999);
  render(<PageCasino store={p.store} retour={vi.fn()} />);
  clic('Gratter'); clic('Acheter une carte');
  expect((screen.getByRole('button', { name: 'Acheter une carte' }) as HTMLButtonElement).disabled).toBe(true);
  clic('Tout gratter');
  expect(screen.getByRole('status').textContent).toBe('6 × Magicarpe ! Gagné ×20 !');
  expect((screen.getByRole('button', { name: 'Acheter une carte' }) as HTMLButtonElement).disabled).toBe(false);
});
