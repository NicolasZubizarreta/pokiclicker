import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import * as combat from '../core/combat';
import { evenementsKanto } from '../core/evenements-kanto';
import { kanto } from '../core/regions';
import { compteInitial, creerGestionnaire, creerStockageMemoire, type DonneesRegion } from '../core/sauvegarde';
import { creerStoreJeu, type StoreJeu } from './store';

const stores: StoreJeu[] = [];
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  stores.forEach(store => store.getState().arreter());
  stores.length = 0;
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function preparer(modifier: (region: DonneesRegion) => DonneesRegion = region => region) {
  const stockage = creerStockageMemoire();
  const horloge = creerHorlogeSimulee();
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: () => 'test' });
  const compte = compteInitial();
  gestionnaire.ecrireCompte({ ...compte, preferences: { ...compte.preferences, autoAttaque: false } });
  gestionnaire.creerPartie('Test', 'kanto.bourg-palette');
  const lire = () => gestionnaire.chargerRegion('test', 'kanto')!.donnees;
  gestionnaire.ecrireRegion('test', 'kanto', modifier({ ...lire(), starterId: 4,
    bossVaincus: kanto.zones.filter(zone => zone.id !== 'kanto.arene-de-carmin').map(zone => zone.id),
    equipe: [{ uid: 'fort', numero: 6, niveau: 100, xp: 0, shiny: false, bonheur: 0,
      pierreEternelle: false, calcium: 0, sexe: 'male', favori: false }] }));
  const ouvrir = () => {
    const store = creerStoreJeu({ stockage, horloge, alea: () => .1, genererId: () => 'test', evenements: evenementsKanto });
    stores.push(store);
    store.getState().demarrer();
    expect(store.getState().erreur).toBeNull();
    return store;
  };
  const store = ouvrir();
  const cliquer = combat.cliquer;
  vi.spyOn(combat, 'cliquer').mockImplementation((etat, limiteur) =>
    cliquer({ ...etat, ennemi: { ...etat.ennemi, pv: 1 } }, limiteur));
  const avancer = (ms = 100) => {
    for (let t = 0; t < ms; t += 100) { horloge.avancer(100); store.getState().tick(); }
  };
  const vaincre = () => {
    const numero = store.getState().ennemi?.numero;
    for (let i = 0; i < 1000 && store.getState().ennemi?.numero === numero; i++) {
      store.getState().attaquer(); avancer();
    }
    expect(store.getState().ennemi?.numero).not.toBe(numero);
  };
  const blue = () => {
    store.getState().allerVers('kanto.arene-de-carmin');
    expect(store.getState().evenement).toMatchObject({ type: 'dialogue', locuteur: 'Blue' });
    store.getState().terminerEtape();
    expect(store.getState().zone?.id).toBe('evenement:kanto.rival-carmin');
    expect(store.getState().nomAdversaire).toBe('Blue (Roucoups)');
    expect(store.getState().capture.possible).toBe(false);
    expect(store.getState().minuteur?.totalMs).toBe(30000);
  };
  return { store, lire, ouvrir, avancer, vaincre, blue };
}

it('joue Blue à Carmin, sans badge, boss, Ligue ni Panthéon, puis reprend l’étape sauvegardée', () => {
  const partie = preparer(region => ({ ...region, zoneId: 'kanto.arene-de-carmin', etape: 7,
    evenementEnCours: { id: 'kanto.rival-carmin', etape: 0, file: [] } }));
  const avant = partie.lire();
  partie.store.getState().terminerEtape();
  for (let i = 0; i < 3; i++) partie.vaincre();
  expect(partie.store.getState().nomAdversaire).toBe('Blue (Carabaffe)');
  expect(partie.lire()).toMatchObject({ zoneId: avant.zoneId, etape: 7 });
  const argent = partie.store.getState().argent;
  partie.vaincre();
  expect(partie.store.getState().argent).toBeGreaterThan(argent);
  expect(partie.store.getState().evenement).toMatchObject({ type: 'dialogue', evenement: 'kanto.rival-carmin', etape: 2 });
  expect(partie.store.getState().zone?.id).toBe('kanto.arene-de-carmin');
  expect(partie.store.getState().etape).toBe(7);
  expect(partie.lire()).toMatchObject({ zoneId: avant.zoneId, etape: 7, badges: avant.badges,
    bossVaincus: avant.bossVaincus, ligueGagnee: avant.ligueGagnee });
  expect(partie.store.getState().obtentionBadge).toBeNull();
  expect(partie.store.getState().pantheon).toBeNull();
  partie.store.getState().terminerEtape();
  expect(partie.lire().evenementsJoues).toContain('kanto.rival-carmin');
  partie.store.getState().allerVers('kanto.bourg-palette');
  partie.store.getState().allerVers('kanto.arene-de-carmin');
  expect(partie.store.getState().evenement).toBeNull();
});

it('reprend Blue au premier Pokémon après expiration et conserve les gains', () => {
  const partie = preparer();
  partie.blue(); partie.vaincre();
  const argent = partie.store.getState().argent;
  partie.avancer(32000);
  expect(partie.store.getState().nomAdversaire).toBe('Blue (Roucoups)');
  expect(partie.store.getState().annonce).toContain('Temps écoulé ! Blue reprend avec son premier Pokémon.');
  expect(partie.store.getState().argent).toBe(argent);
  expect(partie.lire().zoneId).toBe('kanto.arene-de-carmin');
  expect(partie.lire().etape).toBe(1);
});

it('quitte Blue pour un combat normal et le retrouve au retour', () => {
  const partie = preparer();
  partie.blue(); partie.vaincre();
  partie.store.getState().allerVers('kanto.route-1');
  expect(partie.store.getState().zone?.id).toBe('kanto.route-1');
  expect(partie.store.getState().nomAdversaire).toBeNull();
  partie.store.getState().allerVers('kanto.arene-de-carmin');
  expect(partie.store.getState().nomAdversaire).toBe('Blue (Roucoups)');
});

it('recharge Blue depuis le début sans donner les gains une seconde fois', () => {
  const partie = preparer();
  partie.blue(); partie.vaincre();
  partie.store.getState().fermer();
  const argent = partie.lire().argent;
  partie.store.getState().arreter();
  const reprise = partie.ouvrir();
  expect(reprise.getState().nomAdversaire).toBe('Blue (Roucoups)');
  expect(reprise.getState().argent).toBe(argent);
  expect(partie.lire().etape).toBe(1);
});

it('expose les objets clés et refuse la flûte hors Centrale sans la consommer', () => {
  const partie = preparer(region => ({ ...region, objetsCles: ['pokeflute'] }));
  expect(partie.store.getState().objetsCles).toEqual(['pokeflute']);
  expect(partie.store.getState().utiliserObjetCle('pokeflute')).toBe("Ce n'est pas le moment d'utiliser ça !");
  expect(partie.lire().objetsCles).toEqual(['pokeflute']);
});

it('joue Ronflex avec la flûte, pose son drapeau et reprend la Centrale sans boss gagné', () => {
  const partie = preparer(region => ({ ...region, zoneId: 'kanto.centrale', etape: 9, objetsCles: ['pokeflute'] }));
  const avant = partie.lire();
  expect(partie.store.getState().utiliserObjetCle('pokeflute')).toBeNull();
  partie.store.getState().terminerEtape();
  expect(partie.store.getState().nomAdversaire).toBe('Ronflex');
  partie.vaincre();
  expect(partie.lire().drapeaux).toContain('ronflex-vaincu');
  expect(partie.lire().bossVaincus).toEqual(avant.bossVaincus);
  expect(partie.store.getState().zone?.id).toBe('kanto.centrale');
  expect(partie.store.getState().etape).toBe(9);
  expect(partie.store.getState().pantheon).toBeNull();
});
