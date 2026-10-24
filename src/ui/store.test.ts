// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { creerGestionnaire, creerStockageMemoire } from '../core/sauvegarde';
import type { DonneesRegion } from '../core/sauvegarde';
import { calculerMaxXp } from '../core/recompenses';
import { reglages } from '../core/reglages';
import { creerStoreJeu } from './store';
import type { StoreJeu } from './store';
import { ERREUR_CONFLIT } from './persistance';
import { equipeDeDepart } from './equipe-de-depart';
import { cheminDecor } from './precharger';
import { kanto } from '../core/regions';
import { genererIdentifiant } from './identifiants';

const stores: StoreJeu[] = [];
beforeEach(() => vi.useFakeTimers());
afterEach(() => { stores.forEach(store => store.getState().arreter()); stores.length = 0; vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
function preparer(stockage = creerStockageMemoire(), alea = () => .1) {
  const horloge = creerHorlogeSimulee();
  const store = creerStoreJeu({ horloge, stockage, alea, genererId: () => 'test' });
  stores.push(store);
  store.getState().demarrer();
  const avancer = (ms = 100) => { horloge.avancer(ms); store.getState().tick(); };
  return { store, horloge, stockage, avancer };
}

function preparerRegion(modifier: (region: DonneesRegion) => DonneesRegion, alea = () => .1) {
  const initial = preparer();
  initial.store.getState().arreter();
  const gestionnaire = creerGestionnaire({ stockage: initial.stockage, horloge: initial.horloge, genererId: () => 'test' });
  gestionnaire.ecrireRegion('test', 'kanto', modifier(gestionnaire.chargerRegion('test', 'kanto')!.donnees));
  return preparer(initial.stockage, alea);
}

function vaincre(partie: ReturnType<typeof preparer>) {
  const etape = partie.store.getState().etape;
  for (let i = 0; i < 10000 && partie.store.getState().etape === etape; i++) {
    partie.store.getState().attaquer();
    partie.avancer();
  }
  expect(partie.store.getState().etape).not.toBe(etape);
}

it('récompense chaque victoire et recharge exactement les niveaux, XP et argent sauvegardés', () => {
  const partie = preparerRegion(region => ({ ...region,
    equipe: region.equipe.map(pokemon => ({ ...pokemon, xp: 1000000 })) }));
  const ecrire = vi.spyOn(partie.stockage, 'ecrire');
  for (let morts = 1; morts <= 4; morts++) {
    const avant = partie.store.getState().equipe;
    vaincre(partie);
    partie.store.getState().equipe.forEach((membre, i) => {
      if (membre) expect(membre.pokemon.niveau).toBe(avant[i]!.pokemon.niveau + 1);
    });
    expect(partie.store.getState().annonce).toBe(`${avant.filter(Boolean).length} Pokémon montent de niveau !`);
    expect(partie.store.getState().argent).toBeGreaterThan(0);
    expect(ecrire).not.toHaveBeenCalled();
    partie.store.getState().fermer();
    expect(ecrire).toHaveBeenCalledTimes(2);
    const region = JSON.parse(partie.stockage.lire('pokiclicker:region:test:kanto')!).donnees;
    expect(region.statistiques.eliminations).toBe(morts);
    expect(region.argent).toBe(partie.store.getState().argent);
    expect(region.equipe).toEqual(partie.store.getState().equipe.filter(Boolean).map(m => m!.pokemon));
    ecrire.mockClear();
  }
  partie.store.getState().arreter();
  const rechargee = preparer(partie.stockage).store.getState();
  expect(rechargee.equipe).toEqual(partie.store.getState().equipe);
  expect(rechargee.argent).toBe(partie.store.getState().argent);
});

it('affiche la recherche pendant les 2 000 ms suivant une victoire et garde les références stables', () => {
  const partie = preparer();
  expect(partie.store.getState().enRecherche).toBe(false);
  vaincre(partie);
  expect(partie.store.getState().enRecherche).toBe(true);
  const { equipe, suite, ennemi, etape } = partie.store.getState();
  for (let i = 0; i < 19; i++) partie.avancer();
  expect(partie.store.getState().enRecherche).toBe(true);
  expect(partie.store.getState().equipe).toBe(equipe);
  expect(partie.store.getState().suite).toBe(suite);
  partie.avancer();
  expect(partie.store.getState().enRecherche).toBe(false);
  expect(partie.store.getState().ennemi).toEqual(ennemi);
  expect(partie.store.getState().etape).toBe(etape);
});

it('annonce le surnom après une montée et efface le message après 1 200 ms de jeu', () => {
  const partie = preparerRegion(region => ({ ...region, equipe: [{ ...region.equipe[0]!,
    surnom: 'Compagnon', xp: calculerMaxXp(region.equipe[0]!.numero, region.equipe[0]!.niveau) - 1 }] }));
  const niveau = partie.store.getState().equipe[0]!.pokemon.niveau;
  vaincre(partie);
  expect(partie.store.getState().annonce).toBe(`Compagnon passe au niveau ${niveau + 1} !`);
  vi.advanceTimersByTime(1200);
  expect(partie.store.getState().annonce).toContain('passe au niveau');
  for (let i = 0; i < 11; i++) partie.avancer();
  expect(partie.store.getState().annonce).toContain('passe au niveau');
  partie.avancer();
  expect(partie.store.getState().annonce).toBeNull();
});

it('remplace une annonce récente et recommence sa durée complète', () => {
  const delaiInitial = reglages.delais.ennemiSuivantMs;
  try {
    reglages.delais.ennemiSuivantMs = 0;
    const partie = preparerRegion(region => ({ ...region,
      equipe: [{ ...region.equipe[0]!, niveau: 50, xp: 1000000, surnom: 'Compagnon' }] }));
    vaincre(partie);
    expect(partie.store.getState().annonce).toBe('Compagnon passe au niveau 51 !');
    reglages.delais.ennemiSuivantMs = 2000;
    vaincre(partie);
    expect(partie.store.getState().annonce).toBe('Compagnon passe au niveau 52 !');
    for (let i = 0; i < 11; i++) partie.avancer();
    expect(partie.store.getState().annonce).toBe('Compagnon passe au niveau 52 !');
    partie.avancer();
    expect(partie.store.getState().annonce).toBeNull();
  } finally { reglages.delais.ennemiSuivantMs = delaiInitial; }
});

it('expose un maximum d’XP nul au niveau 100', () => {
  const { store } = preparerRegion(region => ({ ...region,
    equipe: [{ ...region.equipe[0]!, niveau: 100, xp: 0 }] }));
  expect(store.getState().equipe[0]!.xpMax).toBe(0);
});

it.each([false, true])('accorde cinq bonbons au shiny et joint les annonces si montée : %s', montee => {
  const partie = preparerRegion(region => ({ ...region, equipe: [{ ...region.equipe[0]!,
    surnom: 'Compagnon', xp: montee ? calculerMaxXp(region.equipe[0]!.numero, region.equipe[0]!.niveau) - 1 : 0 }] }), () => 0);
  expect(partie.store.getState().ennemi?.shiny).toBe(true);
  const niveau = partie.store.getState().equipe[0]!.pokemon.niveau;
  vaincre(partie);
  expect(partie.store.getState().annonce).toBe(montee
    ? `Compagnon passe au niveau ${niveau + 1} ! · Chromatique ! +5 Bonbons` : 'Chromatique ! +5 Bonbons');
  partie.store.getState().fermer();
  const region = JSON.parse(partie.stockage.lire('pokiclicker:region:test:kanto')!).donnees;
  expect(region.inventaire.bonbon).toBe(5);
});

it('démarre et sauvegarde une nouvelle partie sans randomUUID', () => {
  const getRandomValues = globalThis.crypto.getRandomValues.bind(globalThis.crypto);
  vi.stubGlobal('crypto', { getRandomValues });
  const stockage = creerStockageMemoire();
  const store = creerStoreJeu({ horloge: creerHorlogeSimulee(), stockage, alea: () => .1, genererId: genererIdentifiant });
  stores.push(store);
  store.getState().demarrer();
  expect(store.getState().erreur).toBeNull();
  expect(store.getState().ennemi).not.toBeNull();
  expect(creerGestionnaire({ stockage, horloge: creerHorlogeSimulee(), genererId: genererIdentifiant }).listerParties()[0]?.id)
    .toMatch(/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/);
});
it('produit aussi un UUID v4 au dernier recours sans crypto', () => {
  vi.stubGlobal('crypto', undefined);
  expect(genererIdentifiant()).toMatch(/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/);
});
it('convertit le décor des données vers son fichier local', () => {
  expect(cheminDecor(kanto.zone('kanto.route-1'))).toBe('img/decors/route-1.webp');
});
it('applique le clic immédiatement mais publie les PV au prochain pas', () => {
  const { store, avancer } = preparer();
  const pv = store.getState().pv;
  const animation = vi.fn();
  store.abonnerDegats(animation);
  store.getState().attaquer();
  expect(animation).toHaveBeenCalledTimes(1);
  expect(store.getState().pv).toBe(pv);
  avancer();
  expect(store.getState().pv).toBeCloseTo(pv - 5 - store.getState().dps / 10);
});
it('accepte douze clics par seconde et refuse le treizième', () => {
  const { store, avancer } = preparer();
  const animation = vi.fn();
  store.abonnerDegats(animation);
  for (let i = 0; i < 13; i++) store.getState().attaquer();
  expect(animation).toHaveBeenCalledTimes(12);
  // Laisser le DPS achever le premier ennemi avant les 2 000 ms d’attente.
  for (let i = 0; i < 1000 && store.getState().etape === 1; i++) avancer(10);
  expect(store.getState().etape).toBe(2);
  for (let i = 0; i < 200; i++) avancer(10);
  store.getState().attaquer();
  expect(animation).toHaveBeenCalledTimes(13);
});
it('ne dépasse pas 100 notifications sur 1 000 ticks en dix secondes, même avec des clics', () => {
  const { store, avancer } = preparer();
  const notification = vi.fn();
  store.subscribe(notification);
  for (let i = 0; i < 1000; i++) { store.getState().attaquer(); avancer(10); }
  expect(notification.mock.calls.length).toBeLessThanOrEqual(101);
  expect(notification.mock.calls.length).toBe(100);
});
it('annonce une seule fois la fin, inscrit le boss et sauvegarde immédiatement', () => {
  const { store, avancer, stockage } = preparer();
  const ecrire = vi.spyOn(stockage, 'ecrire');
  let annonces = 0;
  store.subscribe((etat, avant) => { if (etat.finZone !== avant.finZone) annonces++; });
  for (let i = 0; i < 2000 && store.getState().finZone === null; i++) avancer();
  expect(annonces).toBe(1);
  expect(store.getState().finZone).toBe('Route 1 terminée !');
  expect(store.getState().suite?.raison).toBe('La suite arrive bientôt.');
  const region = JSON.parse(stockage.lire('pokiclicker:region:test:kanto')!).donnees;
  expect(region.bossVaincus).toEqual(['kanto.route-1']);
  expect(region.etape).toBe(1);
  for (let i = 0; i < 2000; i++) avancer();
  expect(annonces).toBe(1);
  expect(ecrire).toHaveBeenCalledTimes(2);
});
it('restaure la zone, l’étape et toute l’équipe avec un nouvel ennemi', () => {
  const premier = preparer();
  while (premier.store.getState().etape < 4) premier.avancer();
  premier.avancer();
  premier.store.getState().fermer();
  premier.store.getState().arreter();
  const second = preparer(premier.stockage);
  expect(second.store.getState().zone?.id).toBe(premier.store.getState().zone?.id);
  expect(second.store.getState().etape).toBe(4);
  expect(second.store.getState().equipe).toEqual(premier.store.getState().equipe);
  expect(second.store.getState().equipe.filter(Boolean).map(m => m!.pokemon)).toEqual(equipeDeDepart().map((pokemon, i) => {
    const actuel = premier.store.getState().equipe[i]!.pokemon;
    return { ...pokemon, niveau: actuel.niveau, xp: actuel.xp, bonheur: actuel.bonheur };
  }));
  expect(second.store.getState().argent).toBe(premier.store.getState().argent);
  expect(second.store.getState().pv).toBe(second.store.getState().ennemi?.pvMax);
});
it('n’écrit rien pour les seuls PV modifiés et sauvegarde un changement après trente secondes', () => {
  const { store, stockage, avancer } = preparer();
  const ecrire = vi.spyOn(stockage, 'ecrire');
  store.getState().attaquer();
  store.getState().fermer();
  expect(ecrire).not.toHaveBeenCalled();
  while (store.getState().etape < 2) avancer();
  vi.advanceTimersByTime(29999);
  expect(ecrire).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(ecrire).toHaveBeenCalledTimes(2);
  store.getState().fermer();
  expect(ecrire).toHaveBeenCalledTimes(2);
});
it.each(['pagehide', 'visibilitychange'])('enregistre à %s et retire les écouteurs à l’arrêt', evenement => {
  const { store, stockage, avancer } = preparer();
  while (store.getState().etape < 2) avancer();
  const ecrire = vi.spyOn(stockage, 'ecrire');
  if (evenement === 'pagehide') window.dispatchEvent(new Event(evenement));
  else {
    const visible = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    document.dispatchEvent(new Event(evenement));
    visible.mockRestore();
  }
  expect(ecrire).toHaveBeenCalledTimes(2);
  while (store.getState().etape < 3) avancer();
  store.getState().arreter();
  window.dispatchEvent(new Event('pagehide'));
  vi.advanceTimersByTime(60000);
  expect(ecrire).toHaveBeenCalledTimes(2);
  expect(vi.getTimerCount()).toBe(0);
});
it('bloque toute écriture après un conflit avec une autre fenêtre', () => {
  const { store, stockage, horloge, avancer } = preparer();
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: () => 'autre' });
  const region = gestionnaire.chargerRegion('test', 'kanto')!;
  gestionnaire.ecrireRegion('test', 'kanto', { ...region.donnees, etape: 5 });
  const intact = stockage.lire('pokiclicker:region:test:kanto');
  const ecrire = vi.spyOn(stockage, 'ecrire');
  while (store.getState().etape < 2) avancer();
  store.getState().fermer();
  avancer();
  expect(store.getState().erreur).toBe(ERREUR_CONFLIT);
  store.getState().fermer();
  vi.advanceTimersByTime(30000);
  expect(ecrire).not.toHaveBeenCalled();
  expect(stockage.lire('pokiclicker:region:test:kanto')).toBe(intact);
});
it.each(['corrompue', 'récente', 'bloquée'])('préserve une sauvegarde %s', cas => {
  const premier = preparer();
  premier.store.getState().arreter();
  const cle = 'pokiclicker:region:test:kanto';
  if (cas === 'corrompue') premier.stockage.ecrire(cle, '{ sauvegarde abîmée');
  if (cas === 'récente') {
    const enveloppe = JSON.parse(premier.stockage.lire(cle)!);
    premier.stockage.ecrire(cle, JSON.stringify({ ...enveloppe, version: 999 }));
  }
  const avant = premier.stockage.lire(cle);
  const ecrire = vi.spyOn(premier.stockage, 'ecrire');
  const lire = cas === 'bloquée' ? vi.spyOn(premier.stockage, 'lire').mockImplementation(() => { throw new Error('stockage bloqué'); }) : null;
  const second = preparer(premier.stockage);
  expect(second.store.getState().erreurChargement).toBe(true);
  second.store.getState().fermer();
  expect(ecrire).not.toHaveBeenCalled();
  lire?.mockRestore();
  expect(premier.stockage.lire(cle)).toBe(avant);
});
