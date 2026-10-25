import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { calculerDpsEquipe, creerCombat } from '../core/combat';
import { objetsActifs } from '../core/boutique';
import { kanto } from '../core/regions';
import { reglages } from '../core/reglages';
import { compteInitial, creerGestionnaire, creerStockageMemoire, versMembreEquipe } from '../core/sauvegarde';
import type { DonneesRegion, Stockage } from '../core/sauvegarde';
import { creerStoreJeu } from './store';
import { afficherEvolution } from './store-evolution';

describe('afficherEvolution', () => {
  it('expose les deux espèces jusqu’à la fin exacte de l’animation', () => {
    const evolution = { uid: 'bulbi', ancien: 1, nouveau: 2 };
    expect(afficherEvolution(evolution, 3000, 0)).toEqual(evolution);
    expect(afficherEvolution(evolution, 3000, 2999)).toEqual(evolution);
    expect(afficherEvolution(evolution, 3000, 3000)).toBeNull();
    expect(afficherEvolution(evolution, 3000, 3100)).toBeNull();
    expect(evolution).toEqual({ uid: 'bulbi', ancien: 1, nouveau: 2 });
  });

  it('reste vide avant toute évolution', () => {
    expect(afficherEvolution(null, 0, 0)).toBeNull();
  });
});

const stores: ReturnType<typeof creerStoreJeu>[] = [];
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  stores.splice(0).forEach(store => store.getState().arreter());
  vi.useRealTimers();
});

function ouvrir(stockage: Stockage) {
  const horloge = creerHorlogeSimulee();
  const store = creerStoreJeu({ stockage, horloge, alea: () => 0.5, genererId: () => 'test' });
  stores.push(store);
  store.getState().demarrer();
  expect(store.getState().erreur).toBeNull();
  return { store, avancer: () => { horloge.avancer(100); store.getState().tick(); } };
}

function preparer(numero = 1, niveau = 16, inventaire: DonneesRegion['inventaire'] = {}, pierreEternelle = false) {
  const stockage = creerStockageMemoire();
  const horloge = creerHorlogeSimulee();
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: () => 'test' });
  const compte = compteInitial();
  gestionnaire.ecrireCompte({ ...compte, preferences: { ...compte.preferences, autoAttaque: true,
    arretAuto: { ...reglages.depart.preferences.arretAuto, actif: false } } });
  ouvrir(stockage).store.getState().arreter();
  const initial = gestionnaire.chargerRegion('test', 'kanto')!.donnees;
  const region = { ...initial, zoneId: 'kanto.route-1', etape: 1, inventaire,
    bossVaincus: kanto.zones.map(zone => zone.id),
    equipe: [{ ...initial.equipe[0]!, uid: 'bulbi', numero, niveau, pierreEternelle }] };
  gestionnaire.ecrireRegion('test', 'kanto', region);
  return { ...ouvrir(stockage), stockage, region };
}

describe('évolution dans le store', () => {
  it('évolue, annonce, expose les sprites et recharge la cible et le Pokédex', () => {
    const { store, stockage } = preparer();
    expect(store.getState().evoluer('bulbi')).toBeNull();
    expect(store.getState().equipe[0]!.pokemon.numero).toBe(2);
    expect(store.getState().annonce).toBe('Évolution !');
    expect(store.getState().evolution).toEqual({ uid: 'bulbi', ancien: 1, nouveau: 2 });
    store.getState().arreter();
    const recharge = ouvrir(stockage).store.getState();
    expect(recharge.equipe[0]!.pokemon.numero).toBe(2);
    expect(recharge.pokedex).toContain(2);
  });

  it('suspend tout le DPS pendant trente ticks puis reprend au suivant', () => {
    const { store, avancer } = preparer();
    expect(reglages.evolution.animationMs).toBe(3000);
    expect(store.getState().autoAttaque).toBe(true);
    expect(store.getState().evoluer('bulbi')).toBeNull();
    const pv = store.getState().pv;
    expect(store.getState().dps).toBeGreaterThan(0);
    for (let i = 0; i < 30; i++) {
      avancer();
      expect(store.getState().pv).toBe(pv);
      expect(store.getState().autoAttaque).toBe(true);
      if (i < 29) expect(store.getState().evolution).not.toBeNull();
    }
    expect(store.getState().evolution).toBeNull();
    avancer();
    expect(store.getState().pv).toBeLessThan(pv);
  });

  it('recalcule le DPS affiché avec les statistiques de la cible', () => {
    const { store, region } = preparer();
    const lieu = kanto.zone(region.zoneId);
    if (lieu.sansCombat) throw new Error('Zone sans combat');
    const combat = creerCombat(lieu, region.equipe.map(versMembreEquipe),
      () => 0.5, objetsActifs(region));
    const cible = region.equipe.map(p => versMembreEquipe({ ...p, numero: 2 }));
    const attendu = calculerDpsEquipe(cible, combat.ennemi, combat.actifs);
    expect(attendu).not.toBe(store.getState().dps);
    expect(store.getState().evoluer('bulbi')).toBeNull();
    expect(store.getState().dps).toBe(attendu);
    expect(store.getState().equipe[0]!.dps).toBe(attendu);
  });

  it.each([[25, 'thunderStone', 26], [133, 'waterStone', 134]] as const)(
    'fait évoluer %i avec %s et sauvegarde la consommation', (numero, pierre, cible) => {
      const { store, stockage } = preparer(numero, 16, { [pierre]: 1 });
      expect(store.getState().utiliserPierre('bulbi', pierre)).toBeNull();
      expect(store.getState().equipe[0]!.pokemon.numero).toBe(cible);
      store.getState().arreter();
      expect(ouvrir(stockage).store.getState().equipe[0]!.pokemon.numero).toBe(cible);
      expect(JSON.parse(stockage.lire('pokiclicker:region:test:kanto')!).donnees.inventaire[pierre]).toBe(0);
    });

  it.each([[19, 1, 'Pokémon incompatible !'], [25, 0, 'Plus de pierre !']] as const)(
    'refuse la pierre pour %i avec un stock de %i sans mutation', (numero, stock, raison) => {
      const { store, stockage } = preparer(numero, 16, { thunderStone: stock });
      const avant = stockage.lire('pokiclicker:region:test:kanto');
      expect(store.getState().utiliserPierre('bulbi', 'thunderStone')).toBe(raison);
      expect(store.getState().equipe[0]!.pokemon.numero).toBe(numero);
      expect(store.getState().evolution).toBeNull();
      expect(stockage.lire('pokiclicker:region:test:kanto')).toBe(avant);
      store.getState().arreter();
      ouvrir(stockage);
      expect(JSON.parse(stockage.lire('pokiclicker:region:test:kanto')!).donnees.inventaire.thunderStone).toBe(stock);
    });

  it('rend Salamèche évoluable après deux niveaux de Bonbon sans le faire évoluer', () => {
    const { store } = preparer(4, 14, { bonbon: 2 });
    expect(store.getState().equipe[0]!.evolution).toBeNull();
    expect(store.getState().utiliserObjet('bonbon', 'bulbi', 2)).toBeNull();
    expect(store.getState().equipe[0]!.pokemon).toMatchObject({ numero: 4, niveau: 16 });
    expect(store.getState().equipe[0]!.evolution).toBe(5);
    expect(store.getState().evolution).toBeNull();
  });

  it('conserve seulement la pause restante après un déplacement', () => {
    const { store, avancer } = preparer();
    expect(store.getState().evoluer('bulbi')).toBeNull();
    for (let i = 0; i < 10; i++) avancer();
    store.getState().allerVers('kanto.foret-de-jade');
    expect(store.getState().zone?.id).toBe('kanto.foret-de-jade');
    const pv = store.getState().pv;
    expect(pv).toBeGreaterThan(0);
    expect(store.getState().autoAttaque).toBe(true);
    for (let i = 0; i < 20; i++) {
      avancer();
      expect(store.getState().pv).toBe(pv);
    }
    expect(store.getState().evolution).toBeNull();
    avancer();
    expect(store.getState().pv).toBeLessThan(pv);
  });

  it.each([[15, false, 'Évolution indisponible !'], [16, true, 'Évolution bloquée !']] as const)(
    'refuse au niveau %i avec Stase %s sans changer la partie', (niveau, stase, raison) => {
      const { store, stockage } = preparer(1, niveau, {}, stase);
      const avant = store.getState();
      const sauvegarde = stockage.lire('pokiclicker:region:test:kanto');
      expect(avant.evoluer('bulbi')).toBe(raison);
      expect(store.getState().equipe).toEqual(avant.equipe);
      expect(store.getState().pokedex).toEqual(avant.pokedex);
      expect(store.getState().dps).toBe(avant.dps);
      expect(store.getState().evolution).toBeNull();
      expect(stockage.lire('pokiclicker:region:test:kanto')).toBe(sauvegarde);
    });
});
