import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { kanto } from '../core/regions';
import { reglages } from '../core/reglages';
import { compteInitial, creerGestionnaire, creerStockageMemoire } from '../core/sauvegarde';
import type { DonneesRegion, Stockage } from '../core/sauvegarde';
import { deblocagesAtteints } from '../core/deblocages';
import { chargerEvenements } from '../core/evenements';
import { creerStoreJeu } from './store';
import { cleEvolution, phaseModal, proposerModal, prochaineEvolutionAuto } from './store-evolution';

const stores: ReturnType<typeof creerStoreJeu>[] = [];
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  stores.splice(0).forEach(store => store.getState().arreter());
  vi.useRealTimers();
});

function ouvrir(stockage: Stockage) {
  const horloge = creerHorlogeSimulee();
  const store = creerStoreJeu({ stockage, horloge, alea: () => 0.5, genererId: () => 'test',
    evenements: chargerEvenements({ test: { version: 1, evenements: [] } }, kanto) });
  stores.push(store);
  store.getState().demarrer();
  expect(store.getState().erreur).toBeNull();
  return { store, avancer: () => { horloge.avancer(100); store.getState().tick(); } };
}

function preparer(numero = 1, niveau = 16, inventaire: DonneesRegion['inventaire'] = {}) {
  const stockage = creerStockageMemoire();
  const horloge = creerHorlogeSimulee();
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: () => 'test' });
  const compte = compteInitial();
  gestionnaire.ecrireCompte({ ...compte, preferences: { ...compte.preferences, autoAttaque: true,
    arretAuto: { ...reglages.depart.preferences.arretAuto, actif: false } } });
  ouvrir(stockage).store.getState().arreter();
  const initial = gestionnaire.chargerRegion('test', 'kanto')!.donnees;
  const region = { ...initial, zoneId: 'kanto.route-1', etape: 1, inventaire, starterId: 6, evenementsJoues: ['kanto.intro'],
    bossVaincus: kanto.zones.map(zone => zone.id),
    equipe: [{ ...initial.equipe[0]!, uid: 'bulbi', numero, niveau, pierreEternelle: false }] };
  gestionnaire.ecrireRegion('test', 'kanto', { ...region, annoncesVues: deblocagesAtteints(region, kanto) });
  return { ...ouvrir(stockage), stockage, region };
}

/** Avance jusqu'à la condition, en fermant les annonces de déblocage qui occupent l'écran avant la fenêtre. */
function jusqu(store: ReturnType<typeof preparer>['store'], avancer: () => void, condition: () => boolean) {
  for (let i = 0; i < 600 && !condition(); i++) {
    if (store.getState().deblocageCarte !== null) store.getState().fermerDeblocage();
    avancer();
  }
  expect(condition()).toBe(true);
}

describe('évolution automatique : logique', () => {
  it('propose le premier Pokémon prêt, dans l’ordre de l’équipe, sans les refusés, œufs ni Pierre Stase', () => {
    const { region } = preparer();
    const a = region.equipe[0]!;
    const b = { ...a, uid: 'second' };
    expect(prochaineEvolutionAuto([], new Set())).toBeNull();
    expect(prochaineEvolutionAuto([{ ...a, niveau: 15 }], new Set())).toBeNull();
    expect(prochaineEvolutionAuto([a, b], new Set())?.uid).toBe('bulbi');
    expect(prochaineEvolutionAuto([a, b], new Set([cleEvolution(a)]))?.uid).toBe('second');
    expect(prochaineEvolutionAuto([a, b], new Set([cleEvolution(a), cleEvolution(b)]))).toBeNull();
    // Le refus ne vaut que pour l'espèce : après une évolution la clé change.
    expect(prochaineEvolutionAuto([{ ...a, numero: 2, niveau: 36 }], new Set([cleEvolution(a)]))?.uid).toBe('bulbi');
    expect(prochaineEvolutionAuto([{ ...a, pierreEternelle: true }], new Set())).toBeNull();
    expect(prochaineEvolutionAuto([{ ...a, oeuf: { pasRestants: 10, pasMax: 10 } }], new Set())).toBeNull();
  });

  it('passe de l’animation au message final à la fin exacte de la durée', () => {
    const { region } = preparer();
    const modal = { ...proposerModal(region.equipe[0]!, 2), phase: 'animation' as const };
    expect(modal.nomAncien).toBe('Bulbizarre');
    expect(modal.nomNouveau).toBe('Herbizarre');
    expect(phaseModal(modal, 3000, 2999)?.phase).toBe('animation');
    expect(phaseModal(modal, 3000, 3000)?.phase).toBe('fin');
    expect(phaseModal(null, 0, 0)).toBeNull();
    const proposition = proposerModal(region.equipe[0]!, 2);
    expect(phaseModal(proposition, 0, 10_000)).toBe(proposition);
  });
});

describe('évolution automatique : store', () => {
  it('ouvre la fenêtre toute seule, sans toast ni animation dans le cadre', () => {
    const { store, avancer } = preparer();
    jusqu(store, avancer, () => store.getState().modalEvolution !== null);
    expect(store.getState().evolutionAuto).toBe(true);
    expect(store.getState().modalEvolution).toMatchObject({ uid: 'bulbi', phase: 'proposition', vers: 2, nom: 'Bulbizarre' });
    expect(store.getState().annonce).toBeNull();
    expect(store.getState().equipe[0]!.pokemon.numero).toBe(1);
  });

  it('« Plus tard » n’évolue pas, ne rouvre pas seule, et reste ouvrable depuis la fiche', () => {
    const { store, avancer } = preparer();
    jusqu(store, avancer, () => store.getState().modalEvolution !== null);
    store.getState().reporterEvolution();
    expect(store.getState().modalEvolution).toBeNull();
    for (let i = 0; i < 20; i++) avancer();
    expect(store.getState().modalEvolution).toBeNull();
    expect(store.getState().equipe[0]!.pokemon.numero).toBe(1);
    expect(store.getState().equipe[0]!.evolution).toBe(2);
    expect(store.getState().demanderEvolution('bulbi')).toBeNull();
    expect(store.getState().modalEvolution).toMatchObject({ uid: 'bulbi', phase: 'proposition' });
  });

  it('« Confirmer » évolue, joue l’animation dans la fenêtre puis affiche le message final', () => {
    const { store, avancer } = preparer();
    jusqu(store, avancer, () => store.getState().modalEvolution !== null);
    store.getState().confirmerEvolution();
    expect(store.getState().equipe[0]!.pokemon.numero).toBe(2);
    expect(store.getState().pokedex).toContain(2);
    expect(store.getState().evolution).toBeNull();
    expect(store.getState().annonce).not.toBe('Évolution !');
    expect(store.getState().modalEvolution?.phase).toBe('animation');
    for (let i = 0; i < 29; i++) avancer();
    expect(store.getState().modalEvolution?.phase).toBe('animation');
    avancer(); avancer();
    expect(store.getState().modalEvolution).toMatchObject({ phase: 'fin', nomAncien: 'Bulbizarre', nomNouveau: 'Herbizarre' });
    store.getState().fermerEvolution();
    expect(store.getState().modalEvolution).toBeNull();
  });

  it('« Passer l’animation » affiche tout de suite le message final', () => {
    const { store, avancer } = preparer();
    jusqu(store, avancer, () => store.getState().modalEvolution !== null);
    store.getState().confirmerEvolution();
    store.getState().passerAnimationEvolution();
    expect(store.getState().modalEvolution?.phase).toBe('fin');
  });

  it('option désactivée : comportement d’origine (toast, cadre prêt, évolution rapide dans le cadre)', () => {
    const { store, avancer } = preparer();
    store.getState().reglerEvolutionAuto(false);
    jusqu(store, avancer, () => store.getState().annonce === 'Bulbizarre peut évoluer !');
    expect(store.getState().evolutionAuto).toBe(false);
    expect(store.getState().modalEvolution).toBeNull();
    expect(store.getState().annonce).toBe('Bulbizarre peut évoluer !');
    expect(store.getState().equipe[0]!.evolution).toBe(2);
    expect(store.getState().demanderEvolution('bulbi')).toBeNull();
    expect(store.getState().modalEvolution).toBeNull();
    expect(store.getState().equipe[0]!.pokemon.numero).toBe(2);
    expect(store.getState().evolution).toEqual({ uid: 'bulbi', ancien: 1, nouveau: 2 });
    expect(store.getState().annonce).toBe('Évolution !');
  });

  it('mémorise l’option dans le compte', () => {
    const { store, stockage } = preparer();
    store.getState().reglerEvolutionAuto(false);
    store.getState().arreter();
    expect(ouvrir(stockage).store.getState().evolutionAuto).toBe(false);
  });

  it('une pierre ouvre la fenêtre seulement à la demande, et refuse un Pokémon incompatible', () => {
    const { store, avancer } = preparer(25, 16, { thunderStone: 1 });
    for (let i = 0; i < 300; i++) { if (store.getState().deblocageCarte !== null) store.getState().fermerDeblocage(); avancer(); }
    expect(store.getState().modalEvolution).toBeNull();
    expect(store.getState().demanderEvolution('bulbi', 'thunderStone')).toBeNull();
    expect(store.getState().modalEvolution).toMatchObject({ vers: 26, pierre: 'thunderStone' });
    store.getState().confirmerEvolution();
    expect(store.getState().equipe[0]!.pokemon.numero).toBe(26);
    expect(store.getState().demanderEvolution('bulbi')).toBe('Évolution indisponible !');
  });
});
