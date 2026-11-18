import { afterEach, expect, it } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { chargerEvenements } from '../core/evenements';
import { kanto } from '../core/regions';
import { creerGestionnaire, creerStockageMemoire } from '../core/sauvegarde';
import { creerStoreJeu, type StoreJeu } from './store';

const stores: StoreJeu[] = [];
afterEach(() => { stores.forEach(s => s.getState().arreter()); stores.length = 0; });

function preparer(zoneId: string, ouvert: boolean, vaincus = ouvert ? ['kanto.tour-pokemon'] : []) {
  const stockage = creerStockageMemoire();
  const horloge = creerHorlogeSimulee();
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: () => 'test' });
  gestionnaire.creerPartie('Test', zoneId);
  const region = gestionnaire.chargerRegion('test', 'kanto')!.donnees;
  gestionnaire.ecrireRegion('test', 'kanto', { ...region, zoneId,
    bossVaincus: vaincus,
    evenementsJoues: ['kanto.intro'], starterId: 1 });
  const store = creerStoreJeu({ stockage, horloge, alea: () => 0.5, genererId: () => 'id',
    evenements: chargerEvenements({ test: { version: 1, evenements: [] } }, kanto) });
  stores.push(store);
  store.getState().demarrer();
  expect(store.getState().erreur).toBeNull();
  return store;
}

it.each([true, false])('intercale le centre selon son accès : %s', ouvert => {
  const arene = preparer('kanto.arene-de-celadopole', ouvert).getState();
  const centrale = preparer('kanto.centrale', ouvert).getState();
  expect(arene.centre.acces.ouvert).toBe(ouvert);
  expect(arene.zoneSuivante?.id).toBe(ouvert ? 'centre-commercial' : 'kanto.centrale');
  expect(centrale.zonePrecedente?.id).toBe(ouvert ? 'centre-commercial' : 'kanto.arene-de-celadopole');
  expect(arene.zoneSuivante?.lieu).toBe(ouvert ? 'centre-commercial' : undefined);
  expect(centrale.zonePrecedente?.lieu).toBe(ouvert ? 'centre-commercial' : undefined);
  expect(arene.centreVoisines.precedente?.id).toBe('kanto.arene-de-celadopole');
  expect(arene.centreVoisines.suivante?.id).toBe('kanto.centrale');
});

it.each([true, false])('demande le centre sans changer de zone ni sauvegarder : %s', ouvert => {
  const store = preparer('kanto.arene-de-celadopole', ouvert);
  const avant = store.getState();
  avant.allerVers('centre-commercial');
  expect(store.getState().versCentre).toBe(ouvert ? 1 : 0);
  expect(store.getState().zone).toEqual(avant.zone);
  if (ouvert) {
    store.getState().allerVers('centre-commercial');
    expect(store.getState().versCentre).toBe(2);
  }
});

it("garde en mémoire les zones où le joueur est entré, même après un retour en arrière", () => {
  const store = preparer('kanto.route-1', false, ['kanto.route-1']);
  const suivante = store.getState().zoneSuivante!;
  expect(store.getState().zonesAtteintes).not.toContain(suivante.id);
  store.getState().allerVers(suivante.id);
  store.getState().allerVers('kanto.route-1');
  expect(store.getState().zoneSuivante?.id).toBe(suivante.id);
  expect(store.getState().zonesAtteintes).toEqual(expect.arrayContaining(['kanto.route-1', suivante.id]));
});