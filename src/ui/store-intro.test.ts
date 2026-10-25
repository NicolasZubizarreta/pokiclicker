import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { creerGestionnaire, creerStockageMemoire } from '../core/sauvegarde';
import { creerStoreJeu, type StoreJeu } from './store';

const stores: StoreJeu[] = [];
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  stores.forEach(store => store.getState().arreter());
  stores.length = 0;
  vi.useRealTimers();
});

function preparer(nouvellePartie: 'intro' | 'equipe-de-depart' = 'intro') {
  const stockage = creerStockageMemoire();
  const horloge = creerHorlogeSimulee();
  let id = 0;
  const genererId = () => `intro-${++id}`;
  const alea = vi.fn(() => .5);
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId });
  const ouvrir = (mode = nouvellePartie) => {
    const store = creerStoreJeu({ stockage, horloge, genererId, alea, nouvellePartie: mode });
    stores.push(store);
    store.getState().demarrer();
    expect(store.getState().erreur).toBeNull();
    return store;
  };
  const lire = () => gestionnaire.chargerRegion(gestionnaire.listerParties()[0]!.id, 'kanto')!.donnees;
  return { store: ouvrir(), ouvrir, lire, alea, horloge };
}

function finirIntro(store: StoreJeu) {
  for (let ligne = 0; ligne < 7; ligne++) store.getState().terminerEtape();
  expect(store.getState().evenement).toBeNull();
}

describe('intro du store', () => {
  it('ouvre une équipe vide, bloque la Route 1 et acquitte la première ligne', () => {
    const { store, lire } = preparer();
    expect(lire().equipe).toEqual([]);
    expect(lire().drapeaux).toContain('nouvelle-partie');
    expect(store.getState().intro).toMatchObject({ enCours: true, premiereLigneVue: false,
      choixStarter: false, sacOuvert: false, carteOuverte: false, starters: [] });
    expect(store.getState().choisirStarter(4)).toEqual(expect.any(String));
    store.getState().allerVers('kanto.route-1');
    expect(store.getState().lieu?.id).toBe('kanto.bourg-palette');
    store.getState().terminerEtape();
    expect(store.getState().evenement).toMatchObject({ type: 'dialogue', evenement: 'kanto.intro' });
    expect(store.getState().intro.premiereLigneVue).toBe(true);
  });

  it('reprend la même ligne sans redonner les cinq Pokéballs et ouvre le Sac par drapeau', () => {
    const { store, ouvrir, lire } = preparer();
    for (let i = 0; i < 3; i++) store.getState().terminerEtape();
    expect(lire().inventaire.pokeball).toBe(5);
    expect(store.getState().sac.acces.ouvert).toBe(true);
    expect(store.getState().intro).toMatchObject({ sacOuvert: true, carteOuverte: false });
    const commande = store.getState().evenement;
    store.getState().arreter();
    const reprise = ouvrir('equipe-de-depart');
    expect(reprise.getState().evenement).toStrictEqual(commande);
    expect(reprise.getState().intro.premiereLigneVue).toBe(true);
    expect(lire().inventaire.pokeball).toBe(5);
    reprise.getState().terminerEtape();
    reprise.getState().terminerEtape();
    expect(reprise.getState().intro.carteOuverte).toBe(true);
    expect(lire().inventaire.pokeball).toBe(5);
  });

  it('tire une fois les starters puis sauvegarde un seul partenaire et libère la Route 1', () => {
    const { store, ouvrir, lire, alea, horloge } = preparer();
    finirIntro(store);
    expect(store.getState().intro).toMatchObject({ enCours: false, choixStarter: true,
      starters: [{ numero: 1, nom: 'Bulbizarre', shiny: false },
        { numero: 4, nom: 'Salamèche', shiny: false }, { numero: 7, nom: 'Carapuce', shiny: false }] });
    expect(alea).toHaveBeenCalledTimes(3);
    const intro = store.getState().intro;
    horloge.avancer(100);
    store.getState().tick();
    expect(store.getState().intro).toBe(intro);
    expect(alea).toHaveBeenCalledTimes(3);
    expect(store.getState().choisirStarter(25)).toEqual(expect.any(String));
    expect(store.getState().choisirStarter(4)).toBeNull();
    expect(lire()).toMatchObject({ starterId: 4, equipe: [{ numero: 4, niveau: 5, xp: 0 }] });
    expect(lire().equipe).toHaveLength(1);
    expect(lire().drapeaux).toContain('starter-choisi');
    expect(store.getState().pokedex).toContain(4);
    expect(store.getState().choisirStarter(1)).toEqual(expect.any(String));
    store.getState().arreter();
    const reprise = ouvrir();
    expect(reprise.getState().intro.choixStarter).toBe(false);
    expect(reprise.getState().equipe.filter(Boolean)).toHaveLength(1);
    expect(reprise.getState().pokedex).toContain(4);
    reprise.getState().allerVers('kanto.route-1');
    expect(reprise.getState().lieu?.id).toBe('kanto.route-1');
  });

  it('reprend le choix après rechargement sans redonner les Pokéballs', () => {
    const { store, ouvrir, lire } = preparer();
    finirIntro(store);
    store.getState().arreter();
    const reprise = ouvrir();
    expect(reprise.getState().intro).toMatchObject({ enCours: false, premiereLigneVue: true, choixStarter: true });
    expect(lire().inventaire.pokeball).toBe(5);
    expect(reprise.getState().choisirStarter(7)).toBeNull();
  });

  it('garde le comportement par défaut sans intro et sans verrou de carte', () => {
    const { store, lire, horloge } = preparer('equipe-de-depart');
    const defaut = creerStoreJeu({ stockage: creerStockageMemoire(), horloge: creerHorlogeSimulee(),
      alea: () => .5, genererId: () => 'defaut' });
    stores.push(defaut);
    defaut.getState().demarrer();
    expect(JSON.parse(JSON.stringify(defaut.getState()))).toStrictEqual(JSON.parse(JSON.stringify(store.getState())));
    expect(lire().drapeaux).not.toContain('nouvelle-partie');
    expect(store.getState().equipe.filter(Boolean)).toHaveLength(3);
    expect(store.getState().evenement).toBeNull();
    expect(store.getState().intro).toMatchObject({ enCours: false, premiereLigneVue: false,
      choixStarter: false, carteOuverte: true, starters: [] });
    expect(store.getState().intro.sacOuvert).toBe(store.getState().sac.acces.ouvert);
    const avant = store.getState();
    horloge.avancer(100);
    store.getState().tick();
    expect(store.getState().equipe).toBe(avant.equipe);
    expect(store.getState().carte).toBe(avant.carte);
    store.getState().allerVers('kanto.route-1');
    expect(store.getState().lieu?.id).toBe('kanto.route-1');
  });
});
