import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { chargerEvenements } from '../core/evenements';
import { kanto } from '../core/regions';
import { creerGestionnaire, creerStockageMemoire, type DonneesRegion } from '../core/sauvegarde';
import { creerStoreJeu, type StoreJeu } from './store';
import { surPremiereEntreeCasino } from './store-casino';

const stores: StoreJeu[] = [];
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  stores.forEach(store => store.getState().arreter());
  stores.length = 0;
  vi.useRealTimers();
});

function preparer(modifier: (region: DonneesRegion) => DonneesRegion = region => region) {
  const stockage = creerStockageMemoire();
  const horloge = creerHorlogeSimulee();
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: () => 'test' });
  gestionnaire.creerPartie('Test', 'kanto.bourg-palette');
  const lire = () => gestionnaire.chargerRegion('test', 'kanto')!.donnees;
  gestionnaire.ecrireRegion('test', 'kanto', modifier({ ...lire(), jetons: 30, bossVaincus: ['kanto.tour-pokemon'] }));
  const ouvrir = () => {
    const store = creerStoreJeu({ stockage, horloge, alea: () => 0, genererId: () => 'id',
      evenements: chargerEvenements({ test: { version: 1, evenements: [] } }, kanto) });
    stores.push(store);
    store.getState().demarrer();
    expect(store.getState().erreur).toBeNull();
    return store;
  };
  return { ouvrir, lire };
}

it('affiche la pastille tant que le casino est ouvert et jamais visité, puis la retire à la première entrée', () => {
  const p = preparer();
  const store = p.ouvrir();
  expect(store.getState().casino.acces.ouvert).toBe(true);
  expect(store.getState().casino.nouveau).toBe(true);
  expect(store.getState().entrerAuCasino()).toEqual({ offerts: 100 });
  expect(store.getState().casino.nouveau).toBe(false);
  expect(p.ouvrir().getState().casino.nouveau).toBe(false);
});

it('n’affiche aucune pastille et ne donne rien tant que le casino est fermé', () => {
  const p = preparer(region => ({ ...region, bossVaincus: [] }));
  const store = p.ouvrir();
  expect(store.getState().casino.acces.ouvert).toBe(false);
  expect(store.getState().casino.nouveau).toBe(false);
  expect(store.getState().entrerAuCasino()).toEqual({ offerts: 0 });
  expect(p.lire()).toMatchObject({ jetons: 30 });
  expect(p.lire()).not.toHaveProperty('casinoVu');
});

it('donne les jetons une seule fois, sauvegardés, même après rechargement', () => {
  const p = preparer();
  const store = p.ouvrir();
  expect(store.getState().entrerAuCasino().offerts).toBe(100);
  expect(store.getState().casino.jetons).toBe(130);
  expect(p.lire()).toMatchObject({ jetons: 130, casinoVu: true });
  expect(store.getState().entrerAuCasino().offerts).toBe(0);
  expect(store.getState().casino.jetons).toBe(130);
  store.getState().arreter();
  const reprise = p.ouvrir();
  expect(reprise.getState().casino.jetons).toBe(130);
  expect(reprise.getState().entrerAuCasino().offerts).toBe(0);
  expect(reprise.getState().casino.jetons).toBe(130);
  expect(p.lire().jetons).toBe(130);
});

it('une ancienne sauvegarde sans casinoVu, avec des jetons, reçoit quand même le cadeau à sa première entrée', () => {
  const p = preparer(region => ({ ...region, jetons: 5000 }));
  expect(p.lire()).not.toHaveProperty('casinoVu');
  const store = p.ouvrir();
  expect(store.getState().casino.nouveau).toBe(true);
  expect(store.getState().entrerAuCasino().offerts).toBe(100);
  expect(store.getState().casino.jetons).toBe(5100);
});

it('annonce la première entrée au crochet du tuto, une seule fois', () => {
  const p = preparer();
  const store = p.ouvrir();
  const ecouteur = vi.fn();
  const retirer = surPremiereEntreeCasino(ecouteur);
  store.getState().entrerAuCasino();
  store.getState().entrerAuCasino();
  expect(ecouteur).toHaveBeenCalledTimes(1);
  expect(ecouteur).toHaveBeenCalledWith(100);
  retirer();
});

it('un écouteur qui échoue ne gêne ni le cadeau ni la sauvegarde', () => {
  const p = preparer();
  const store = p.ouvrir();
  const retirer = surPremiereEntreeCasino(() => { throw new Error('tuto cassé'); });
  expect(store.getState().entrerAuCasino().offerts).toBe(100);
  expect(p.lire()).toMatchObject({ jetons: 130, casinoVu: true });
  retirer();
});
