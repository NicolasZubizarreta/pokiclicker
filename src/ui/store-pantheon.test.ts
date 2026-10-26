import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import * as combat from '../core/combat';
import { chargerEvenements } from '../core/evenements';
import { kanto } from '../core/regions';
import { reglages } from '../core/reglages';
import { compteInitial, creerGestionnaire, creerStockageMemoire } from '../core/sauvegarde';
import { creerStoreJeu, type StoreJeu } from './store';

const stores: StoreJeu[] = [];
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  stores.forEach(store => store.getState().arreter());
  stores.length = 0;
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function preparer(ligueGagnee = 0, etape = 10) {
  const stockage = creerStockageMemoire();
  const horloge = creerHorlogeSimulee();
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: () => 'test' });
  const compte = compteInitial();
  gestionnaire.ecrireCompte({ ...compte, preferences: { ...compte.preferences, autoAttaque: false,
    arretAuto: { ...reglages.depart.preferences.arretAuto, actif: false } } });
  gestionnaire.creerPartie('Test', 'kanto.bourg-palette');
  const lire = () => gestionnaire.chargerRegion('test', 'kanto')!.donnees;
  gestionnaire.ecrireRegion('test', 'kanto', { ...lire(), zoneId: 'kanto.ligue-pokemon', etape,
    starterId: 1, ligueGagnee, equipe: [{ uid: 'fort', numero: 6, niveau: 50, xp: 0,
      shiny: true, bonheur: 0, pierreEternelle: false, calcium: 0, sexe: 'male', favori: false }] });
  const evenements = chargerEvenements({ essai: { version: 1, evenements: [] } }, kanto);
  const ouvrir = () => {
    const store = creerStoreJeu({ stockage, horloge, alea: () => .1, genererId: () => 'test', evenements });
    stores.push(store);
    store.getState().demarrer();
    expect(store.getState().erreur).toBeNull();
    return store;
  };
  const store = ouvrir();
  const avancer = (ms: number) => { horloge.avancer(ms); store.getState().tick(); };
  const cliquer = combat.cliquer;
  vi.spyOn(combat, 'cliquer').mockImplementation((etat, limiteur) =>
    cliquer({ ...etat, ennemi: { ...etat.ennemi, pv: 1 } }, limiteur));
  const vaincre = () => { horloge.avancer(100); store.getState().attaquer(); store.getState().tick(); };
  return { store, ouvrir, lire, avancer, vaincre };
}

it.each([0, 1, 4])('ouvre une seule fois le Panthéon après %s victoires, sauvegarde et reprend au Bourg', nombre => {
  const { store, lire, ouvrir, avancer, vaincre } = preparer(nombre);
  expect(store.getState().pantheon).toBeNull();
  vaincre();
  const pantheon = store.getState().pantheon;
  expect(pantheon).toEqual({ ouvert: true, premiereVictoire: nombre === 0,
    equipe: lire().equipe, defiChenEnAttente: false });
  expect(lire().zoneId).toBe('kanto.bourg-palette');
  expect(store.getState().lieu?.id).toBe('kanto.bourg-palette');
  expect(lire().ligueGagnee).toBe(nombre + 1);
  for (let i = 0; i < 20; i++) { avancer(100); store.getState().attaquer(); }
  expect(store.getState().pantheon).toBe(pantheon);
  expect(lire().ligueGagnee).toBe(nombre + 1);
  const reprise = ouvrir();
  expect(reprise.getState().pantheon).toBeNull();
  expect(reprise.getState().lieu?.id).toBe('kanto.bourg-palette');
});

it('n’ouvre pas le Panthéon après une défaite de Ligue', () => {
  const { store, lire, avancer } = preparer(0, 2);
  for (let i = 0; i < 300; i++) avancer(100);
  expect(store.getState().pantheon).toBeNull();
  expect(lire().ligueGagnee).toBe(0);
});

it.each([0, 1])('annonce Johto à la sortie seulement pour la première victoire (%s)', nombre => {
  const { store, vaincre } = preparer(nombre);
  vaincre();
  store.getState().quitterPantheon();
  expect(store.getState().pantheon).toBeNull();
  expect(store.getState().annonce).toBe(nombre === 0 ? 'Johto arrive bientôt !' : null);
  store.getState().quitterPantheon();
  expect(store.getState().annonce).toBe(nombre === 0 ? 'Johto arrive bientôt !' : null);
});

it('lance le défi de Chen une fois à +800 ms avec l’horloge injectée', () => {
  const { store, vaincre, avancer } = preparer();
  vaincre();
  const lancerDefiChen = vi.fn();
  store.setState({ pantheon: { ...store.getState().pantheon!, defiChenEnAttente: true }, lancerDefiChen });
  store.getState().quitterPantheon();
  store.getState().quitterPantheon();
  expect(store.getState().annonce).toBeNull();
  avancer(799);
  expect(lancerDefiChen).not.toHaveBeenCalled();
  avancer(1);
  expect(lancerDefiChen).toHaveBeenCalledTimes(1);
  avancer(1000);
  expect(lancerDefiChen).toHaveBeenCalledTimes(1);
});

it('un rival dans une zone synthétique de type ligue ne compte pas comme la Ligue', () => {
  const { store, lire, vaincre } = preparer();
  const cliquer = combat.cliquer;
  vi.mocked(combat.cliquer).mockImplementationOnce((etat, limiteur) => {
    const resultat = cliquer(etat, limiteur);
    return { ...resultat, zone: { ...resultat.zone, id: 'kanto.route-1', type: 'ligue' },
      evenements: resultat.evenements.map(e => e.type === 'boss-vaincu' ? { ...e, zoneId: 'kanto.route-1' } : e) };
  });
  vaincre();
  expect(store.getState().pantheon).toBeNull();
  expect(lire().ligueGagnee).toBe(0);
});
