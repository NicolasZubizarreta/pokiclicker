// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { creerGestionnaire, creerStockageMemoire } from '../core/sauvegarde';
import { creerStoreJeu } from './store';
import type { StoreJeu } from './store';
import { ERREUR_CONFLIT } from './persistance';
import { equipeDeDepart } from './equipe-de-depart';
import { cheminDecor } from './precharger';
import { kanto } from '../core/regions';

const stores: StoreJeu[] = [];
beforeEach(() => vi.useFakeTimers());
afterEach(() => { stores.forEach(store => store.getState().arreter()); stores.length = 0; vi.useRealTimers(); });
function preparer(stockage = creerStockageMemoire()) {
  const horloge = creerHorlogeSimulee();
  const store = creerStoreJeu({ horloge, stockage, alea: () => .1, genererId: () => 'test' });
  stores.push(store);
  store.getState().demarrer();
  const avancer = (ms = 100) => { horloge.avancer(ms); store.getState().tick(); };
  return { store, horloge, stockage, avancer };
}

it('convertit le décor des données vers son fichier local', () => {
  expect(cheminDecor(kanto.zone('kanto.route-1'))).toBe('img/decors/route-1.webp');
});
it('applique le clic immédiatement mais publie les PV au prochain pas', () => {
  const { store, avancer } = preparer();
  const pv = store.getState().pv;
  const animation = vi.fn();
  store.abonnerDegats(animation);
  store.getState().attaquer();
  expect(animation).toHaveBeenCalledTimes(1);
  expect(store.getState().pv).toBe(pv);
  avancer();
  expect(store.getState().pv).toBeCloseTo(pv - 5 - store.getState().dps / 10);
});
it('accepte douze clics par seconde et refuse le treizième', () => {
  const { store, avancer } = preparer();
  const animation = vi.fn();
  store.abonnerDegats(animation);
  for (let i = 0; i < 13; i++) store.getState().attaquer();
  expect(animation).toHaveBeenCalledTimes(12);
  avancer(1000);
  store.getState().attaquer();
  expect(animation).toHaveBeenCalledTimes(13);
});
it('ne dépasse pas 100 notifications sur 1 000 ticks en dix secondes, même avec des clics', () => {
  const { store, avancer } = preparer();
  const notification = vi.fn();
  store.subscribe(notification);
  for (let i = 0; i < 1000; i++) { store.getState().attaquer(); avancer(10); }
  expect(notification.mock.calls.length).toBeLessThanOrEqual(101);
  expect(notification.mock.calls.length).toBe(100);
});
it('annonce une seule fois la fin, inscrit le boss et sauvegarde immédiatement', () => {
  const { store, avancer, stockage } = preparer();
  const ecrire = vi.spyOn(stockage, 'ecrire');
  let annonces = 0;
  store.subscribe((etat, avant) => { if (etat.finZone !== avant.finZone) annonces++; });
  for (let i = 0; i < 2000; i++) avancer();
  expect(annonces).toBe(1);
  expect(store.getState().finZone).toBe('Route 1 terminée !');
  expect(store.getState().suite?.raison).toBe('La suite arrive bientôt.');
  const region = JSON.parse(stockage.lire('pokiclicker:region:test:kanto')!).donnees;
  expect(region.bossVaincus).toEqual(['kanto.route-1']);
  expect(region.etape).toBe(1);
  expect(ecrire).toHaveBeenCalledTimes(2);
});
it('restaure la zone, l’étape et toute l’équipe avec un nouvel ennemi', () => {
  const premier = preparer();
  while (premier.store.getState().etape < 4) premier.avancer();
  premier.avancer();
  premier.store.getState().fermer();
  premier.store.getState().arreter();
  const second = preparer(premier.stockage);
  expect(second.store.getState().zone?.id).toBe(premier.store.getState().zone?.id);
  expect(second.store.getState().etape).toBe(4);
  expect(second.store.getState().equipe).toEqual(premier.store.getState().equipe);
  expect(second.store.getState().equipe.filter(Boolean).map(m => m!.pokemon)).toEqual(equipeDeDepart());
  expect(second.store.getState().pv).toBe(second.store.getState().ennemi?.pvMax);
});
it('n’écrit rien pour les seuls PV modifiés et sauvegarde un changement après trente secondes', () => {
  const { store, stockage, avancer } = preparer();
  const ecrire = vi.spyOn(stockage, 'ecrire');
  store.getState().attaquer();
  store.getState().fermer();
  expect(ecrire).not.toHaveBeenCalled();
  while (store.getState().etape < 2) avancer();
  vi.advanceTimersByTime(29999);
  expect(ecrire).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(ecrire).toHaveBeenCalledTimes(2);
  store.getState().fermer();
  expect(ecrire).toHaveBeenCalledTimes(2);
});
it.each(['pagehide', 'visibilitychange'])('enregistre à %s et retire les écouteurs à l’arrêt', evenement => {
  const { store, stockage, avancer } = preparer();
  while (store.getState().etape < 2) avancer();
  const ecrire = vi.spyOn(stockage, 'ecrire');
  if (evenement === 'pagehide') window.dispatchEvent(new Event(evenement));
  else {
    const visible = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    document.dispatchEvent(new Event(evenement));
    visible.mockRestore();
  }
  expect(ecrire).toHaveBeenCalledTimes(2);
  while (store.getState().etape < 3) avancer();
  store.getState().arreter();
  window.dispatchEvent(new Event('pagehide'));
  vi.advanceTimersByTime(60000);
  expect(ecrire).toHaveBeenCalledTimes(2);
  expect(vi.getTimerCount()).toBe(0);
});
it('bloque toute écriture après un conflit avec une autre fenêtre', () => {
  const { store, stockage, horloge, avancer } = preparer();
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: () => 'autre' });
  const region = gestionnaire.chargerRegion('test', 'kanto')!;
  gestionnaire.ecrireRegion('test', 'kanto', { ...region.donnees, etape: 5 });
  const intact = stockage.lire('pokiclicker:region:test:kanto');
  const ecrire = vi.spyOn(stockage, 'ecrire');
  while (store.getState().etape < 2) avancer();
  store.getState().fermer();
  avancer();
  expect(store.getState().erreur).toBe(ERREUR_CONFLIT);
  store.getState().fermer();
  vi.advanceTimersByTime(30000);
  expect(ecrire).not.toHaveBeenCalled();
  expect(stockage.lire('pokiclicker:region:test:kanto')).toBe(intact);
});
it.each(['corrompue', 'récente', 'bloquée'])('préserve une sauvegarde %s', cas => {
  const premier = preparer();
  premier.store.getState().arreter();
  const cle = 'pokiclicker:region:test:kanto';
  if (cas === 'corrompue') premier.stockage.ecrire(cle, '{ sauvegarde abîmée');
  if (cas === 'récente') {
    const enveloppe = JSON.parse(premier.stockage.lire(cle)!);
    premier.stockage.ecrire(cle, JSON.stringify({ ...enveloppe, version: 999 }));
  }
  const avant = premier.stockage.lire(cle);
  const ecrire = vi.spyOn(premier.stockage, 'ecrire');
  const lire = cas === 'bloquée' ? vi.spyOn(premier.stockage, 'lire').mockImplementation(() => { throw new Error('stockage bloqué'); }) : null;
  const second = preparer(premier.stockage);
  expect(second.store.getState().erreurChargement).toBe(true);
  second.store.getState().fermer();
  expect(ecrire).not.toHaveBeenCalled();
  lire?.mockRestore();
  expect(premier.stockage.lire(cle)).toBe(avant);
});
