import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { calculerClic } from '../core/combat';
import { kanto } from '../core/regions';
import { compteInitial, creerGestionnaire, creerStockageMemoire } from '../core/sauvegarde';
import type { DonneesRegion } from '../core/sauvegarde';
import { creerStoreJeu } from './store';
import { afficherEffets, afficherFauchage, entreesRadar } from './store-objets';
import { afficherSac } from './store-boutique';

const stores: ReturnType<typeof creerStoreJeu>[] = [];
beforeEach(() => vi.useFakeTimers());
afterEach(() => { stores.splice(0).forEach(s => s.getState().arreter()); vi.useRealTimers(); });

function preparer(partiel: Partial<DonneesRegion> = {}) {
  const stockage = creerStockageMemoire();
  const horloge = creerHorlogeSimulee(1000);
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: () => 'test' });
  const compte = compteInitial();
  gestionnaire.ecrireCompte({ ...compte, preferences: { ...compte.preferences, autoAttaque: false } });
  const ouvrir = () => {
    const store = creerStoreJeu({ stockage, horloge, alea: () => 0.5, genererId: () => 'test' });
    stores.push(store);
    store.getState().demarrer();
    expect(store.getState().erreur).toBeNull();
    return store;
  };
  ouvrir().getState().arreter();
  const initial = gestionnaire.chargerRegion('test', 'kanto')!.donnees;
  const region = { ...initial, zoneId: 'kanto.route-1', etape: 1,
    bossVaincus: kanto.zones.map(z => z.id),
    inventaire: { xAttack: 2, xSpecial: 1, repel: 1, superRepel: 1, pokeDoll: 1, everstone: 1, shinyToken: 1 },
    equipe: [{ ...initial.equipe[0]!, uid: 'a', numero: 1, niveau: 5 }], ...partiel };
  gestionnaire.ecrireRegion('test', 'kanto', region);
  const store = ouvrir();
  const avancer = (ticks: number) => {
    for (let i = 0; i < ticks; i++) { horloge.avancer(100); store.getState().tick(); }
  };
  const sauvee = () => gestionnaire.chargerRegion('test', 'kanto')!.donnees;
  return { store, ouvrir, avancer, horloge, region, sauvee };
}

describe('objets du store', () => {
  it('applique Attaque + immédiatement, pendant 299 ticks, puis expire au 300e', () => {
    const { store, avancer, sauvee } = preparer();
    const base = calculerClic(store.getState().dps);
    const coups: number[] = [];
    store.abonnerDegats(coup => coups.push(coup.valeur));
    expect(store.getState().utiliserObjetActif('xAttack')).toBeNull();
    expect(sauvee().inventaire.xAttack).toBe(1);
    expect(store.getState().annonce).toBe('Attaque + active !');
    store.getState().attaquer();
    expect(coups.at(-1)).toBe(base * 1.5);
    avancer(299);
    store.getState().attaquer();
    expect(coups.at(-1)).toBe(base * 1.5);
    avancer(1);
    store.getState().attaquer();
    expect(coups.at(-1)).toBe(base);
    expect(store.getState().effets).toEqual([]);
  });

  it('multiplie les DPS affichés par 1,5 puis retrouve la base', () => {
    const { store, avancer } = preparer();
    const base = store.getState().dps;
    expect(store.getState().utiliserObjetActif('xSpecial')).toBeNull();
    expect(store.getState().dps).toBe(base * 1.5);
    expect(store.getState().equipe[0]!.dps).toBe(base * 1.5);
    const pv = store.getState().pv;
    store.getState().basculerAutoAttaque();
    avancer(1);
    expect(store.getState().pv).toBeCloseTo(pv - base * 1.5 / 10);
    store.getState().basculerAutoAttaque();
    avancer(299);
    expect(store.getState().dps).toBe(base);
  });

  it('garde les effets lors des achats, changements de zone et reprises', () => {
    const { store, ouvrir, sauvee } = preparer({ argent: 1000000 });
    expect(store.getState().utiliserObjetActif('xAttack')).toBeNull();
    expect(store.getState().acheter('protein', 1)).toBeNull();
    for (const s of [store, ouvrir()]) {
      s.getState().allerVers('kanto.route-1');
      const coups: number[] = [];
      s.abonnerDegats(coup => coups.push(coup.valeur));
      s.getState().attaquer();
      expect(coups[0]).toBe(Math.floor(calculerClic(s.getState().dps) * 1.5) * 1.5);
    }
    expect(sauvee().chronos.finBoostAttaque).toBe(31000);
  });

  it('reprend Repousse à 15 s après 10 s de jeu et 5 s fermé', () => {
    const { store, avancer, horloge, ouvrir } = preparer();
    expect(store.getState().utiliserObjetActif('repel')).toBeNull();
    const effets = store.getState().effets;
    avancer(1);
    expect(store.getState().effets).toBe(effets);
    avancer(99);
    store.getState().arreter();
    horloge.avancer(5000);
    expect(ouvrir().getState().effets).toEqual([{ id: 'repel', pastille: 'Repousse', restantS: 15 }]);
  });

  it('fauche, sauvegarde la recharge et la retrouve après rechargement', () => {
    const { store, avancer, ouvrir, sauvee } = preparer({ ameliorations: ['falseSwipe', 'pokeradar'] });
    expect(store.getState().radar).toBe(true);
    expect(store.getState().faucher()).toBeNull();
    expect(store.getState().fauchage).toEqual({ possede: true, disponible: false,
      raison: 'Recharge : 30 s', rechargeS: 30, actif: true });
    expect(sauvee().chronos.rechargeFauchage).toBe(31000);
    const recharge = ouvrir();
    expect(recharge.getState().fauchage.rechargeS).toBe(30);
    expect(recharge.getState().fauchage.actif).toBe(false);
    avancer(300);
    expect(store.getState().fauchage.rechargeS).toBe(0);
    expect(store.getState().fauchage.disponible).toBe(true);
    expect(ouvrir().getState().fauchage.rechargeS).toBe(0);
  });

  it('invoque et sauvegarde le boss à l’étape 10', () => {
    const { store, sauvee, ouvrir } = preparer({ ameliorations: ['falseSwipe'] });
    expect(store.getState().utiliserObjetActif('pokeDoll')).toBeNull();
    expect(store.getState().ennemi?.boss).toBe(true);
    expect(store.getState().etape).toBe(10);
    expect(sauvee().etape).toBe(10);
    expect(sauvee().inventaire.pokeDoll).toBe(0);
    expect(ouvrir().getState().etape).toBe(10);
    expect(store.getState().faucher()).toBe('Inutile sur un boss !');
  });

  it('refuse sans consommer : stock vide, boss non vaincu et lieu sans combat', () => {
    const { store, sauvee } = preparer({ bossVaincus: [] });
    expect(store.getState().utiliserObjetActif('inconnu')).toBe('Objet invalide !');
    expect(store.getState().utiliserObjetActif('pokeDoll')).toBe('Boss non vaincu !');
    expect(store.getState().faucher()).toBe('Nécessite la CT Fauchage.');
    expect(store.getState().utiliserObjetActif('repel')).toBeNull();
    const avant = sauvee();
    expect(store.getState().utiliserObjetActif('repel')).toBe('Quantité invalide.');
    expect(sauvee()).toEqual(avant);
    const ville = preparer({ zoneId: kanto.zones.find(z => z.sansCombat)!.id });
    expect(ville.store.getState().utiliserObjetActif('pokeDoll')).toBe('Aucun boss ici.');
    expect(ville.sauvee().inventaire.pokeDoll).toBe(1);
    expect(ville.store.getState().fauchage.disponible).toBe(false);
  });

  it('équipe, retire la Stase et utilise un Jeton avec sauvegarde immédiate', () => {
    const { store, sauvee } = preparer();
    const base = store.getState().dps;
    expect(store.getState().poserStase('a')).toBeNull();
    expect(store.getState().annonce).toBe('Pierre Stase équipée !');
    expect(store.getState().dps).toBe(base * 1.25);
    expect(sauvee().equipe[0]!.pierreEternelle).toBe(true);
    expect(store.getState().poserStase('a')).toBe('Retire-la via le menu !');
    expect(store.getState().retirerStase('a')).toBeNull();
    expect(sauvee().inventaire.everstone).toBe(1);
    expect(store.getState().dps).toBe(base);
    expect(store.getState().utiliserJeton('a')).toBeNull();
    expect(sauvee().equipe[0]!.shiny).toBe(true);
    expect(sauvee().inventaire.shinyToken).toBe(0);
    expect(store.getState().annonce).toBe('Chromatique !');
    expect(store.getState().utiliserJeton('a')).toBe('Déjà chromatique !');
  });

  it('expose les nouveaux usages du Sac', () => {
    const { region } = preparer();
    const sac = afficherSac(region, null);
    for (const id of ['repel', 'superRepel', 'xAttack', 'xSpecial', 'pokeDoll']) {
      expect(sac.entrees.find(e => e.id === id)?.utilisable).toBe('direct');
    }
    expect(sac.entrees.find(e => e.id === 'everstone')?.utilisable).toBe('stase');
    expect(sac.entrees.find(e => e.id === 'shinyToken')?.utilisable).toBe('jeton');
  });

  it('mémorise les affichages purs et liste uniquement les sauvages du radar', () => {
    const { region } = preparer();
    const avant = structuredClone(region);
    const effets = afficherEffets(region, 1000, null);
    expect(afficherEffets(region, 1000, effets)).toBe(effets);
    const fauchage = afficherFauchage(region, null, 1000, null);
    expect(afficherFauchage(region, null, 1000, fauchage)).toBe(fauchage);
    const zone = kanto.zone(region.zoneId);
    if (zone.sansCombat) throw new Error('Zone sans combat');
    const radar = entreesRadar(zone, []);
    expect(radar).toHaveLength(zone.sauvages.length);
    expect(radar.every(e => !e.vu && e.nom.length > 0 && e.libelle.length > 0)).toBe(true);
    expect(entreesRadar(zone, [radar[0]!.numero])[0]!.vu).toBe(true);
    expect(region).toEqual(avant);
  });
});
