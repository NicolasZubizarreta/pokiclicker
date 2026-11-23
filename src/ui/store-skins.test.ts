import { afterEach, expect, it } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { compteInitial, creerGestionnaire, creerStockageMemoire } from '../core/sauvegarde';
import { creerStoreJeu, type StoreJeu } from './store';

const stores: StoreJeu[] = [];
afterEach(() => { stores.forEach(s => s.getState().arreter()); stores.length = 0; });
function preparer(diamants: number) {
  const stockage = creerStockageMemoire();
  const horloge = creerHorlogeSimulee();
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: () => 'sk' });
  gestionnaire.ecrireCompte({ ...compteInitial(), diamants });
  gestionnaire.creerPartie('Nicolas', 'kanto.bourg-palette');
  const ouvrir = () => {
    const store = creerStoreJeu({ stockage, horloge, alea: () => .1, genererId: () => 'sk' });
    stores.push(store); store.getState().demarrer();
    return store;
  };
  return { gestionnaire, ouvrir };
}

it('achète un skin avec les diamants du compte, l\'équipe, et le garde après rechargement', () => {
  const { gestionnaire, ouvrir } = preparer(100);
  const store = ouvrir();
  expect(store.getState().acheterSkin('scene-ocean')).toBeNull();
  expect(store.getState().compte).toMatchObject({ diamants: 0, skins: ['scene-ocean'], skinsEquipes: { 'fond-scene': 'scene-ocean' } });
  expect(gestionnaire.chargerCompte()?.donnees.diamants).toBe(0);
  store.getState().arreter();
  expect(ouvrir().getState().compte.skinsEquipes).toEqual({ 'fond-scene': 'scene-ocean' });
});
it('refuse sans assez de diamants et ne change rien', () => {
  const { gestionnaire, ouvrir } = preparer(10);
  const store = ouvrir();
  expect(store.getState().acheterSkin('scene-ocean')).toMatch(/90 diamants/);
  expect(store.getState().compte).toMatchObject({ diamants: 10, skins: [] });
  expect(gestionnaire.chargerCompte()?.donnees.skins).toEqual([]);
});
it('équipe, change et retire un skin possédé', () => {
  const { ouvrir } = preparer(200);
  const store = ouvrir();
  store.getState().acheterSkin('balle-or'); store.getState().acheterSkin('balle-glace');
  expect(store.getState().compte.skinsEquipes).toEqual({ 'cadre-balle': 'balle-or' });
  expect(store.getState().equiperSkin('cadre-balle', 'balle-glace')).toBeNull();
  expect(store.getState().compte.skinsEquipes).toEqual({ 'cadre-balle': 'balle-glace' });
  expect(store.getState().equiperSkin('cadre-balle', null)).toBeNull();
  expect(store.getState().compte.skinsEquipes).toEqual({});
  expect(store.getState().equiperSkin('cadre-profil', 'profil-or')).toMatch(/pas ce skin|ne va pas/);
});
