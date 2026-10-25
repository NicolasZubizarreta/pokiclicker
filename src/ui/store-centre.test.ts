import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { chargerEvenements } from '../core/evenements';
import { kanto } from '../core/regions';
import { reglages } from '../core/reglages';
import { compteInitial, creerGestionnaire, creerStockageMemoire, type DonneesRegion } from '../core/sauvegarde';
import { creerStoreJeu, type StoreJeu } from './store';
import { afficherCentre } from './store-boutique';

const ordreV1 = ['xAttack', 'xSpecial', 'pokeDoll', 'everstone', 'calcium', 'fireStone',
  'waterStone', 'leafStone', 'thunderStone', 'moonStone', 'shinyToken'];
const stores: StoreJeu[] = [];
beforeEach(() => vi.useFakeTimers());
afterEach(() => { stores.splice(0).forEach(store => store.getState().arreter()); vi.useRealTimers(); });

function preparer(modifier: (region: DonneesRegion) => DonneesRegion = region => region) {
  const stockage = creerStockageMemoire();
  const horloge = creerHorlogeSimulee();
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: () => 'test' });
  const compte = compteInitial();
  gestionnaire.ecrireCompte({ ...compte, preferences: { ...compte.preferences, autoAttaque: false,
    arretAuto: { ...reglages.depart.preferences.arretAuto, actif: false } } });
  gestionnaire.creerPartie('Test', 'kanto.bourg-palette');
  const region = modifier({ ...gestionnaire.chargerRegion('test', 'kanto')!.donnees,
    argent: 100000, bossVaincus: ['kanto.tour-pokemon'], badges: ['roche', 'cascade', 'foudre'],
    inventaire: { xAttack: 2 } });
  gestionnaire.ecrireRegion('test', 'kanto', region);
  const ouvrir = () => {
    const store = creerStoreJeu({ stockage, horloge, alea: () => 0.5, genererId: () => 'test',
      evenements: chargerEvenements({ test: { version: 1, evenements: [] } }, kanto) });
    stores.push(store);
    store.getState().demarrer();
    expect(store.getState().erreur).toBeNull();
    return store;
  };
  return { store: ouvrir(), ouvrir, region, horloge };
}

it('ferme le Centre en zone 10 avec la raison et refuse tout achat sans mutation', () => {
  const { store } = preparer(region => ({ ...region, zoneId: 'kanto.tour-pokemon',
    bossVaincus: kanto.zones.filter(zone => zone.ancienId < 10).map(zone => zone.id) }));
  const avant = store.getState();
  expect(avant.centre).toEqual({ acces: { ouvert: false, raison: 'Bats le boss de Tour Pokémon.' }, objets: [] });
  expect(avant.acheter('xAttack', 1)).toBe('Objet indisponible.');
  expect(store.getState()).toBe(avant);
});

it('ouvre les 11 objets dans l’ordre V1 et calcule Attaque + à 8 625 avec trois badges', () => {
  const { store } = preparer();
  expect(store.getState().centre.acces).toEqual({ ouvert: true, raison: null });
  expect(store.getState().centre.objets.map(objet => objet.id)).toEqual(ordreV1);
  expect(store.getState().centre.objets[0]).toMatchObject({ nom: 'Attaque +', prix: 8625,
    stock: 2, possede: false, unique: false, abordable: true });
});

it('achète, annonce et conserve argent et stock dans un nouveau store avec le même stockage', () => {
  const { store, ouvrir } = preparer();
  const avant = store.getState().centre;
  expect(store.getState().acheter('xAttack', 1)).toBeNull();
  expect(store.getState().centre).not.toBe(avant);
  expect(store.getState().centre.objets[0]!.stock).toBe(3);
  expect(store.getState().argent).toBe(100000 - 8625);
  expect(store.getState().annonce).toBe(`Attaque + ×1 acheté. ${(8625).toLocaleString('fr-FR')} pièces dépensées.`);
  store.getState().arreter();
  const recharge = ouvrir().getState();
  expect(recharge.centre.objets[0]!.stock).toBe(3);
  expect(recharge.argent).toBe(100000 - 8625);
  expect(avant.objets[0]!.stock).toBe(2);
});

it('refuse sans argent et conserve le même état', () => {
  const { store } = preparer(region => ({ ...region, argent: 8624 }));
  const avant = store.getState();
  expect(avant.centre.objets[0]!.abordable).toBe(false);
  expect(avant.acheter('xAttack', 1)).toBe("Pas assez d'argent.");
  expect(store.getState()).toBe(avant);
});

it('garde la référence du Centre sans changement et ne modifie pas la région', () => {
  const { store, region, horloge } = preparer();
  const copie = structuredClone(region);
  const centre = afficherCentre(region, null);
  expect(afficherCentre(region, centre)).toBe(centre);
  expect(region).toEqual(copie);
  const precedent = store.getState().centre;
  horloge.avancer(100);
  store.getState().tick();
  expect(store.getState().centre).toBe(precedent);
});
