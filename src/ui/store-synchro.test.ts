// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { compteInitial, creerGestionnaire, creerStockageMemoire } from '../core/sauvegarde';
import { reglages } from '../core/reglages';
import { kanto } from '../core/regions';
import { equipeDeDepart } from './equipe-de-depart';
import { creerStoreJeu } from './store';
import type { StoreJeu } from './store';

const stores: StoreJeu[] = [];
beforeEach(() => vi.useFakeTimers());
afterEach(() => { stores.forEach(store => store.getState().arreter()); stores.length = 0; vi.useRealTimers(); });

function preparer(riche = false) {
  const stockage = creerStockageMemoire();
  const horloge = creerHorlogeSimulee();
  const compte = compteInitial();
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: () => 'test' });
  gestionnaire.ecrireCompte({ ...compte,
    preferences: { ...compte.preferences, arretAuto: { ...reglages.depart.preferences.arretAuto, actif: false } } });
  // Partie existante avec l'équipe de départ ; Chen a déjà expliqué le premier boss (sinon le combat se fige sur son dialogue).
  gestionnaire.creerPartie('Partie 1');
  const region = gestionnaire.chargerRegion('test', 'kanto')!.donnees;
  gestionnaire.ecrireRegion('test', 'kanto', { ...region, equipe: equipeDeDepart(),
    ...(riche && { argent: 1_000_000, bossVaincus: kanto.zones.map(zone => zone.id) }),
    evenementsJoues: [...region.evenementsJoues, 'kanto.chen-premier-boss'] });
  const store = creerStoreJeu({ horloge, stockage, alea: () => .1, genererId: () => 'test' });
  stores.push(store);
  store.getState().demarrer();
  const appels: boolean[] = [];
  store.abonnerSauvegarde(fermeture => appels.push(fermeture));
  return { store, horloge, appels, stockage };
}

it('signale la fermeture et le passage en arrière-plan après l’écriture locale', () => {
  const { store, appels } = preparer();
  window.dispatchEvent(new Event('pagehide'));
  expect(appels).toEqual([true]);
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
  document.dispatchEvent(new Event('visibilitychange'));
  expect(appels).toEqual([true, true]);
  expect(store.getState().erreur).toBeNull();
});

it('signale un boss vaincu sans attendre le minuteur', () => {
  const { store, horloge, appels } = preparer();
  for (let i = 0; i < 6000 && !appels.length; i++) {
    store.getState().attaquer(); horloge.avancer(100); store.getState().tick();
  }
  expect(appels).toEqual([false]);
});

it('un abonné qui échoue ne gêne pas le jeu', () => {
  const { store } = preparer();
  store.abonnerSauvegarde(() => { throw new Error('panne'); });
  window.dispatchEvent(new Event('pagehide'));
  expect(store.getState().erreur).toBeNull();
});

it('signale un achat réussi, pas un achat refusé', () => {
  const { store, appels } = preparer(true);
  expect(store.getState().acheter('pokeball', 0)).toBe('Quantité invalide.');
  expect(appels).toEqual([]);
  expect(store.getState().acheter('pokeball', 2)).toBeNull();
  expect(appels).toEqual([false]);
});
