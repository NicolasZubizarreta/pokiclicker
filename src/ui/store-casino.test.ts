import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { chargerCasino } from '../core/casino';
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
  expect(p.store.getState().echangerJetons()).toMatchObject({ ok: true, message: '+1 000 $ !' });
  expect(p.lire()).toMatchObject({ argent: 2000, jetons: 1000 });
  expect(p.lire().statistiques.argentTotalGagne).toBe(total);
  expect(p.ouvrir().getState().casino.jetons).toBe(1000);
});

it('renvoie les résultats déterministes des jeux et persiste chaque coup sans attendre l’animation', () => {
  const p = preparer();
  p.alea.mockClear();
  expect(p.store.getState().jouerMachine(2)).toMatchObject({ ok: true,
    symboles: ['Magicarpe', 'Magicarpe', 'Magicarpe'], gain: 10 });
  expect(p.alea).toHaveBeenCalledTimes(3);
  expect(p.lire().jetons).toBe(1008);
  expect(p.store.getState().jouerPileOuFace(3, 'pile')).toMatchObject({ ok: true, resultat: 'pile', gain: 6 });
  expect(p.alea).toHaveBeenCalledTimes(4);
  expect(p.store.getState().casino.jetons).toBe(1011);
  expect(p.lire().jetons).toBe(1011);
});

it('garde une référence stable puis retrouve la main débitée et la termine après rechargement', () => {
  const p = preparer();
  p.alea.mockClear();
  expect(p.store.getState().distribuerBlackjack(10)).toMatchObject({ ok: true,
    joueur: ['K-C', 'K-D'], croupier: ['K-H'], gain: 0 });
  expect(p.alea).toHaveBeenCalledTimes(51);
  const casino = p.store.getState().casino;
  expect(casino).toMatchObject({ jetons: 990, blackjackEnCours: p.lire().blackjackEnCours });
  p.horloge.avancer(100);
  p.store.getState().tick();
  expect(p.store.getState().casino).toBe(casino);
  p.store.getState().arreter();
  const reprise = p.ouvrir();
  expect(reprise.getState().casino).toEqual(casino);
  expect(reprise.getState().distribuerBlackjack(10)).toEqual({ ok: false, raison: 'Une main est déjà en cours.' });
  expect(reprise.getState().resterBlackjack()).toMatchObject({ ok: true, gain: 10,
    joueur: ['K-C', 'K-D'], croupier: ['K-H', 'K-S'] });
  expect(p.lire().blackjackEnCours).toBeUndefined();
  expect(p.lire().jetons).toBe(1000);
  expect(p.ouvrir().getState().casino.blackjackEnCours).toBeNull();
});

it('sauvegarde aussi la fin d’une main après avoir tiré', () => {
  const p = preparer();
  p.store.getState().distribuerBlackjack(10);
  expect(p.store.getState().tirerBlackjack()).toMatchObject({ ok: true, gain: 0, message: 'Bust ! Perdu.',
    joueur: ['K-C', 'K-D', 'K-S'] });
  expect(p.lire().jetons).toBe(990);
  expect(p.lire().blackjackEnCours).toBeUndefined();
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
    etat.resterBlackjack(), etat.acheterAuCasino('abra')]) expect(resultat).toEqual(refus);
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
