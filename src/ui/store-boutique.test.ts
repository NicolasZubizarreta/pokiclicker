import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chargerObjets } from '../core/boutique';
import { calculerClic } from '../core/combat';
import { kanto } from '../core/regions';
import { reglages } from '../core/reglages';
import type { DonneesRegion, Stockage } from '../core/sauvegarde';
import { creerStoreJeu } from './store';
import { afficherBoutique, afficherSac } from './store-boutique';

const persiste = vi.hoisted(() => ({ region: null as unknown as DonneesRegion }));
vi.mock('./persistance', () => ({
  detailErreur: String,
  ouvrirPartie: () => ({ region: structuredClone(persiste.region), pokedex: [1],
    preferences: { ...structuredClone(reglages.depart.preferences), autoAttaque: false,
      arretAuto: { ...reglages.depart.preferences.arretAuto, actif: false } },
    enregistrer: (region: DonneesRegion) => { persiste.region = structuredClone(region); },
    enregistrerPreferences: vi.fn() }),
}));
vi.mock('./precharger', () => ({ cheminDecor: () => '', precharger: vi.fn(), prechargerZone: vi.fn() }));

let maintenant = 0;
const stores: ReturnType<typeof creerStoreJeu>[] = [];
function ouvrir() {
  const store = creerStoreJeu({ horloge: { maintenant: () => maintenant }, stockage: {} as Stockage,
    alea: () => 0.5, genererId: () => 'test' });
  stores.push(store);
  store.getState().demarrer();
  expect(store.getState().erreur).toBeNull();
  return store;
}
function avancer(store: ReturnType<typeof creerStoreJeu>, ms: number) {
  for (let t = 0; t < ms; t += 100) { maintenant += 100; store.getState().tick(); }
}

beforeEach(() => {
  vi.useFakeTimers();
  maintenant = 0;
  persiste.region = {
    ...structuredClone(reglages.depart.region), zoneId: 'kanto.route-1', etape: 1,
    regionId: 'kanto', objetsCles: [], quetes: [], drapeaux: [], evenementsJoues: [], ligueGagnee: 0,
    argent: 1000000, inventaire: { bonbon: 5 }, badges: [],
    bossVaincus: kanto.zones.map(z => z.id),
    equipe: [{ uid: 'a', numero: 1, niveau: 5, xp: 0, shiny: false, bonheur: 0,
      pierreEternelle: false, calcium: 0, sexe: 'male', favori: false }],
  };
});
afterEach(() => { stores.splice(0).forEach(s => s.getState().arreter()); vi.useRealTimers(); });

describe('boutique et sac du store', () => {
  it('mémorise les affichages sans modifier la région et expose prix, stock et utilisation', () => {
    const region = structuredClone(persiste.region);
    const boutique = afficherBoutique(region, null);
    const sac = afficherSac(region, null);
    expect(boutique.acces.ouvert).toBe(true);
    expect(boutique.objets.find(o => o.id === 'pokeball')).toMatchObject({ stock: 0, abordable: true, unique: false });
    expect(sac.entrees.find(o => o.id === 'candy')).toMatchObject({ quantite: 5, utilisable: 'bonbon', actif: false });
    expect(afficherBoutique(region, boutique)).toBe(boutique);
    expect(afficherSac(region, sac)).toBe(sac);
    expect(region).toEqual(persiste.region);
    const ferme = { ...region, bossVaincus: [] };
    expect(afficherBoutique(ferme, boutique)).toMatchObject({ acces: { ouvert: false, raison: reglages.shop.raison }, objets: [] });
  });

  it('achète, annonce et recharge les mêmes argent et inventaire ; refuse sans mutation', () => {
    const store = ouvrir();
    const prix = store.getState().boutique.objets.find(o => o.id === 'pokeball')!.prix;
    expect(store.getState().acheter('pokeball', 2)).toBeNull();
    expect(store.getState().argent).toBe(1000000 - prix * 2);
    expect(store.getState().annonce).toBe(`Pokéball ×2 acheté. ${prix * 2} pièces dépensées.`);
    expect(ouvrir().getState().sac.entrees.find(o => o.id === 'pokeball')!.quantite).toBe(2);
    expect(ouvrir().getState().argent).toBe(store.getState().argent);
    const avant = structuredClone(persiste.region);
    expect(store.getState().acheter('pokeball', 0)).toBe('Quantité invalide.');
    expect(store.getState().acheter('inconnu', 1)).toBeTruthy();
    expect(store.getState().acheter('repel', 1)).toBeTruthy();
    expect(persiste.region).toEqual(avant);
  });

  it('applique Protéine immédiatement et après reprise et création de combat', () => {
    const store = ouvrir();
    const base = calculerClic(store.getState().dps);
    expect(store.getState().acheter('protein', 1)).toBeNull();
    expect(store.getState().acheter('protein', 1)).toBe('Déjà possédé.');
    for (const s of [store, ouvrir()]) {
      s.getState().attaquer();
      avancer(s, 100);
      expect(s.getState().evenementsDegats[0]?.valeur).toBe(Math.floor(base * 1.5));
      s.getState().allerVers('kanto.route-1');
      s.getState().attaquer();
      avancer(s, 100);
      expect(s.getState().evenementsDegats[0]?.valeur).toBe(Math.floor(base * 1.5));
    }
  });

  it('applique les Chaussures : recherche terminée après 1000 ms', () => {
    const store = ouvrir();
    expect(store.getState().acheter('runningShoes', 1)).toBeNull();
    const coups = Math.ceil(store.getState().pv / calculerClic(store.getState().dps));
    for (let i = 0; i < coups; i++) {
      if (i > 0 && i % reglages.combat.clicsMaxParSeconde === 0) avancer(store, 1000);
      store.getState().attaquer();
    }
    avancer(store, 100);
    expect(store.getState().enRecherche).toBe(true);
    avancer(store, 800);
    expect(store.getState().enRecherche).toBe(true);
    avancer(store, 100);
    expect(store.getState().enRecherche).toBe(false);
  });

  it('Restes produit neuf coups en une seconde, partage le limiteur et reste éteint au rechargement', () => {
    const store = ouvrir();
    store.getState().basculerAutoClic();
    expect(store.getState().autoClic).toEqual({ possede: false, actif: false });
    expect(store.getState().acheter('leftovers', 1)).toBeNull();
    store.getState().allerVers(kanto.zones.filter(z => !z.sansCombat).at(-1)!.id);
    store.getState().basculerAutoClic();
    const coups = vi.fn();
    store.abonnerDegats(coups);
    avancer(store, 1000);
    expect(coups).toHaveBeenCalledTimes(9);
    for (let i = 0; i < 4; i++) store.getState().attaquer();
    expect(coups).toHaveBeenCalledTimes(12);
    expect(ouvrir().getState().autoClic).toEqual({ possede: true, actif: false });
  });

  it('consomme les Bonbons et le Calcium par modifierEquipe et sauvegarde les niveaux sans changer XP', () => {
    persiste.region.inventaire.calcium = 1;
    const store = ouvrir();
    expect(store.getState().utiliserObjet('bonbon', 'a', 2)).toBeNull();
    expect(store.getState().annonce).toBe('+2 niveaux !');
    expect(ouvrir().getState().equipe[0]!.pokemon).toMatchObject({ niveau: 7, xp: 0 });
    expect(persiste.region.inventaire.bonbon).toBe(3);
    expect(store.getState().utiliserObjet('calcium', 'a', 1)).toBeNull();
    expect(store.getState().annonce).toBe('+2 % DPS permanent');
    expect(persiste.region.equipe[0]!.calcium).toBe(1);
    expect(store.getState().utiliserObjet('bonbon', 'absent', 1)).toBe('Pokémon invalide !');
  });

  it('calcule les prix avec badges et remise et affiche les améliorations actives dans le sac', () => {
    persiste.region.ameliorations = ['protein'];
    persiste.region.badges = ['roche'];
    persiste.region.jalonsRecus = [70];
    const boutique = afficherBoutique(persiste.region, null);
    const base = chargerObjets().find(o => o.id === 'pokeball')!.prix;
    expect(boutique.objets.find(o => o.id === 'pokeball')!.prix).toBe(Math.floor(Math.floor(base * 1.05) * 0.85));
    expect(afficherSac(persiste.region, null).entrees.find(o => o.id === 'protein')).toMatchObject({ actif: true, utilisable: null });
  });
});
