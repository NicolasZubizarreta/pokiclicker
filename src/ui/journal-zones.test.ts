// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { avancerCombat, creerCombat, reprendreCombat, viderEvenements } from '../core/combat';
import { reglages } from '../core/reglages';
import { kanto } from '../core/regions';
import { appliquerVictoire } from '../core/recompenses';
import { creerStockageMemoire, regionInitiale, versMembreEquipe } from '../core/sauvegarde';
import { equipeDeDepart } from './equipe-de-depart';
import { CLE_JOURNAL, creerJournalLocal } from './journal-zones';
import { creerStoreJeu, type StoreJeu } from './store';

const stores: StoreJeu[] = [];
afterEach(() => {
  stores.splice(0).forEach(store => store.getState().arreter());
  reglages.journal.actif = false;
  vi.restoreAllMocks(); vi.useRealTimers();
  vi.unstubAllEnvs();
});
const zone = kanto.zoneDeCombat('kanto.route-1');
it('reprend le choix local et interdit le journal en production', () => {
  const horloge = creerHorlogeSimulee();
  const stockage = creerStockageMemoire();
  stockage.ecrire('pokiclicker-dev:journal-actif', '1');
  expect(creerJournalLocal(horloge, stockage)).not.toBeNull();
  stockage.ecrire('pokiclicker-dev:journal-actif', '0');
  expect(creerJournalLocal(horloge, stockage)).toBeNull();
  vi.stubEnv('PROD', true);
  expect(creerJournalLocal(horloge, stockage, true)).toBeNull();
});
function preparer(actif: boolean) {
  reglages.journal.actif = actif;
  const horloge = creerHorlogeSimulee();
  const stockage = creerStockageMemoire();
  return { horloge, stockage, journal: creerJournalLocal(horloge, stockage) };
}

it('est désactivé par défaut sans objet, lecture ou écriture du journal', () => {
  expect(reglages.journal.actif).toBe(false);
  const stockage = { lire: vi.fn(), ecrire: vi.fn(), supprimer: vi.fn(), cles: vi.fn() };
  expect(creerJournalLocal(creerHorlogeSimulee(), stockage)).toBeNull();
  expect(stockage.lire).toHaveBeenCalledWith('pokiclicker-dev:journal-actif');
  expect(stockage.lire).not.toHaveBeenCalledWith(CLE_JOURNAL);
  expect(stockage.ecrire).not.toHaveBeenCalled();
});

it('exporte les identifiants et paramètres des quatre zones de comparaison sans changer le format', () => {
  const { journal } = preparer(true);
  for (const id of ['kanto.arene-de-carmin', 'kanto.tour-pokemon', 'kanto.arene-de-celadopole', 'kanto.iles-ecume']) {
    const lieu = kanto.zoneDeCombat(id);
    journal!.synchroniser(lieu, creerCombat(lieu, [], () => .2));
    const exporte = journal!.exporter()!;
    expect(exporte.version).toBe(1);
    expect(exporte.revisionDonnees).toBeTruthy();
    expect(exporte.zones[id]!.visites[0]!.parametres).toMatchObject({ nom: lieu.nom, combat: reglages.combat });
  }
  journal!.effacer();
  expect(journal!.exporter()!.zones).toEqual({});
});

it('reste sans effet sur le jeu quand le stockage est bloqué ou le relevé corrompu', () => {
  const { horloge, stockage: memoire, journal: initial } = preparer(true);
  initial!.synchroniser(zone, null);
  const corrompu = JSON.parse(memoire.lire(CLE_JOURNAL)!);
  corrompu.zones = null;
  memoire.ecrire(CLE_JOURNAL, JSON.stringify(corrompu));
  expect(() => creerJournalLocal(horloge, memoire)!.synchroniser(zone, null)).not.toThrow();
  const stockage = { lire: () => '{', ecrire: () => { throw new Error('plein'); }, supprimer: vi.fn(), cles: () => [] };
  const journal = creerJournalLocal(horloge, stockage)!;
  expect(() => { journal.synchroniser(zone, null); journal.avancer(100); journal.pauser('pause'); }).not.toThrow();
});

it('compare le cœur final et toutes les récompenses sur le même parcours avec ou sans journal', () => {
  const alea = () => .2;
  function parcours(actif: boolean) {
    const { horloge, stockage, journal } = preparer(actif);
    let region = { ...regionInitiale('kanto', zone.id), equipe: equipeDeDepart() };
    let coeur = reprendreCombat(zone, region.equipe.map(versMembreEquipe), alea, reglages.combat.etapeBoss);
    const recompenses = [];
    for (let pas = 0; pas < 400; pas++) {
      journal?.synchroniser(zone, coeur);
      horloge.avancer(100);
      journal?.avancer(100);
      coeur = avancerCombat(coeur, 100);
      for (const evenement of coeur.evenements) {
        if (evenement.type === 'ennemi-vaincu') {
          const resultat = appliquerVictoire(region, evenement);
          region = resultat.region; recompenses.push(resultat);
        }
        if (evenement.type === 'boss-vaincu') journal?.issue('victoire', evenement.zoneId);
        if (evenement.type === 'boss-echoue') journal?.issue('echec', evenement.zoneId);
      }
      coeur = viderEvenements({ ...coeur, equipe: region.equipe.map(versMembreEquipe) });
      journal?.synchroniser(zone, coeur);
    }
    return { coeur, region, recompenses, stockage };
  }
  const sans = parcours(false);
  const avec = parcours(true);
  expect(avec.coeur).toEqual(sans.coeur);
  expect(avec.region).toEqual(sans.region);
  expect(avec.recompenses).toEqual(sans.recompenses);
  expect(avec.recompenses.length).toBeGreaterThan(0);
  expect(sans.stockage.cles()).toEqual([]);
  const releve = JSON.parse(avec.stockage.lire(CLE_JOURNAL)!);
  expect(releve.zones[zone.id].nombreEssais).toBeGreaterThan(0);
});

it('branche boucle, visibilité, arrêt et reprise du store sans temps masqué ni visite doublée', () => {
  vi.useFakeTimers();
  const { horloge, stockage } = preparer(true);
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
  const store = creerStoreJeu({ horloge, stockage, alea: () => .2, genererId: () => 'test' });
  stores.push(store);
  store.getState().demarrer();
  expect(store.getState().erreur).toBeNull();
  horloge.avancer(100); store.getState().tick();
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
  document.dispatchEvent(new Event('visibilitychange'));
  horloge.avancer(1000); store.getState().tick();
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
  document.dispatchEvent(new Event('visibilitychange'));
  store.getState().arreter();
  horloge.avancer(1000);
  store.getState().demarrer();
  const releve = JSON.parse(stockage.lire(CLE_JOURNAL)!);
  const visites = Object.values(releve.zones) as { tempsActifMs: number; visites: unknown[] }[];
  expect(visites.reduce((total, zone) => total + zone.tempsActifMs, 0)).toBe(100);
  expect(visites).toHaveLength(1);
  expect(visites[0]!.visites).toHaveLength(1);
});

it('reprend un boss après rechargement sans créer un second essai et conserve la clé locale distincte', () => {
  const { horloge, stockage, journal } = preparer(true);
  const coeur = reprendreCombat(zone, [], () => .2, reglages.combat.etapeBoss);
  journal!.synchroniser(zone, coeur);
  journal!.avancer(100);
  horloge.avancer(10000);
  const repris = creerJournalLocal(horloge, stockage)!;
  repris.synchroniser(zone, coeur);
  repris.issue('echec', zone.id);
  repris.synchroniser(zone, creerCombat(zone, [], () => .2));
  const releve = JSON.parse(stockage.lire(CLE_JOURNAL)!);
  expect(releve.zones[zone.id]).toMatchObject({ nombreEssais: 1, tempsActifMs: 100 });
  expect(releve.zones[zone.id].visites).toHaveLength(1);
  expect(releve.zones[zone.id].visites[0].essais[0].issue).toBe('echec');
  expect(stockage.cles()).toEqual([CLE_JOURNAL]);
});
