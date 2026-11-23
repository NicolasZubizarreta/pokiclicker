import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import * as combat from '../core/combat';
import { chargerEvenements } from '../core/evenements';
import { kanto } from '../core/regions';
import { reglages } from '../core/reglages';
import { compteInitial, creerGestionnaire, creerStockageMemoire, type DonneesRegion } from '../core/sauvegarde';
import { suiviVide } from '../core/suivi';
import { construireSabot } from '../core/blackjack';
import { PLAFOND_JETONS } from '../core/plafonds';
import { creerStoreJeu, type StoreJeu } from './store';

const stores: StoreJeu[] = [];
const sabot = (...cartes: string[]) => [...cartes, ...construireSabot(() => .25).slice(0, 80)];
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

it('compte chaque jeu atomique et son résultat net réel, sans compter les refus', () => {
  const p = preparer({ jetons: 10000, plusOuMoinsCarte: 7 });
  const etat = p.store.getState();
  const jouer = (jeu: 'machine' | 'roulette' | 'plusOuMoins' | 'pileOuFace' | 'gratter', action: () => { ok: boolean }) => {
    const avant = p.store.getState().casino.jetons;
    const jetons = p.store.getState().suivi.jetons;
    expect(action().ok).toBe(true);
    const net = p.store.getState().casino.jetons - avant;
    expect(p.store.getState().suivi.jetons).toMatchObject({ gagnes: jetons.gagnes + Math.max(0, net),
      perdus: jetons.perdus + Math.max(0, -net) });
    expect(p.store.getState().suivi.casino[jeu]?.parties).toBe(1);
  };
  jouer('machine', () => etat.jouerMachine(10));
  jouer('roulette', () => etat.jouerRoulette(10, { type: 'numero', numero: 0 }));
  jouer('plusOuMoins', () => etat.jouerPlusOuMoins(10, 'moins'));
  jouer('pileOuFace', () => etat.jouerPileOuFace(10, 'pile'));
  jouer('gratter', () => etat.gratter(10));
  const suivi = p.store.getState().suivi;
  expect(etat.jouerMachine(0).ok).toBe(false);
  expect(p.store.getState().suivi).toBe(suivi);
  expect(p.lire().suivi?.casino).toEqual(suivi.casino);
});

it('compte le blackjack une seule fois après séparation, doublement et reprise', () => {
  const p = preparer({ jetons: 1000, sabotBlackjack: sabot('8-S', '6-C', '8-H', '10-D', '3-D', '9-S', '10-C', '10-H') });
  p.store.getState().distribuerBlackjack(10);
  p.store.getState().separerBlackjack();
  expect(p.store.getState().suivi.casino.blackjack).toBeUndefined();
  p.store.getState().arreter();
  const reprise = p.ouvrir();
  reprise.getState().doublerBlackjack();
  expect(reprise.getState().suivi.casino.blackjack).toBeUndefined();
  expect(reprise.getState().resterBlackjack()).toMatchObject({ ok: true, termine: true, fin: { engage: 30, gain: 60 } });
  expect(reprise.getState().suivi.jetons).toMatchObject({ gagnes: 30, perdus: 0 });
  expect(reprise.getState().suivi.casino.blackjack?.parties).toBe(1);
  expect(reprise.getState().resterBlackjack().ok).toBe(false);
  expect(p.lire().suivi?.casino.blackjack?.parties).toBe(1);
});

it('compte seulement les jetons réellement gagnés au plafond', () => {
  const p = preparer({ jetons: PLAFOND_JETONS });
  expect(p.store.getState().jouerPileOuFace(10, 'face')).toMatchObject({ ok: true, gain: 20 });
  expect(p.store.getState().casino.jetons).toBe(PLAFOND_JETONS);
  expect(p.store.getState().suivi.jetons).toMatchObject({ gagnes: 0, perdus: 0 });
});

it.each([
  { cartes: ['10-S', 'A-D', '8-H', '9-C'], assurance: true, net: -15 },
  { cartes: ['A-S', '10-D', 'K-H', '7-C'], assurance: false, net: 15 },
  { cartes: ['10-S', '10-D', '6-H', '7-C'], assurance: false, net: -5 },
])('compte l’assurance, la fin immédiate et l’abandon ($net)', ({ cartes, assurance, net }) => {
  const p = preparer({ jetons: 1000, sabotBlackjack: sabot(...cartes) });
  const etat = p.store.getState();
  const debut = etat.distribuerBlackjack(10);
  if (assurance) { etat.assurerBlackjack(); etat.resterBlackjack(); }
  else if (debut.ok && !debut.termine) etat.abandonnerBlackjack();
  expect(p.store.getState().casino.jetons - 1000).toBe(net);
  expect(p.store.getState().suivi.jetons).toMatchObject({ gagnes: Math.max(0, net), perdus: Math.max(0, -net) });
  expect(p.store.getState().suivi.casino.blackjack?.parties).toBe(1);
});

it('enregistre puis applique une équipe et sauvegarde le titre choisi ou retiré', () => {
  const p = preparer();
  const etat = p.store.getState();
  expect(etat.enregistrerEquipe(0)).toBeNull();
  etat.capturer('masterball'); p.avancer(2000);
  expect(etat.envoyerAuPc('fort')).toBeNull();
  expect(etat.appliquerEquipe(0)).toBeNull();
  expect(p.lire().equipe.map(p => p.uid)).toEqual(['fort']);
  expect(p.lire().pc.map(p => p.uid)).toContain('capture');
  expect(etat.appliquerEquipe(1)).toBeTruthy();
  etat.choisirTitre('Dresseur');
  expect(p.store.getState().suivi.titre).toBe('Dresseur');
  expect(p.lire().suivi?.titre).toBe('Dresseur');
  etat.choisirTitre(undefined);
  expect(p.lire().suivi?.titre).toBeUndefined();
});
