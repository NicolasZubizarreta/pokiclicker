// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { compteInitial, creerGestionnaire, creerStockageMemoire, type DonneesRegion } from '../core/sauvegarde';
import { calculerMaxXp } from '../core/recompenses';
import { reglages } from '../core/reglages';
import { creerStoreJeu, type StoreJeu } from './store';
import type { Ton } from './sons';

const stores: StoreJeu[] = [];
beforeEach(() => vi.useFakeTimers());
afterEach(() => { stores.splice(0).forEach(s => s.getState().arreter()); vi.useRealTimers(); });

function preparer(modifier: (region: DonneesRegion) => DonneesRegion = r => r, alea = () => .5,
  autoAttaque = false) {
  const stockage = creerStockageMemoire();
  const horloge = creerHorlogeSimulee();
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: () => 'test' });
  const compte = compteInitial();
  gestionnaire.ecrireCompte({ ...compte, preferences: { autoAttaque,
    arretAuto: { ...reglages.depart.preferences.arretAuto, actif: false } } });
  const ouvrir = () => {
    const store = creerStoreJeu({ stockage, horloge, alea, genererId: () => 'test',
      evenements: { liste: [], parId: () => { throw new Error('Événement inattendu'); } } });
    stores.push(store);
    store.getState().demarrer();
    expect(store.getState().erreur).toBeNull();
    return store;
  };
  ouvrir().getState().arreter();
  const initial = gestionnaire.chargerRegion('test', 'kanto')!.donnees;
  gestionnaire.ecrireRegion('test', 'kanto', modifier({ ...initial, zoneId: 'kanto.route-1' }));
  const store = ouvrir();
  const tons: Ton[] = [];
  const avancer = (ms: number) => {
    for (let t = 0; t < ms; t += 100) { horloge.avancer(100); store.getState().tick(); }
  };
  return { store, ouvrir, avancer, tons, gestionnaire };
}

it('n’émet plus de son à chaque toucher (AC) et permet le désabonnement', () => {
  const { store, tons } = preparer();
  const retirer = store.abonnerSons(ton => tons.push(ton));
  expect(store.getState().attaquer()).toBe(true);
  expect(tons).not.toContain('hit');
  for (let i = 0; i < 100; i++) store.getState().attaquer();
  expect(tons).not.toContain('hit');
  expect(store.getState().attaquer()).toBe(false);
  retirer();
  store.getState().arreter();
  expect(store.getState().attaquer()).toBe(false);
});

it('garde les dégâts de l’auto-clic sans émettre hit', () => {
  const { store, avancer, tons } = preparer(r => ({ ...r, ameliorations: ['leftovers'] }));
  store.abonnerSons(ton => tons.push(ton));
  const degats = vi.fn();
  const retirer = store.abonnerDegats(degats);
  store.getState().basculerAutoClic();
  avancer(reglages.combat.autoClicIntervalleMs);
  expect(degats).toHaveBeenCalled();
  expect(degats.mock.calls[0]![0].valeur).toBeGreaterThan(0);
  expect(tons).not.toContain('hit');
  retirer();
  degats.mockClear();
  avancer(reglages.combat.autoClicIntervalleMs);
  expect(degats).not.toHaveBeenCalled();
});

it('émet coin puis un seul up pour deux montées sur le même K.-O.', () => {
  const { store, avancer, tons } = preparer(r => ({ ...r,
    equipe: r.equipe.slice(0, 2).map(p => ({ ...p, niveau: 99, xp: calculerMaxXp(p.numero, 99) - 1 })) }), () => .5, true);
  store.abonnerSons(ton => tons.push(ton));
  for (let i = 0; i < 200 && tons.length === 0; i++) avancer(100);
  expect(store.getState().equipe.filter(Boolean).map(p => p!.pokemon.niveau)).toEqual([100, 100]);
  expect(tons).toEqual(['coin', 'up']);
});

it('émet catch pour une capture réussie', () => {
  const { store, avancer, tons } = preparer(r => ({ ...r, inventaire: { masterball: 1 } }));
  store.abonnerSons(ton => tons.push(ton));
  store.getState().capturer('masterball');
  avancer(reglages.capture.animationMs);
  expect(tons).toEqual(['catch']);
});

it('émet up à l’obtention du badge', () => {
  const { store, avancer, tons } = preparer(r => ({ ...r, zoneId: 'kanto.arene-d-argenta', etape: 10,
    equipe: r.equipe.map(p => ({ ...p, niveau: 100, numero: 150, sexe: 'sansSexe' })) }), () => .5, true);
  store.abonnerSons(ton => tons.push(ton));
  for (let i = 0; i < 200 && !store.getState().obtentionBadge; i++) avancer(100);
  expect(store.getState().obtentionBadge?.id).toBe('roche');
  expect(tons).toEqual(['coin', 'up']);
});

it('émet un seul up au début de l’évolution', () => {
  const { store, avancer, tons } = preparer(r => ({ ...r,
    equipe: [{ ...r.equipe[0]!, uid: 'a', numero: 1, niveau: 16 }] }));
  store.abonnerSons(ton => tons.push(ton));
  expect(store.getState().evoluer('a')).toBeNull();
  expect(tons).toEqual(['up']);
  avancer(reglages.evolution.animationMs);
  expect(tons).toEqual(['up']);
});

it('émet pc pour les déplacements et échanges réussis seulement', () => {
  const { store, tons } = preparer();
  store.abonnerSons(ton => tons.push(ton));
  const uid = store.getState().equipe[0]!.pokemon.uid;
  const autre = store.getState().equipe[1]!.pokemon.uid;
  expect(store.getState().envoyerAuPc('absent')).not.toBeNull();
  expect(tons).toEqual([]);
  expect(store.getState().envoyerAuPc(uid)).toBeNull();
  expect(store.getState().echanger(uid, autre)).toBeNull();
  expect(store.getState().placerDansEquipe(autre)).toBeNull();
  expect(tons).toEqual(['pc', 'pc', 'pc']);
});

it('émet up pour Bonbon et Jeton Shiny réussis seulement', () => {
  const { store, tons } = preparer(r => ({ ...r, inventaire: { bonbon: 2, shinyToken: 1 } }));
  store.abonnerSons(ton => tons.push(ton));
  const uid = store.getState().equipe[0]!.pokemon.uid;
  expect(store.getState().utiliserObjet('bonbon', uid, 2)).toBeNull();
  expect(store.getState().utiliserJeton(uid)).toBeNull();
  expect(store.getState().utiliserJeton(uid)).not.toBeNull();
  expect(tons).toEqual(['up', 'up']);
});

it('affiche la bannière shiny pendant exactement trois secondes simulées', () => {
  const { store, avancer, gestionnaire, ouvrir } = preparer(r => ({ ...r, equipe: [] }), () => 0);
  store.getState().arreter();
  const compte = gestionnaire.chargerCompte()!.donnees;
  gestionnaire.ecrireCompte({ ...compte, preferences: { ...compte.preferences, autoAttaque: true,
    arretAuto: { ...reglages.depart.preferences.arretAuto, actif: true } } });
  const shiny = ouvrir();
  expect(shiny.getState().banniere).toBe('Shiny apparu ! Auto stoppé !');
  expect(shiny.getState().annonce).toContain('Chromatique en vue');
  for (let i = 0; i < 29; i++) { avancer(100); shiny.getState().tick(); }
  expect(shiny.getState().banniere).toBe('Shiny apparu ! Auto stoppé !');
  avancer(100); shiny.getState().tick();
  expect(shiny.getState().banniere).toBeNull();
});

it('active le son sans champ historique et conserve le basculement sur le même stockage', () => {
  const { store, ouvrir, gestionnaire } = preparer();
  expect(gestionnaire.chargerCompte()!.donnees.preferences.sonActive).toBeUndefined();
  expect(store.getState().sonActive).toBe(true);
  store.getState().basculerSon();
  expect(store.getState().sonActive).toBe(false);
  store.getState().basculerAutoAttaque();
  store.getState().arreter();
  expect(ouvrir().getState().sonActive).toBe(false);
  expect(gestionnaire.chargerCompte()!.donnees.preferences.autoAttaque).toBe(true);
});
