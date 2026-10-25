import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import * as combat from '../core/combat';
import { chargerEvenements } from '../core/evenements';
import { kanto } from '../core/regions';
import { reglages } from '../core/reglages';
import { compteInitial, creerGestionnaire, creerStockageMemoire } from '../core/sauvegarde';
import { creerStoreJeu, type StoreJeu } from './store';

const stores: StoreJeu[] = [];
const zoneId = 'kanto.ligue-pokemon';
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  stores.forEach(store => store.getState().arreter());
  stores.length = 0;
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function preparer(etape: number, avecEvenement = false) {
  const stockage = creerStockageMemoire();
  const horloge = creerHorlogeSimulee();
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: () => 'test' });
  const compte = compteInitial();
  gestionnaire.ecrireCompte({ ...compte, preferences: { ...compte.preferences, autoAttaque: false,
    arretAuto: { ...reglages.depart.preferences.arretAuto, actif: false } } });
  gestionnaire.creerPartie('Test', 'kanto.bourg-palette');
  const lire = () => gestionnaire.chargerRegion('test', 'kanto')!.donnees;
  gestionnaire.ecrireRegion('test', 'kanto', { ...lire(), zoneId, etape, starterId: 1,
    equipe: [{ uid: 'fort', numero: 6, niveau: 50, xp: 0, shiny: false, bonheur: 0,
      pierreEternelle: false, calcium: 0, sexe: 'male', favori: false }] });
  const evenements = chargerEvenements({ essai: { version: 1, evenements: avecEvenement ? [{
    id: 'test.ligue', declencheur: { type: 'boss-vaincu', zone: zoneId },
    etapes: [{ type: 'dialogue', locuteur: 'Chen', texte: 'Bravo !' }],
  }] : [] } }, kanto);
  const ouvrir = () => {
    const store = creerStoreJeu({ stockage, horloge, alea: () => .1, genererId: () => 'test', evenements });
    stores.push(store);
    store.getState().demarrer();
    expect(store.getState().erreur).toBeNull();
    return store;
  };
  const store = ouvrir();
  const avancer = (ms: number) => { horloge.avancer(ms); store.getState().tick(); };
  // Garde les transitions et récompenses réelles, avec un ennemi à un PV pour chaque clic.
  const cliquer = combat.cliquer;
  vi.spyOn(combat, 'cliquer').mockImplementation((etat, limiteur) =>
    cliquer({ ...etat, ennemi: { ...etat.ennemi, pv: 1 } }, limiteur));
  const vaincre = () => {
    while (store.getState().enRecherche) avancer(100);
    horloge.avancer(100);
    store.getState().attaquer();
    store.getState().tick();
  };
  return { store, ouvrir, lire, avancer, vaincre };
}

describe('Ligue dans le store', () => {
  it('reprend le counter du starter et expose le nom du Maître', () => {
    const { store } = preparer(10);
    expect(store.getState().ennemi?.numero).toBe(6);
    expect(store.getState().nomAdversaire).toBe('Maître Blue (Dracaufeu)');
  });

  it('compte chaque victoire une seule fois et recommence à la première étape', () => {
    const { store, lire, avancer, vaincre } = preparer(10);
    expect(lire().ligueGagnee).toBe(0);
    vaincre();
    expect(lire().ligueGagnee).toBe(1);
    expect(store.getState().ligueGagnee).toBe(1);
    expect(store.getState().etape).toBe(1);
    expect(store.getState().annonce).toContain('Victoire contre Maître Blue !');
    for (let i = 0; i < 10; i++) avancer(100);
    expect(lire().ligueGagnee).toBe(1);
    for (let i = 0; i < 10; i++) vaincre();
    expect(lire().ligueGagnee).toBe(2);
    expect(store.getState().ligueGagnee).toBe(2);
  });

  it('déclenche un événement boss-vaincu après le Maître', () => {
    const { store, vaincre } = preparer(10, true);
    expect(store.getState().evenement).toBeNull();
    vaincre();
    expect(store.getState().evenement).toEqual({ type: 'dialogue', evenement: 'test.ligue',
      etape: 0, locuteur: 'Chen', texte: 'Bravo !' });
  });

  it('annonce les enchaînements et sauvegarde chaque étape pour la reprise', () => {
    const { store, ouvrir, lire, vaincre } = preparer(2);
    vaincre();
    expect(store.getState().annonce).toContain('Victoire contre Olga ! Aldo entre en scène.');
    expect(lire().etape).toBe(3);
    vaincre();
    expect(lire().etape).toBe(4);
    const reprise = ouvrir();
    expect(reprise.getState().etape).toBe(4);
    expect(reprise.getState().minuteur?.restantMs).toBe(30000);
  });

  it('revient au premier Pokémon du dresseur après expiration et conserve les gains', () => {
    const { store, ouvrir, lire, avancer, vaincre } = preparer(3);
    const avant = lire();
    vaincre();
    const argent = store.getState().argent;
    const pokemon = store.getState().equipe[0]!.pokemon;
    expect(argent).toBeGreaterThan(avant.argent);
    expect(pokemon.xp).toBeGreaterThan(avant.equipe[0]!.xp);
    while (store.getState().enRecherche) avancer(100);
    for (let i = 0; i < 300 && store.getState().etape === 4; i++) avancer(100);
    expect(store.getState().etape).toBe(3);
    expect(store.getState().annonce).toBe('Temps écoulé ! Retour au premier Pokémon de Aldo.');
    expect(lire().etape).toBe(3);
    expect(lire().argent).toBe(argent);
    expect(lire().equipe[0]).toEqual(pokemon);
    expect(ouvrir().getState().etape).toBe(3);
  });
});
