import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { deblocages } from '../core/deblocages';
import { chargerEvenements } from '../core/evenements';
import { kanto } from '../core/regions';
import { reglages } from '../core/reglages';
import { compteInitial, creerGestionnaire, creerStockageMemoire, type DonneesRegion } from '../core/sauvegarde';
import { creerStoreJeu, type StoreJeu } from './store';

const stores: StoreJeu[] = [];
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  stores.forEach(store => store.getState().arreter());
  stores.length = 0;
  vi.useRealTimers();
});

const toutesLesZones = kanto.zones.map(zone => zone.id);
const texte = (id: string) => deblocages.find(d => d.id === id)!.texte;
const equipe = [{ uid: 'fort', numero: 6, niveau: 100, xp: 0, shiny: false, bonheur: 0, pierreEternelle: false,
  calcium: 100000, sexe: 'male' as const, favori: false }];

function preparer(modifier: (region: DonneesRegion) => DonneesRegion) {
  const stockage = creerStockageMemoire();
  const horloge = creerHorlogeSimulee();
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: () => 'test' });
  const compte = compteInitial();
  gestionnaire.ecrireCompte({ ...compte, preferences: { ...compte.preferences, autoAttaque: false,
    arretAuto: { ...reglages.depart.preferences.arretAuto, actif: false } } });
  gestionnaire.creerPartie('Test', 'kanto.bourg-palette');
  const lire = () => gestionnaire.chargerRegion('test', 'kanto')!.donnees;
  gestionnaire.ecrireRegion('test', 'kanto', modifier({ ...lire(), equipe: structuredClone(equipe) }));
  const ouvrir = () => {
    const store = creerStoreJeu({ stockage, horloge, alea: () => 0, genererId: () => 'id',
      evenements: chargerEvenements({ test: { version: 1, evenements: [] } }, kanto) });
    stores.push(store);
    store.getState().demarrer();
    expect(store.getState().erreur).toBeNull();
    return store;
  };
  const avancer = (store: StoreJeu, ms: number) => {
    for (let temps = 0; temps < ms; temps += reglages.boucle.pasMs) {
      horloge.avancer(reglages.boucle.pasMs);
      store.getState().tick();
    }
  };
  const gagner = (store: StoreJeu) => {
    const avant = store.getState().argent;
    for (let i = 0; i < 10000 && store.getState().argent === avant; i++) {
      store.getState().attaquer();
      avancer(store, reglages.boucle.pasMs);
    }
    expect(store.getState().argent).toBeGreaterThan(avant);
  };
  return { ouvrir, lire, avancer, gagner, gestionnaire };
}

/** Texte affiché à chaque pas de 100 ms, doublons consécutifs fusionnés. */
function suivre(p: ReturnType<typeof preparer>, store: StoreJeu, ms: number) {
  const suite: { texte: string | null; pas: number }[] = [];
  for (let temps = 0; temps < ms; temps += reglages.boucle.pasMs) {
    p.avancer(store, reglages.boucle.pasMs);
    const courant = store.getState().deblocage;
    const dernier = suite.at(-1);
    if (dernier?.texte === courant) dernier.pas++; else suite.push({ texte: courant, pas: 1 });
  }
  return suite;
}

const deblocagesSansRadar = deblocages.map(d => d.id).filter(id => id !== 'poke-radar');
const tour = (region: DonneesRegion): DonneesRegion => ({ ...region, bossVaincus: [], zoneId: 'kanto.tour-pokemon',
  etape: reglages.combat.etapeBoss, annoncesVues: ['sac', 'pc'] });

it('enchaîne Pension, Centre commercial et Casino après le boss de la Tour Pokémon, une annonce à la fois', () => {
  const p = preparer(tour);
  const store = p.ouvrir();
  expect(store.getState().deblocage).toBeNull();
  p.gagner(store);
  const suite = suivre(p, store, 8000);
  const annonces = suite.filter(etape => etape.texte !== null);
  expect(annonces.map(etape => etape.texte)).toEqual([texte('pension'), texte('centre-commercial'), texte('casino')]);
  for (const etape of annonces) expect(etape.pas * reglages.boucle.pasMs).toBe(reglages.interface.annonceMs);
  expect(store.getState().deblocage).toBeNull();
  expect(p.lire().annoncesVues).toEqual(['sac', 'pc', 'pension', 'centre-commercial', 'casino']);
});

it('attend la fin de l’annonce du jeu avant d’afficher la première annonce de déblocage', () => {
  const p = preparer(tour);
  const store = p.ouvrir();
  p.gagner(store);
  for (let i = 0; i < 40 && store.getState().deblocage === null; i++) {
    expect(store.getState().annonce === null || store.getState().deblocage === null).toBe(true);
    p.avancer(store, reglages.boucle.pasMs);
  }
  expect(store.getState().deblocage).toBe(texte('pension'));
  expect(store.getState().annonce).toBeNull();
});

it('ne rejoue rien au rechargement ni quand la page est rouverte au milieu de la file', () => {
  const p = preparer(tour);
  const store = p.ouvrir();
  p.gagner(store);
  const annonces = (suite: ReturnType<typeof suivre>) => suite.map(etape => etape.texte).filter(Boolean);
  expect(annonces(suivre(p, store, 3000))).toEqual([texte('pension'), texte('centre-commercial')]);
  store.getState().arreter();
  const reprise = p.ouvrir();
  expect(annonces(suivre(p, reprise, 5000))).toEqual([texte('casino')]);
  reprise.getState().arreter();
  const encore = p.ouvrir();
  expect(annonces(suivre(p, encore, 5000))).toEqual([]);
});

it('ne rejoue rien pour une ancienne sauvegarde qui a déjà tout débloqué, et marque tout comme vu', () => {
  const p = preparer(region => ({ ...region, bossVaincus: toutesLesZones,
    ameliorations: ['pokeradar', 'falseSwipe', 'leftovers'] }));
  expect(p.lire().annoncesVues).toBeUndefined();
  const store = p.ouvrir();
  expect(suivre(p, store, 5000).map(etape => etape.texte)).toEqual([null]);
  expect(store.getState().deblocage).toBeNull();
  expect(p.lire().annoncesVues).toEqual(['sac', 'pc', 'pension', 'centre-commercial', 'casino',
    'poke-radar', 'fauchage', 'auto-clic']);
});

it('annonce le Poké-Radar à l’achat, une seule fois', () => {
  const p = preparer(region => ({ ...region, bossVaincus: toutesLesZones, argent: 1000000,
    annoncesVues: deblocagesSansRadar }));
  const store = p.ouvrir();
  expect(suivre(p, store, 1000).map(etape => etape.texte)).toEqual([null]);
  expect(store.getState().acheter('pokeradar', 1)).toBeNull();
  const suite = suivre(p, store, 4000).map(etape => etape.texte);
  expect(suite.filter(Boolean)).toEqual([texte('poke-radar')]);
  expect(p.lire().annoncesVues).toContain('poke-radar');
});
