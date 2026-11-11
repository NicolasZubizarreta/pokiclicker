// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { chargerEvenements } from '../core/evenements';
import { kanto } from '../core/regions';
import { construireSabot } from '../core/casino';
import { creerGestionnaire, creerStockageMemoire } from '../core/sauvegarde';
import { creerStoreJeu, type StoreJeu } from './store';
import { PageCasino } from './PageCasino';
import { PageCarte } from './PageCentre';
import { storeJeu } from './store';

const stores: StoreJeu[] = [];
Object.defineProperties(HTMLDialogElement.prototype, {
  showModal: { configurable: true, value(this: HTMLDialogElement) { this.open = true; } },
  close: { configurable: true, value(this: HTMLDialogElement) { this.open = false; this.dispatchEvent(new Event('close')); } },
});
afterEach(() => { cleanup(); stores.forEach(s => s.getState().arreter()); stores.length = 0; vi.restoreAllMocks(); vi.useRealTimers(); vi.unstubAllGlobals(); });
function preparer(reduit = false, ouvert = true, sabot?: string[]) {
  vi.useFakeTimers();
  vi.stubGlobal('matchMedia', (requete: string) => ({ matches: reduit && requete.includes('reduce') }));
  const stockage = creerStockageMemoire(), horloge = creerHorlogeSimulee();
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: () => 'test' });
  gestionnaire.creerPartie('Test', 'kanto.bourg-palette');
  const region = gestionnaire.chargerRegion('test', 'kanto')!.donnees;
  gestionnaire.ecrireRegion('test', 'kanto', { ...region, argent: 2000, jetons: 1000, bossVaincus: ouvert ? ['kanto.tour-pokemon'] : [],
    ...(sabot ? { sabotBlackjack: sabot } : {}) });
  const ouvrir = () => {
    const store = creerStoreJeu({ stockage, horloge, alea: () => .999, genererId: () => 'achat',
      evenements: chargerEvenements({ test: { version: 1, evenements: [] } }, kanto) });
    stores.push(store); store.getState().demarrer(); return store;
  };
  return { store: ouvrir(), ouvrir };
}
const clic = (name: string) => fireEvent.click(screen.getByRole('button', { name }));

it('achète, échange et propose les sept lots avec raisons et un seul status', () => {
  const { store } = preparer(); render(<PageCasino store={store} retour={vi.fn()} />);
  clic('Acheter 50 jetons'); expect(store.getState().casino.jetons).toBe(1050);
  clic('Échanger 50 jetons'); expect(store.getState().casino.jetons).toBe(1000);
  clic('Boutique'); expect(screen.getAllByRole('button', { name: /^Obtenir / })).toHaveLength(7);
  clic('Obtenir Abra'); expect(store.getState().casino.jetons).toBe(750);
  expect(screen.getByRole('status').textContent).toBe('+Abra !');
  expect((screen.getByRole('button', { name: 'Obtenir Porygon' }) as HTMLButtonElement).disabled).toBe(true);
});
it('refuse l’accès fermé', () => {
  const { store } = preparer(false, false); render(<PageCasino store={store} retour={vi.fn()} />);
  expect(screen.getByRole('status').textContent).toContain('Tour Pokémon');
  expect(screen.queryByRole('button', { name: 'Lancer' })).toBeNull();
});
it('résout immédiatement mais arrête les rouleaux à 700, 950 et 1200 ms', () => {
  const { store } = preparer(); const { container, unmount } = render(<PageCasino store={store} retour={vi.fn()} />);
  const decoratif = vi.spyOn(Math, 'random').mockReturnValue(.999);
  const jouer = vi.spyOn(store.getState(), 'jouerMachine'); clic('Lancer'); clic('Lancer');
  expect(jouer).toHaveBeenCalledTimes(1); expect(store.getState().casino.jetons).toBe(1001);
  const actifs = () => container.querySelectorAll('[data-tourne="true"]').length;
  expect(actifs()).toBe(3);
  decoratif.mockClear();
  act(() => { vi.advanceTimersByTime(79); }); expect(decoratif).not.toHaveBeenCalled();
  act(() => { vi.advanceTimersByTime(1); }); expect(decoratif).toHaveBeenCalledTimes(3);
  act(() => { vi.advanceTimersByTime(619); }); expect(actifs()).toBe(3);
  act(() => { vi.advanceTimersByTime(1); }); expect(actifs()).toBe(2);
  act(() => { vi.advanceTimersByTime(250); }); expect(actifs()).toBe(1);
  act(() => { vi.advanceTimersByTime(250); }); expect(actifs()).toBe(0);
  expect(screen.getByRole('status').textContent).toBe('Gagné ×2 !');
  clic('Lancer'); unmount(); store.getState().arreter(); vi.runAllTicks(); expect(vi.getTimerCount()).toBe(0);
});
it('anime la pièce pendant 500 ms puis annonce son résultat', () => {
  const { store } = preparer(); const { container } = render(<PageCasino store={store} retour={vi.fn()} />);
  clic('Pile ou face'); clic('Pile'); clic('Lancer');
  expect(store.getState().casino.jetons).toBe(1001); expect(container.querySelector('.coin-spin')).toBeTruthy();
  act(() => { vi.advanceTimersByTime(499); }); expect(screen.getByRole('status').textContent).toBe('La pièce tourne…');
  act(() => { vi.advanceTimersByTime(1); }); expect(screen.getByRole('status').textContent).toBe('Pile. Gagné ×2 !');
});
it('affiche directement les résultats en mouvement réduit et refuse une mise invalide', () => {
  const { store } = preparer(true); render(<PageCasino store={store} retour={vi.fn()} />);
  fireEvent.change(screen.getByLabelText('Mise'), { target: { value: '0' } }); clic('Lancer');
  expect(store.getState().casino.jetons).toBe(1000); expect(screen.getByRole('status').textContent).toBe('Mise invalide.');
  fireEvent.change(screen.getByLabelText('Mise'), { target: { value: '1' } }); clic('Lancer');
  expect(screen.getByRole('status').textContent).toBe('Gagné ×2 !');
  clic('Pile ou face'); clic('Lancer'); expect(screen.getByRole('status').textContent).toBe('Pile. Perdu…');
  store.getState().arreter(); act(() => { vi.advanceTimersByTime(0); }); expect(vi.getTimerCount()).toBe(0);
});
it('annule l’animation de la pièce au démontage sans rejouer le coup', () => {
  const { store } = preparer(); const { unmount } = render(<PageCasino store={store} retour={vi.fn()} />);
  clic('Pile ou face'); clic('Lancer'); const jetons = store.getState().casino.jetons;
  unmount(); store.getState().arreter(); act(() => { vi.advanceTimersByTime(0); });
  expect(vi.getTimerCount()).toBe(0); expect(store.getState().casino.jetons).toBe(jetons);
});
const remplissage = construireSabot(() => 0.25).slice(0, 80);
const sabotDe = (...cartes: string[]) => [...cartes, ...remplissage];
it('reprend une main après rechargement, cache la carte du croupier, permet de rester et annonce Dépassé', () => {
  const p = preparer(true, true, sabotDe('K-C', 'K-D', 'K-H', 'K-S', '10-S', '6-D', '9-H', '7-C', '10-D'));
  const vue = render(<PageCasino store={p.store} retour={vi.fn()} />);
  clic('Blackjack'); clic('Distribuer'); expect(p.store.getState().casino.jetons).toBe(999);
  vue.unmount(); p.store.getState().arreter(); const reprise = p.ouvrir();
  render(<PageCasino store={reprise} retour={vi.fn()} />);
  expect(screen.getByText('Ta main · 20')).toBeTruthy();
  expect(screen.getByRole('img', { name: 'Carte cachée' })).toBeTruthy();
  expect(screen.queryByRole('img', { name: 'Roi de pique' })).toBeNull();
  expect((screen.getByRole('button', { name: 'Distribuer' }) as HTMLButtonElement).disabled).toBe(true);
  clic('Rester'); expect(screen.getByRole('status').textContent).toBe('Égalité. Mise rendue.');
  expect(screen.queryByRole('img', { name: 'Carte cachée' })).toBeNull();
  expect(screen.getByText('Croupier Rocket · 20')).toBeTruthy();
  clic('Distribuer'); clic('Tirer'); expect(screen.getByRole('status').textContent).toBe('Dépassé ! Perdu.');
});
it('sépare une paire, double la première main et annonce le bilan des deux mains', () => {
  const p = preparer(true, true, sabotDe('8-S', '6-C', '8-H', '10-D', '3-D', '9-S', '10-C', '10-H'));
  render(<PageCasino store={p.store} retour={vi.fn()} />);
  clic('Blackjack'); clic('Distribuer');
  expect((screen.getByRole('button', { name: 'Séparer' }) as HTMLButtonElement).disabled).toBe(false);
  expect((screen.getByRole('button', { name: 'Abandonner' }) as HTMLButtonElement).disabled).toBe(true); // mise de 1 : la moitié arrondie vaut 0
  clic('Séparer');
  expect(screen.getByText('Ta main 1 · 11')).toBeTruthy(); expect(screen.getByText('Ta main 2 · 17')).toBeTruthy();
  expect(screen.getByRole('region', { name: 'Ta main 1' }).getAttribute('aria-current')).toBe('true');
  expect((screen.getByRole('button', { name: 'Abandonner' }) as HTMLButtonElement).disabled).toBe(true);
  expect(p.store.getState().casino.jetons).toBe(998);
  clic('Doubler'); expect(screen.getByRole('region', { name: 'Ta main 2' }).getAttribute('aria-current')).toBe('true');
  clic('Rester');
  expect(screen.getByRole('status').textContent).toBe('Bilan : +3 jetons.');
  expect(p.store.getState().casino.jetons).toBe(1003);
  expect(screen.getByText('Croupier Rocket · 26')).toBeTruthy();
});
it('propose l’assurance seulement face à un As, avant tout autre choix', () => {
  const p = preparer(true, true, sabotDe('10-S', 'A-D', '8-H', 'K-C'));
  render(<PageCasino store={p.store} retour={vi.fn()} />);
  clic('Blackjack'); fireEvent.change(screen.getByLabelText('Mise'), { target: { value: '2' } }); clic('Distribuer');
  expect(screen.getByRole('status').textContent).toBe('Le croupier montre un As. Assurance ?');
  expect(screen.queryByRole('button', { name: 'Tirer' })).toBeNull();
  expect((screen.getByRole('button', { name: 'Sans assurance' }) as HTMLButtonElement).disabled).toBe(false);
  clic('Assurance');
  expect(screen.getByRole('status').textContent).toBe('Le croupier a un blackjack. Perdu. Assurance payée ×2.');
  expect(p.store.getState().casino.jetons).toBe(1000);
  expect(screen.getByText('Croupier Rocket · 21')).toBeTruthy();
});
it('ouvre le casino depuis la Carte puis rend le focus à son entrée', () => {
  const { store } = preparer(true);
  const ancien = storeJeu.getState(); storeJeu.setState(store.getState());
  try {
    render(<PageCarte quandArrive={vi.fn()} />);
    fireEvent.click(screen.getAllByRole('button', { name: /Céladopole/ }).at(-1)!); clic('Casino'); act(() => { vi.advanceTimersByTime(10_000); });
    expect(screen.getByRole('heading', { name: 'Casino' })).toBeTruthy();
    clic('Retour à la Carte'); expect(document.activeElement).toBe(screen.getAllByRole('button', { name: /Céladopole/ }).at(-1));
  } finally { storeJeu.setState(ancien); }
});
