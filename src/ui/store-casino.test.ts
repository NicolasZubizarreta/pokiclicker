import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { chargerCasino, construireSabot, vueBlackjack } from '../core/casino';
import { chargerEvenements } from '../core/evenements';
import { kanto } from '../core/regions';
import { creerGestionnaire, creerStockageMemoire, type DonneesRegion, type PokemonPossede } from '../core/sauvegarde';
import { creerStoreJeu, type StoreJeu } from './store';

const stores: StoreJeu[] = [];
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  stores.forEach(store => store.getState().arreter());
  stores.length = 0;
  vi.useRealTimers();
});

function preparer(modifier: (region: DonneesRegion) => DonneesRegion = region => region) {
  const stockage = creerStockageMemoire();
  const horloge = creerHorlogeSimulee();
  const alea = vi.fn(() => .999);
  let id = 0;
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: () => 'test' });
  gestionnaire.creerPartie('Test', 'kanto.bourg-palette');
  const lire = () => gestionnaire.chargerRegion('test', 'kanto')!.donnees;
  const pokemon = (numero: number): PokemonPossede => ({ uid: `p-${numero}`, numero, niveau: 25,
    xp: 0, sexe: 'male', shiny: false, bonheur: 0, calcium: 0, pierreEternelle: false, favori: false });
  gestionnaire.ecrireRegion('test', 'kanto', modifier({ ...lire(), argent: 2000, jetons: 1000,
    equipe: [1, 2, 3, 4, 5, 6].map(pokemon), pc: [7, 8, 9].map(pokemon),
    bossVaincus: ['kanto.tour-pokemon'] }));
  const ouvrir = () => {
    const store = creerStoreJeu({ stockage, horloge, alea, genererId: () => `casino-${++id}`,
      evenements: chargerEvenements({ test: { version: 1, evenements: [] } }, kanto) });
    stores.push(store);
    store.getState().demarrer();
    expect(store.getState().erreur).toBeNull();
    return store;
  };
  return { store: ouvrir(), ouvrir, lire, horloge, alea };
}

it('achète et échange un lot, sauvegarde immédiatement et ne compte pas le rachat comme un gain', () => {
  const p = preparer();
  const total = p.lire().statistiques.argentTotalGagne;
  expect(p.store.getState().acheterJetons()).toMatchObject({ ok: true, message: '+50 jetons !' });
  expect(p.lire()).toMatchObject({ argent: 1000, jetons: 1050 });
  expect(p.store.getState().echangerJetons()).toMatchObject({ ok: true, message: '+1 000 ₽ !' });
  expect(p.lire()).toMatchObject({ argent: 2000, jetons: 1000 });
  expect(p.lire().statistiques.argentTotalGagne).toBe(total);
  expect(p.ouvrir().getState().casino.jetons).toBe(1000);
});

it('renvoie les résultats déterministes des jeux et persiste chaque coup sans attendre l’animation', () => {
  const p = preparer();
  p.alea.mockClear();
  expect(p.store.getState().jouerMachine(2)).toMatchObject({ ok: true,
    symboles: ['Magicarpe', 'Magicarpe', 'Magicarpe'], gain: 4 });
  expect(p.alea).toHaveBeenCalledTimes(3);
  expect(p.lire().jetons).toBe(1002);
  expect(p.store.getState().jouerPileOuFace(3, 'pile')).toMatchObject({ ok: true, resultat: 'pile', gain: 6 });
  expect(p.alea).toHaveBeenCalledTimes(4);
  expect(p.store.getState().casino.jetons).toBe(1005);
  expect(p.lire().jetons).toBe(1005);
});

const remplissage = construireSabot(() => 0.25).slice(0, 80);
const avecSabot = (...cartes: string[]) => (region: DonneesRegion): DonneesRegion => ({ ...region, sabotBlackjack: [...cartes, ...remplissage] });

it('garde une référence stable puis retrouve la main débitée et la termine après rechargement', () => {
  const p = preparer(avecSabot('K-C', 'K-D', 'K-H', 'K-S'));
  p.alea.mockClear();
  expect(p.store.getState().distribuerBlackjack(10)).toMatchObject({ ok: true, termine: false, gain: 0,
    vue: { croupier: ['K-D'], cachee: true, mains: [{ cartes: ['K-C', 'K-H'] }] } });
  expect(p.alea).not.toHaveBeenCalled();
  const casino = p.store.getState().casino;
  expect(casino.jetons).toBe(990);
  expect(casino.blackjackEnCours).toEqual(vueBlackjack(p.lire()));
  expect(JSON.stringify(casino)).not.toContain('K-S');
  p.horloge.avancer(100);
  p.store.getState().tick();
  expect(p.store.getState().casino).toBe(casino);
  p.store.getState().arreter();
  const reprise = p.ouvrir();
  expect(reprise.getState().casino).toEqual(casino);
  expect(reprise.getState().distribuerBlackjack(10)).toEqual({ ok: false, raison: 'Une main est déjà en cours.' });
  expect(reprise.getState().resterBlackjack()).toMatchObject({ ok: true, gain: 10, termine: true,
    fin: { croupier: ['K-D', 'K-S'], mains: [{ cartes: ['K-C', 'K-H'] }] } });
  expect(p.lire().blackjackEnCours).toBeUndefined();
  expect(p.lire().sabotBlackjack).toHaveLength(80);
  expect(p.lire().jetons).toBe(1000);
  expect(p.ouvrir().getState().casino.blackjackEnCours).toBeNull();
});

it('sauvegarde aussi la fin d’une main après avoir tiré', () => {
  const p = preparer(avecSabot('K-C', 'K-D', 'K-H', 'K-S', 'K-S'));
  p.store.getState().distribuerBlackjack(10);
  expect(p.store.getState().tirerBlackjack()).toMatchObject({ ok: true, gain: 0, message: 'Dépassé ! Perdu.',
    fin: { mains: [{ cartes: ['K-C', 'K-H', 'K-S'] }] } });
  expect(p.lire().jetons).toBe(990);
  expect(p.lire().blackjackEnCours).toBeUndefined();
});

it('sépare, double, assure puis abandonne par le store, avec sauvegarde à chaque coup', () => {
  const p = preparer(avecSabot('8-S', '6-C', '8-H', '10-D', '3-D', '9-S', '10-C', '10-H'));
  p.store.getState().distribuerBlackjack(10);
  expect(p.store.getState().separerBlackjack()).toMatchObject({ ok: true, termine: false });
  expect(p.lire().jetons).toBe(980);
  expect(p.store.getState().casino.blackjackEnCours).toMatchObject({ mains: [{ cartes: ['8-S', '3-D'] }, { cartes: ['8-H', '9-S'] }], active: 0 });
  p.store.getState().arreter();
  const reprise = p.ouvrir();
  expect(reprise.getState().doublerBlackjack()).toMatchObject({ ok: true, termine: false });
  expect(reprise.getState().resterBlackjack()).toMatchObject({ ok: true, termine: true, gain: 60, message: 'Bilan : +30 jetons.' });
  expect(p.lire().jetons).toBe(1030);
  const assure = preparer(avecSabot('10-S', 'A-D', '8-H', '6-C'));
  assure.store.getState().distribuerBlackjack(10);
  expect(assure.store.getState().tirerBlackjack()).toEqual({ ok: false, raison: 'Action impossible.' });
  expect(assure.store.getState().assurerBlackjack()).toMatchObject({ ok: true, termine: false });
  expect(assure.lire().jetons).toBe(985);
  expect(assure.lire().blackjackEnCours).toMatchObject({ phase: 'jeu', assurance: 5 });
  const abandon = preparer(avecSabot('10-S', '10-D', '6-H', '7-C'));
  abandon.store.getState().distribuerBlackjack(10);
  expect(abandon.store.getState().abandonnerBlackjack()).toMatchObject({ ok: true, gain: 5 });
  expect(abandon.lire().jetons).toBe(995);
});

it('refuse toutes les actions avant l’ouverture, sans aléa ni modification', () => {
  const p = preparer(region => ({ ...region, bossVaincus: [] }));
  const avant = p.lire();
  p.alea.mockClear();
  const etat = p.store.getState();
  const refus = { ok: false, raison: chargerCasino().acces.raison };
  expect(etat.casino.acces).toEqual({ ouvert: false, raison: refus.raison });
  for (const resultat of [etat.acheterJetons(), etat.echangerJetons(), etat.jouerMachine(1),
    etat.jouerPileOuFace(1, 'face'), etat.distribuerBlackjack(1), etat.tirerBlackjack(),
    etat.resterBlackjack(), etat.doublerBlackjack(), etat.separerBlackjack(), etat.assurerBlackjack(),
    etat.refuserAssuranceBlackjack(), etat.abandonnerBlackjack(), etat.acheterAuCasino('abra')]) expect(resultat).toEqual(refus);
  expect(p.alea).not.toHaveBeenCalled();
  expect(p.lire()).toEqual(avant);
});

it('inscrit Abra au Pokédex et accorde le palier avant de sauvegarder, même avec une équipe pleine', () => {
  const p = preparer();
  expect(p.store.getState().progression.pokedex.nombre).toBe(9);
  expect(p.store.getState().acheterAuCasino('abra')).toMatchObject({ ok: true, numero: 63, message: '+Abra !' });
  expect(p.store.getState().pc.at(-1)).toMatchObject({ numero: 63, niveau: 25 });
  expect(p.store.getState().pokedex).toContain(63);
  expect(p.store.getState().progression.paliers.find(p => p.palier === 10)?.recu).toBe(true);
  expect(p.store.getState().annonce).toContain('Palier 10');
  expect(p.lire()).toMatchObject({ jetons: 750, jalonsRecus: [10] });
  const reprise = p.ouvrir();
  expect(reprise.getState().pokedex).toContain(63);
  expect(reprise.getState().progression.paliers.find(p => p.palier === 10)?.recu).toBe(true);
});

it('renvoie les refus du cœur sans débiter ni tirer et actualise la boutique après achat', () => {
  const p = preparer(region => ({ ...region, argent: 999, jetons: 50 }));
  p.alea.mockClear();
  expect(p.store.getState().acheterJetons()).toEqual({ ok: false, raison: "Pas assez d'argent." });
  expect(p.store.getState().jouerMachine(0)).toEqual({ ok: false, raison: 'Mise invalide.' });
  expect(p.store.getState().jouerPileOuFace(51, 'face')).toEqual({ ok: false, raison: 'Pas assez de jetons.' });
  expect(p.store.getState().acheterAuCasino('abra')).toEqual({ ok: false, raison: 'Pas assez de jetons.' });
  expect(p.alea).not.toHaveBeenCalled();
  expect(p.lire()).toMatchObject({ argent: 999, jetons: 50 });
  const riche = preparer(region => ({ ...region, jetons: 10000 }));
  expect(riche.store.getState().acheterAuCasino('ctJackpot')).toMatchObject({ ok: true });
  expect(riche.store.getState().casino.objets.find(o => o.id === 'ctJackpot')).toMatchObject({ possede: true,
    abordable: false, raison: 'Déjà acquis !' });
  expect(riche.store.getState().acheterAuCasino('ctJackpot')).toEqual({ ok: false, raison: 'Déjà acquis !' });
  expect(riche.lire()).toMatchObject({ jetons: 0, ameliorations: ['ctJackpot'] });
});
