import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { chargerEvenements } from '../core/evenements';
import { kanto } from '../core/regions';
import { reglages, type Ton } from '../core/reglages';
import { compteInitial, creerGestionnaire, creerStockageMemoire, type DonneesRegion } from '../core/sauvegarde';
import { creerStoreJeu, type StoreJeu } from './store';

const stores: StoreJeu[] = [];
beforeEach(() => vi.useFakeTimers());
afterEach(() => { stores.splice(0).forEach(s => s.getState().arreter()); vi.useRealTimers(); });

function preparer(changements: Partial<DonneesRegion> = {}, alerte = false) {
  const stockage = creerStockageMemoire(), horloge = creerHorlogeSimulee();
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: () => 'test' });
  const compte = compteInitial();
  gestionnaire.ecrireCompte({ ...compte, preferences: { ...compte.preferences,
    autoAttaque: alerte, evolutionAuto: false,
    arretAuto: { ...reglages.depart.preferences.arretAuto, actif: alerte, nouveau: true } } });
  gestionnaire.creerPartie('Test');
  const lire = () => gestionnaire.chargerRegion('test', 'kanto')!.donnees;
  gestionnaire.ecrireRegion('test', 'kanto', { ...lire(), zoneId: 'kanto.route-1', etape: 1,
    bossVaincus: kanto.zones.map(z => z.id), ameliorations: ['leftovers'],
    equipe: [{ uid: 'fort', numero: 6, niveau: 20, xp: 0, shiny: false, bonheur: 0,
      calcium: 0, pierreEternelle: false, favori: false, sexe: 'male' }], ...changements });
  const store = creerStoreJeu({ stockage, horloge, alea: () => .1, genererId: () => 'capture',
    evenements: chargerEvenements({ essai: { version: 1, evenements: [] } }, kanto) });
  stores.push(store);
  const sons: Ton[] = [];
  store.abonnerSons(ton => sons.push(ton));
  store.getState().demarrer();
  expect(store.getState().erreur).toBeNull();
  const avancer = (ms: number) => {
    for (let t = 0; t < ms; t += 100) { horloge.avancer(100); store.getState().tick(); }
  };
  return { store, avancer, lire, sons };
}

it('joue le ton d’alerte à l’arrêt automatique', () => {
  const p = preparer({}, true);
  expect(p.sons).toContain('alerte');
});

it('expose le boss courant et la cadence des clics acceptés', () => {
  const p = preparer();
  expect(p.store.getState().apercuBoss()).toMatchObject({ numero: kanto.zoneDeCombat('kanto.route-1').boss.pokemon });
  expect(p.store.getState().attaquer()).toBe(true);
  expect(p.store.getState().lireCadence()).toEqual({ actuelle: 1, maximum: 12 });
  p.avancer(1000);
  expect(p.store.getState().lireCadence().actuelle).toBe(0);
});

it('gèle le boss et l’auto-clic, mesure les dégâts et conserve seulement le record', () => {
  const p = preparer({ etape: reglages.combat.etapeBoss });
  p.store.getState().basculerAutoAttaque();
  if (!p.store.getState().autoClic.actif) p.store.getState().basculerAutoClic();
  expect(p.store.getState().autoClic.actif).toBe(true);
  const avant = p.store.getState(), sauvegarde = p.lire();
  p.store.getState().lancerMannequin();
  expect(p.store.getState().frapperMannequin()).toBe(true);
  expect(p.store.getState().attaquer()).toBe(false);
  p.avancer(1000);
  const affichage = p.store.getState().mannequin;
  p.avancer(100);
  expect(p.store.getState().mannequin).toBe(affichage);
  p.avancer(28900);
  const apres = p.store.getState();
  expect(apres.pv).toBe(avant.pv);
  expect(apres.etape).toBe(avant.etape);
  expect(apres.minuteur).toEqual(avant.minuteur);
  expect(apres.mannequin).toMatchObject({ restantMs: 0, totalMs: 30000 });
  expect(apres.mannequin!.dpsEquipe).toBeGreaterThan(0);
  expect(apres.mannequin!.dpsClic).toBeGreaterThan(0);
  expect(apres.suivi.records.mannequinDpsMax).toBe(apres.mannequin!.dpsTotal);
  expect(p.lire().suivi?.records.mannequinDpsMax).toBe(apres.mannequin!.dpsTotal);
  expect(p.lire().equipe).toEqual(sauvegarde.equipe);
  expect(apres.argent).toBe(avant.argent);
  p.store.getState().arreterMannequin();
  expect(p.store.getState().mannequin).toBeNull();
  p.avancer(100);
  expect(p.store.getState().minuteur!.restantMs).toBeLessThan(avant.minuteur!.restantMs);
});

it('partage le limiteur et note aussi un arrêt manuel', () => {
  const p = preparer();
  p.store.getState().attaquer();
  p.store.getState().lancerMannequin();
  for (let i = 0; i < 11; i++) expect(p.store.getState().frapperMannequin()).toBe(true);
  expect(p.store.getState().frapperMannequin()).toBe(false);
  expect(p.store.getState().lireCadence().actuelle).toBe(12);
  p.avancer(1000);
  p.store.getState().arreterMannequin();
  expect(p.store.getState().mannequin).toBeNull();
  expect(p.store.getState().suivi.records.mannequinDpsMax).toBeGreaterThan(0);
});

it('refuse le mannequin sans combat actif', () => {
  const p = preparer({ zoneId: 'kanto.labo' });
  p.store.getState().lancerMannequin();
  expect(p.store.getState().mannequin).toBeNull();
  expect(p.store.getState().frapperMannequin()).toBe(false);
});
