import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import * as combat from '../core/combat';
import { chargerEvenements } from '../core/evenements';
import { kanto } from '../core/regions';
import { reglages } from '../core/reglages';
import { compteInitial, creerGestionnaire, creerStockageMemoire, type DonneesRegion } from '../core/sauvegarde';
import { suiviVide } from '../core/suivi';
import { creerStoreJeu, type StoreJeu } from './store';

const stores: StoreJeu[] = [];
beforeEach(() => vi.useFakeTimers());
afterEach(() => { stores.splice(0).forEach(s => s.getState().arreter()); vi.restoreAllMocks(); vi.useRealTimers(); });

function preparer(changements: Partial<DonneesRegion> = {}, tempsBase = 0) {
  const stockage = creerStockageMemoire(), horloge = creerHorlogeSimulee(new Date(2026, 0, 2).getTime());
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: () => 'test' });
  const compte = compteInitial();
  gestionnaire.ecrireCompte({ ...compte, preferences: { ...compte.preferences, autoAttaque: false,
    evolutionAuto: false, arretAuto: { ...reglages.depart.preferences.arretAuto, actif: false } } });
  gestionnaire.creerPartie('Test');
  const partie = gestionnaire.chargerPartie('test')!.donnees;
  gestionnaire.ecrirePartie('test', { ...partie, pokedexNational: [1, 6],
    statistiques: { ...partie.statistiques, tempsJeuMs: tempsBase } });
  const lire = () => gestionnaire.chargerRegion('test', 'kanto')!.donnees;
  gestionnaire.ecrireRegion('test', 'kanto', { ...lire(), zoneId: 'kanto.route-1', etape: 1,
    bossVaincus: kanto.zones.map(z => z.id), argent: 1000000, inventaire: { masterball: 5 },
    equipe: [{ uid: 'fort', numero: 1, niveau: 16, xp: 0, shiny: false, bonheur: 0,
      calcium: 0, pierreEternelle: false, favori: false, sexe: 'male' }], ...changements });
  const ouvrir = () => {
    const store = creerStoreJeu({ stockage, horloge, alea: () => .1, genererId: () => 'capture',
      evenements: chargerEvenements({ essai: { version: 1, evenements: [] } }, kanto) });
    stores.push(store); store.getState().demarrer(); expect(store.getState().erreur).toBeNull(); return store;
  };
  const store = ouvrir();
  const avancer = (ms = 100) => {
    for (let t = 0; t < ms; t += 100) { horloge.avancer(100); store.getState().tick(); }
  };
  const vaincre = () => {
    while (store.getState().enRecherche) avancer();
    const cliquer = combat.cliquer;
    const espion = vi.spyOn(combat, 'cliquer').mockImplementation((etat, limiteur) =>
      cliquer({ ...etat, ennemi: { ...etat.ennemi, pv: 1 } }, limiteur));
    store.getState().attaquer(); espion.mockRestore(); avancer();
  };
  return { store, lire, ouvrir, avancer, vaincre, horloge };
}

it.each([false, true])('compte une capture, même doublon relâché (%s), puis une victoire et son or', relacher => {
  const p = preparer();
  const numero = p.store.getState().ennemi!.numero;
  p.store.getState().noterEspece(numero);
  p.store.getState().reglerRelacherDoublons(relacher);
  p.store.getState().capturer('masterball'); p.avancer(2000);
  expect(p.store.getState().suivi.captures).toBe(1);
  expect(p.store.getState().suivi.rencontres[numero]).toMatchObject({ vus: 1, captures: 1 });
  p.vaincre();
  expect(p.store.getState().suivi.serieVictoires).toBe(2);
  expect(p.store.getState().suivi.argentJours['2026-01-02']).toBeGreaterThan(0);
});

it('remet la série à zéro après un boss échoué', () => {
  const p = preparer({ etape: reglages.combat.etapeBoss, suivi: { ...suiviVide(), serieVictoires: 3 } });
  p.avancer(reglages.combat.minuteurBossMs + 100);
  expect(p.store.getState().suivi.serieVictoires).toBe(0);
});

it('compte toutes les éclosions même passées', () => {
  const p = preparer({ equipe: [{ uid: 'oeuf', numero: 133, niveau: 1, xp: 0, shiny: false, bonheur: 0,
    calcium: 0, pierreEternelle: false, favori: false, sexe: 'male', oeuf: { pasRestants: 1, pasMax: 25 } }] });
  p.store.getState().reglerPasserEclosions(true); p.vaincre();
  expect(p.store.getState().suivi.oeufsEclos).toBe(1);
});

it('compte les évolutions réussies et ignore les refus', () => {
  const p = preparer();
  expect(p.store.getState().evoluer('absent')).toBeTruthy();
  expect(p.store.getState().suivi.evolutions).toBe(0);
  expect(p.store.getState().evoluer('fort')).toBeNull();
  expect(p.store.getState().suivi.evolutions).toBe(1);
});

it('compte une évolution confirmée par la fenêtre automatique', () => {
  const p = preparer();
  p.store.getState().reglerEvolutionAuto(true);
  expect(p.store.getState().demanderEvolution('fort')).toBeNull();
  expect(p.store.getState().suivi.evolutions).toBe(0);
  p.store.getState().confirmerEvolution();
  expect(p.store.getState().suivi.evolutions).toBe(1);
  p.store.getState().confirmerEvolution();
  expect(p.store.getState().suivi.evolutions).toBe(1);
});

it('compte le centre commercial et une évolution par pierre', () => {
  const p = preparer({ equipe: [{ uid: 'pikachu', numero: 25, niveau: 20, xp: 0, shiny: false, bonheur: 0,
    calcium: 0, pierreEternelle: false, favori: false, sexe: 'male' }] });
  const avant = p.store.getState().argent;
  expect(p.store.getState().acheter('thunderStone', 1)).toBeNull();
  expect(p.store.getState().suivi.depenses.centre).toBe(avant - p.store.getState().argent);
  expect(p.store.getState().suivi.depenses.centre).toBeGreaterThan(0);
  expect(p.store.getState().suivi.depenses.boutique).toBeUndefined();
  expect(p.store.getState().utiliserPierre('pikachu', 'thunderStone')).toBeNull();
  expect(p.store.getState().suivi.evolutions).toBe(1);
});

it('compte les dépenses réelles de boutique, casino et pension et ignore les achats refusés', () => {
  const p = preparer();
  const achat = (categorie: 'boutique' | 'casino' | 'pension', action: () => unknown) => {
    const avant = p.store.getState().argent;
    action();
    expect(p.store.getState().suivi.depenses[categorie]).toBe(avant - p.store.getState().argent);
    expect(avant - p.store.getState().argent).toBeGreaterThan(0);
  };
  achat('boutique', () => expect(p.store.getState().acheter('pokeball', 2)).toBeNull());
  const suivi = p.store.getState().suivi;
  expect(p.store.getState().acheter('absent', 1)).toBeTruthy();
  expect(p.store.getState().suivi).toBe(suivi);
  achat('casino', () => expect(p.store.getState().acheterJetons().ok).toBe(true));
  const depensesCasino = p.store.getState().suivi.depenses.casino;
  expect(p.store.getState().echangerJetons().ok).toBe(true);
  expect(p.store.getState().suivi.depenses.casino).toBe(depensesCasino);
  achat('pension', () => expect(p.store.getState().acheterEmplacementOeuf()).toBeNull());
});

it('enregistre le Hall à la victoire de Ligue sans les œufs et mesure le boss', () => {
  const p = preparer({ zoneId: 'kanto.ligue-pokemon', etape: 10, equipe: [
    { uid: 'fort', numero: 1, niveau: 16, xp: 0, shiny: false, bonheur: 0, surnom: 'Feuille',
      calcium: 0, pierreEternelle: false, favori: false, sexe: 'male' },
    { uid: 'oeuf', numero: 133, niveau: 1, xp: 0, shiny: false, bonheur: 0,
      calcium: 0, pierreEternelle: false, favori: false, sexe: 'male', oeuf: { pasRestants: 25, pasMax: 25 } },
  ] }, 12000);
  p.avancer(500); p.vaincre();
  const suivi = p.store.getState().suivi;
  expect(suivi.hall).toEqual([{ date: new Date(p.horloge.maintenant() - 100).toISOString(), tempsJeuMs: 12500,
    equipe: [{ numero: 1, niveau: p.lire().equipe[0]!.niveau, shiny: false, surnom: 'Feuille' }] }]);
  expect(suivi.records.tempsBossMinMs).toBe(500);
  expect(suivi.bossVaincus).toBe(1);
  expect(p.lire().suivi?.hall).toEqual(suivi.hall);
});

it('expose le temps cumulé arrondi et garde le suivi stable entre les ticks', () => {
  const p = preparer({}, 12345);
  const suivi = p.store.getState().suivi;
  expect(p.store.getState().tempsJeuMs).toBe(12000);
  p.avancer(500);
  expect(p.store.getState().tempsJeuMs).toBe(12000);
  expect(p.store.getState().suivi).toBe(suivi);
  p.avancer(500);
  expect(p.store.getState().tempsJeuMs).toBe(13000);
  expect(p.store.getState().suivi.records.dpsMax).toBeGreaterThan(0);
  p.store.getState().attaquer(); p.avancer();
  expect(p.store.getState().suivi.records.degatsClicMax).toBeGreaterThan(0);
  expect(p.store.getState().suivi.records.cadenceMax).toBe(1);
  p.store.getState().fermer(); p.store.getState().arreter();
  const reprise = p.ouvrir().getState();
  expect(reprise.tempsJeuMs).toBe(13000);
  expect(reprise.suivi.records.degatsClicMax).toBeGreaterThan(0);
});
