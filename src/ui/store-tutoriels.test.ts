import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { chargerEvenements } from '../core/evenements';
import { kanto } from '../core/regions';
import { compteInitial, creerGestionnaire, creerStockageMemoire } from '../core/sauvegarde';
import { creerStoreJeu, type StoreJeu } from './store';

const stores: StoreJeu[] = [];
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  stores.forEach(store => store.getState().arreter());
  stores.length = 0;
  vi.useRealTimers();
});

function preparer(eliminations: number, tutosVus?: string[]) {
  const stockage = creerStockageMemoire();
  const horloge = creerHorlogeSimulee();
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: () => 'test' });
  const compte = compteInitial();
  gestionnaire.ecrireCompte({ ...compte, preferences: { ...compte.preferences, autoAttaque: false } });
  gestionnaire.creerPartie('Test', 'kanto.bourg-palette');
  const lire = () => gestionnaire.chargerRegion('test', 'kanto')!.donnees;
  const region = lire();
  gestionnaire.ecrireRegion('test', 'kanto', { ...region, jetons: 0,
    statistiques: { ...region.statistiques, eliminations }, ...(tutosVus === undefined ? {} : { tutosVus }) });
  const store = creerStoreJeu({ stockage, horloge, alea: () => 0, genererId: () => 'id',
    evenements: chargerEvenements({ test: { version: 1, evenements: [] } }, kanto) });
  stores.push(store);
  store.getState().demarrer();
  expect(store.getState().erreur).toBeNull();
  return { store, lire };
}

it('migre une sauvegarde déjà avancée sans rejouer la Route 1', () => {
  expect(preparer(1).store.getState().tutosVus).toContain('route-1');
});

it('laisse les tutoriels disponibles dans une sauvegarde neuve et enregistre les vues', () => {
  const { store, lire } = preparer(0);
  expect(store.getState().tutosVus).toEqual([]);
  store.getState().marquerTutoVu('pc');
  expect(store.getState().tutosVus).toEqual(['pc']);
  expect(lire().tutosVus).toEqual(['pc']);
  store.getState().marquerTutoVu('pc');
  expect(lire().tutosVus).toEqual(['pc']);
});

it('préserve une liste de tutoriels déjà sauvegardée', () => {
  expect(preparer(1, ['casino']).store.getState().tutosVus).toEqual(['casino']);
});
