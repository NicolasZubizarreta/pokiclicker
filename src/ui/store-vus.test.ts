// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { reglages } from '../core/reglages';
import { creerGestionnaire, creerStockageMemoire } from '../core/sauvegarde';
import { creerStoreJeu, type StoreJeu } from './store';

const stores: StoreJeu[] = [];
beforeEach(() => vi.useFakeTimers());
afterEach(() => { stores.forEach(s => s.getState().arreter()); stores.length = 0; vi.useRealTimers(); });
function preparer(boss = false, vus: number[] = []) {
  const stockage = creerStockageMemoire();
  const horloge = creerHorlogeSimulee();
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: () => 'test' });
  const partie = gestionnaire.creerPartie('Vus');
  gestionnaire.ecrirePartie('test', { ...partie.donnees, vus });
  const region = gestionnaire.chargerRegion('test', 'kanto')!.donnees;
  gestionnaire.ecrireRegion('test', 'kanto', { ...region, equipe: [], inventaire: { masterball: 2 },
    ...(boss ? { zoneId: 'kanto.arene-d-argenta', etape: reglages.combat.etapeBoss } : {}) });
  const lancer = () => {
    const store = creerStoreJeu({ stockage, horloge, alea: () => .1, genererId: () => 'prise' });
    stores.push(store);
    store.getState().demarrer();
    return store;
  };
  const store = lancer();
  const avancer = () => { for (let i = 0; i < 10; i++) { horloge.avancer(100); store.getState().tick(); } };
  return { store, lancer, avancer, gestionnaire };
}

it('voit un sauvage sans capture, sans doublon et le conserve au rechargement', () => {
  const { store, lancer, gestionnaire } = preparer();
  const numero = store.getState().ennemi!.numero;
  expect(store.getState().vus).toEqual([numero]);
  expect(store.getState().pokedex).toEqual([]);
  store.getState().allerVers('kanto.route-1');
  expect(store.getState().vus).toEqual([numero]);
  store.getState().arreter();
  expect(lancer().getState().vus).toEqual([numero]);
  expect(gestionnaire.chargerPartie('test')!.donnees.vus).toEqual([numero]);
});

it('ajoute le capturé aux deux listes', () => {
  const { store, avancer } = preparer();
  const numero = store.getState().ennemi!.numero;
  store.getState().capturer('masterball');
  avancer();
  expect(store.getState().pokedex).toContain(numero);
  expect(store.getState().vus).toContain(numero);
});

it('ignore les ennemis de boss', () => {
  const { store } = preparer(true);
  expect(store.getState().ennemi).not.toBeNull();
  expect(store.getState().vus).toEqual([]);
});

it('garde la même progression et le même nombre de capturés avec des vus supplémentaires', () => {
  const sans = preparer().store.getState();
  const avec = preparer(false, [25, 150]).store.getState();
  expect(avec.progression).toEqual(sans.progression);
  expect(avec.pokedex).toEqual(sans.pokedex);
});
