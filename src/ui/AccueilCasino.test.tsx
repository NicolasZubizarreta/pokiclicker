// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { chargerEvenements } from '../core/evenements';
import { kanto } from '../core/regions';
import { creerGestionnaire, creerStockageMemoire } from '../core/sauvegarde';
import { AccueilCasino } from './AccueilCasino';
import { AnnonceDeblocage } from './AnnonceDeblocage';
import { creerStoreJeu, storeJeu, type StoreJeu } from './store';

const stores: StoreJeu[] = [];
afterEach(() => { cleanup(); stores.forEach(s => s.getState().arreter()); stores.length = 0; vi.restoreAllMocks(); vi.useRealTimers(); vi.unstubAllGlobals(); });

function preparer(ouvert = true) {
  vi.useFakeTimers();
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  const stockage = creerStockageMemoire(), horloge = creerHorlogeSimulee();
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: () => 'test' });
  gestionnaire.creerPartie('Test', 'kanto.bourg-palette');
  const region = gestionnaire.chargerRegion('test', 'kanto')!.donnees;
  gestionnaire.ecrireRegion('test', 'kanto', { ...region, argent: 2000, jetons: 20, bossVaincus: ouvert ? ['kanto.tour-pokemon'] : [] });
  const store = creerStoreJeu({ stockage, horloge, alea: () => .999, genererId: () => 'achat',
    evenements: chargerEvenements({ test: { version: 1, evenements: [] } }, kanto) });
  stores.push(store); store.getState().demarrer();
  return store;
}

it('offre les jetons à la première ouverture, avec le message de bienvenue', () => {
  const store = preparer();
  render(<AccueilCasino store={store} retour={vi.fn()} />);
  expect(screen.getByText('100 jetons offerts pour ta première visite !')).toBeTruthy();
  expect(store.getState().casino.jetons).toBe(120);
  expect(screen.getByText('120 jetons')).toBeTruthy();
  expect(store.getState().casino.nouveau).toBe(false);
});

it('ne redonne rien ni ne répète le message à la deuxième ouverture', () => {
  const store = preparer();
  const premiere = render(<AccueilCasino store={store} retour={vi.fn()} />);
  premiere.unmount();
  render(<AccueilCasino store={store} retour={vi.fn()} />);
  expect(screen.queryByText(/offerts pour ta première visite/)).toBeNull();
  expect(store.getState().casino.jetons).toBe(120);
});

it('ne donne rien quand le casino est fermé', () => {
  const store = preparer(false);
  render(<AccueilCasino store={store} retour={vi.fn()} />);
  expect(screen.queryByText(/offerts pour ta première visite/)).toBeNull();
  expect(store.getState().casino.jetons).toBe(20);
});

it('l’annonce « carte » porte « Y aller » et « Fermer », et rien d’autre pour une annonce ordinaire', () => {
  const fermer = vi.fn();
  storeJeu.setState({ deblocage: 'Casino débloqué !', deblocageCarte: { libelle: 'Y aller', cible: 'casino' }, fermerDeblocage: fermer });
  const quandAller = vi.fn();
  const { rerender } = render(<AnnonceDeblocage quandAller={quandAller} />);
  fireEvent.click(screen.getByRole('button', { name: 'Y aller' }));
  expect(fermer).toHaveBeenCalledTimes(1);
  expect(quandAller).toHaveBeenCalledWith('casino');
  fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
  expect(fermer).toHaveBeenCalledTimes(2);
  expect(quandAller).toHaveBeenCalledTimes(1);
  storeJeu.setState({ deblocage: 'Pension débloquée !', deblocageCarte: null });
  rerender(<AnnonceDeblocage quandAller={quandAller} />);
  expect(screen.queryByRole('button')).toBeNull();
  storeJeu.setState({ deblocage: null, deblocageCarte: null });
});
