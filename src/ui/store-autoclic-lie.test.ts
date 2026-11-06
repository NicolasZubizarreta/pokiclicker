// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { creerGestionnaire, creerStockageMemoire } from '../core/sauvegarde';
import { creerStoreJeu, type StoreJeu } from './store';

const stores: StoreJeu[] = [];
beforeEach(() => vi.useFakeTimers());
afterEach(() => { stores.forEach(s => s.getState().arreter()); stores.length = 0; vi.useRealTimers(); });
function preparer(possede = true) {
  const stockage = creerStockageMemoire();
  const horloge = creerHorlogeSimulee();
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: () => 'partie' });
  gestionnaire.creerPartie('Auto-clic');
  const region = gestionnaire.chargerRegion('partie', 'kanto')!.donnees;
  gestionnaire.ecrireRegion('partie', 'kanto', { ...region,
    equipe: [{ uid: 'initial', numero: 1, niveau: 5, xp: 0, shiny: false,
      sexe: 'male', bonheur: 0, calcium: 0, pierreEternelle: false, favori: false }],
    ameliorations: possede ? ['leftovers'] : [] });
  const lancer = () => {
    const store = creerStoreJeu({ stockage, horloge, alea: () => .1, genererId: () => 'id' });
    stores.push(store);
    store.getState().demarrer();
    return store;
  };
  return { store: lancer(), lancer };
}

it('lie les deux bascules avec Restes', () => {
  const { store } = preparer();
  if (store.getState().autoAttaque) store.getState().basculerAutoAttaque();
  store.getState().basculerAutoAttaque();
  expect(store.getState().autoClic.actif).toBe(true);
  store.getState().basculerAutoAttaque();
  expect(store.getState().autoClic.actif).toBe(false);
});

it('ne donne pas auto-clic sans Restes', () => {
  const { store } = preparer(false);
  store.getState().basculerAutoAttaque();
  expect(store.getState().autoClic.actif).toBe(false);
});

it('delie, eteint puis laisse le bouton PC independant', () => {
  const { store } = preparer();
  if (!store.getState().autoClic.actif) store.getState().basculerAutoClic();
  store.getState().reglerAutoClicLie(false);
  expect(store.getState().autoClic.actif).toBe(false);
  store.getState().basculerAutoClic();
  store.getState().basculerAutoAttaque();
  expect(store.getState().autoClic.actif).toBe(true);
  store.getState().basculerAutoAttaque();
  expect(store.getState().autoClic.actif).toBe(true);
});

it('rallume au lien avec attaque auto active', () => {
  const { store } = preparer();
  store.getState().reglerAutoClicLie(false);
  if (!store.getState().autoAttaque) store.getState().basculerAutoAttaque();
  store.getState().reglerAutoClicLie(true);
  expect(store.getState().autoClic.actif).toBe(true);
});

it('restaure auto-clic au rechargement avec lien et attaque auto active', () => {
  const { store, lancer } = preparer();
  store.getState().reglerArretAuto({ actif: false });
  if (!store.getState().autoAttaque) store.getState().basculerAutoAttaque();
  store.getState().arreter();
  expect(lancer().getState().autoClic.actif).toBe(true);
});

it("l'arrêt auto à la reprise garde l'auto-clic coupé", () => {
  const { store, lancer } = preparer();
  store.getState().reglerArretAuto({ actif: true, nouveau: true });
  if (!store.getState().autoAttaque) store.getState().basculerAutoAttaque();
  store.getState().arreter();
  const apres = lancer();
  expect(apres.getState().autoClic.actif).toBe(false);
});

it("activer le lien pendant un arrêt auto ne rallume pas l'auto-clic", () => {
  const { store } = preparer();
  store.getState().reglerAutoClicLie(false);
  store.getState().reglerArretAuto({ actif: true, nouveau: true });
  store.getState().reglerAutoClicLie(true);
  expect(store.getState().autoClic.actif).toBe(false);
});
