import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { chargerEvenements } from '../core/evenements';
import { kanto } from '../core/regions';
import { creerGestionnaire, creerStockageMemoire, type DonneesRegion, type PokemonPossede } from '../core/sauvegarde';
import { creerStoreJeu, type StoreJeu } from './store';
import { surPremiereEntreePension } from './store-pension';

const stores: StoreJeu[] = [];
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  stores.forEach(store => store.getState().arreter());
  stores.length = 0;
  vi.useRealTimers();
});

const pokemon = (uid: string, numero = 25): PokemonPossede => ({
  uid, numero, sexe: 'femelle', niveau: 10, xp: 0, shiny: false, bonheur: 0, pierreEternelle: false, calcium: 0, favori: false,
});

function preparer(modifier: (region: DonneesRegion) => DonneesRegion = region => region) {
  const stockage = creerStockageMemoire();
  const horloge = creerHorlogeSimulee();
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: () => 'test' });
  gestionnaire.creerPartie('Test', 'kanto.bourg-palette');
  const lire = () => gestionnaire.chargerRegion('test', 'kanto')!.donnees;
  gestionnaire.ecrireRegion('test', 'kanto', modifier({ ...lire(), bossVaincus: ['kanto.tour-pokemon'] }));
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

it('affiche la pastille tant que la pension est ouverte et jamais visitée, puis la retire à la première entrée', () => {
  const p = preparer();
  const store = p.ouvrir();
  expect(store.getState().pension.acces.ouvert).toBe(true);
  expect(store.getState().pension.nouveau).toBe(true);
  store.getState().entrerALaPension();
  expect(store.getState().pension.nouveau).toBe(false);
  expect(p.lire()).toMatchObject({ pensionVue: true });
  expect(p.ouvrir().getState().pension.nouveau).toBe(false);
});

it('n’affiche aucune pastille et ne sauvegarde rien tant que la pension est fermée', () => {
  const p = preparer(region => ({ ...region, bossVaincus: [] }));
  const store = p.ouvrir();
  expect(store.getState().pension.acces.ouvert).toBe(false);
  expect(store.getState().pension.nouveau).toBe(false);
  store.getState().entrerALaPension();
  expect(p.lire()).not.toHaveProperty('pensionVue');
});

it('une pension déjà utilisée (parents, œufs, espèces écloses) n’affiche pas la pastille dans une ancienne sauvegarde', () => {
  const avecParent = preparer(region => ({ ...region, pension: { ...region.pension, parents: [pokemon('a')] } }));
  expect(avecParent.ouvrir().getState().pension.nouveau).toBe(false);
  const avecEspeces = preparer(region => ({ ...region, especesEcloses: [25] }));
  expect(avecEspeces.ouvrir().getState().pension.nouveau).toBe(false);
});

it('signale la première entrée au crochet du mini-tuto, une seule fois, et jamais si la pension a déjà servi', () => {
  const p = preparer();
  const store = p.ouvrir();
  const ecouteur = vi.fn();
  const retirer = surPremiereEntreePension(ecouteur);
  store.getState().entrerALaPension();
  store.getState().entrerALaPension();
  expect(ecouteur).toHaveBeenCalledTimes(1);
  const servie = preparer(region => ({ ...region, pension: { ...region.pension, parents: [pokemon('a')] } }));
  servie.ouvrir().getState().entrerALaPension();
  expect(ecouteur).toHaveBeenCalledTimes(1);
  retirer();
});

it('un écouteur du tuto qui échoue ne gêne pas l’entrée', () => {
  const p = preparer();
  const store = p.ouvrir();
  const retirer = surPremiereEntreePension(() => { throw new Error('tuto cassé'); });
  store.getState().entrerALaPension();
  expect(p.lire()).toMatchObject({ pensionVue: true });
  retirer();
});
