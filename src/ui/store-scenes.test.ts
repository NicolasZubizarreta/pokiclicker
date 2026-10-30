import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import * as combat from '../core/combat';
import { evenementsKanto } from '../core/evenements-kanto';
import { kanto } from '../core/regions';
import { calculerOr } from '../core/recompenses';
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
  return { store, lire, ouvrir, avancer, vaincre, blue, horloge };
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

it('expose les objets clés et refuse la flûte hors route sans la consommer', () => {
  const partie = preparer(region => ({ ...region, objetsCles: ['pokeflute'] }));
  expect(partie.store.getState().objetsCles).toEqual(['pokeflute']);
  expect(partie.store.getState().utiliserObjetCle('pokeflute')).toBe('À utiliser devant Ronflex');
  expect(partie.lire().objetsCles).toEqual(['pokeflute']);
});

it('reprend le dialogue final ancien sur la route sans boss ni gain supplémentaire', () => {
  const partie = preparer(region => ({ ...region, zoneId: 'kanto.centrale', etape: 9,
    bossVaincus: ['kanto.centrale'], objetsCles: ['pokeflute'], drapeaux: ['ronflex-vaincu'],
    evenementEnCours: { id: 'kanto.ronflex-reveil', etape: 3, file: [] } }));
  const avant = partie.lire();
  expect(partie.store.getState().evenement).toMatchObject({ type: 'dialogue', evenement: 'kanto.ronflex-reveil', etape: 4 });
  partie.store.getState().fermer();
  expect(partie.lire().drapeaux).toContain('ronflex-vaincu');
  expect(partie.lire().bossVaincus).toEqual(avant.bossVaincus);
  expect(partie.lire().argent).toBe(avant.argent);
  expect(partie.lire().zoneId).toBe('kanto.route-de-ronflex');
  expect(partie.store.getState().pantheon).toBeNull();
});

it('persiste Souffle, réveil, combat et victoire puis rejoint Parmanie une seule fois', () => {
  const route = 'kanto.route-de-ronflex';
  const partie = preparer(region => ({ ...region, zoneId: 'kanto.centrale',
    bossVaincus: kanto.zones.filter(z => !z.sansCombat && z.ancienId <= 12).map(z => z.id),
    objetsCles: ['pokeflute'] }));
  let store = partie.store;
  const recharger = () => {
    store.getState().fermer();
    store.getState().arreter();
    store = partie.ouvrir();
  };
  store.getState().allerVers(route);
  expect(store.getState().evenement).toMatchObject({ type: 'dialogue', evenement: 'kanto.ronflex-blocage' });
  store.getState().terminerEtape();
  const ref = store.getState().evenement!;
  expect(ref.type).toBe('souffle');
  expect(store.getState().ennemi).toBeNull();
  expect(store.getState().utiliserObjetCle('pokeflute')).toBe('À utiliser devant Ronflex');
  store.getState().terminerEtape();
  expect(store.getState().evenement).toEqual(ref);
  recharger();
  expect(store.getState().evenement).toEqual(ref);
  store.getState().reussirSouffle({ ...ref, etape: ref.etape + 1 });
  expect(store.getState().evenement).toEqual(ref);
  store.getState().reussirSouffle(ref);
  store.getState().reussirSouffle(ref);
  expect(store.getState().evenement).toMatchObject({ type: 'dialogue', etape: 1 });
  recharger();
  expect(store.getState().evenement).toMatchObject({ type: 'dialogue', etape: 1 });
  expect(store.getState().ennemi).toBeNull();
  store.getState().terminerEtape();
  expect(store.getState().ennemi).toMatchObject({ numero: 143, niveau: 45 });
  expect(store.getState().capture.possible).toBe(false);
  expect(store.getState().zone?.multiplicateurPv).toBe(kanto.zoneDeCombat('kanto.centrale').multiplicateurPv);
  expect(store.getState().evenement?.type).toBe('combat');
  recharger();
  expect(store.getState().evenement).toMatchObject({ type: 'combat', etape: 2 });
  const avant = partie.lire();
  for (let i = 0; i < 1000 && store.getState().evenement?.type === 'combat'; i++) {
    store.getState().attaquer();
    partie.horloge.avancer(100);
    store.getState().tick();
  }
  expect(store.getState().evenement).toMatchObject({ type: 'dialogue', etape: 4 });
  expect(store.getState().ennemi).toBeNull();
  const victoire = partie.lire();
  expect(victoire.drapeaux).toContain('ronflex-vaincu');
  expect(victoire.zoneId).toBe(route);
  expect(victoire.bossVaincus).toEqual(avant.bossVaincus);
  expect(victoire.argent - avant.argent).toBe(calculerOr({ numero: 143, niveau: 45, boss: true, shiny: false, rarete: null }));
  recharger();
  expect(store.getState().evenement).toMatchObject({ type: 'dialogue', etape: 4 });
  expect(store.getState().argent).toBe(victoire.argent);
  store.getState().terminerEtape();
  expect(partie.lire().zoneId).toBe('kanto.arene-de-parmanie');
  expect(partie.lire().evenementsJoues).toContain('kanto.ronflex-reveil');
  recharger();
  expect(store.getState().argent).toBe(victoire.argent);
  expect(store.getState().evenement).toBeNull();
  store.getState().allerVers(route);
  expect(partie.lire().zoneId).toBe('kanto.arene-de-parmanie');
});

it('partage les accès entre Carte et déplacement avant et après Ronflex', () => {
  const route = 'kanto.route-de-ronflex';
  const parmanie = 'kanto.arene-de-parmanie';
  for (const phase of ['avant', 'boss', 'victoire'] as const) {
    const partie = preparer(region => ({ ...region, zoneId: 'kanto.centrale',
      bossVaincus: kanto.zones.filter(z => !z.sansCombat && z.ancienId < 13
        && (phase !== 'avant' || z.id !== 'kanto.centrale')).map(z => z.id),
      drapeaux: phase === 'victoire' ? ['ronflex-vaincu'] : [] }));
    const etat = partie.store.getState();
    expect(etat.evenement).toBeNull();
    expect(etat.carte.formes.find(f => f.zone === route)).toMatchObject({
      ouverte: phase === 'boss', terminee: phase === 'victoire',
    });
    expect(etat.carte.formes.find(f => f.zone === parmanie)?.ouverte).toBe(phase === 'victoire');
    etat.allerVers(parmanie);
    expect(partie.store.getState().zone?.id).toBe(phase === 'victoire' ? parmanie : 'kanto.centrale');
    partie.store.getState().allerVers(route);
    partie.store.getState().fermer();
    expect(partie.lire().zoneId).toBe(phase === 'boss' ? route : phase === 'victoire' ? parmanie : 'kanto.centrale');
  }
});

it('normalise une ancienne sauvegarde avancée au chargement sans rejouer Ronflex', () => {
  const partie = preparer(region => ({ ...region, zoneId: 'kanto.arene-de-parmanie', drapeaux: [] }));
  partie.store.getState().fermer();
  expect(partie.lire().drapeaux).toContain('ronflex-vaincu');
  expect(partie.store.getState().evenement).toBeNull();
  partie.store.getState().allerVers('kanto.route-de-ronflex');
  expect(partie.store.getState().zone?.id).toBe('kanto.arene-de-parmanie');
});
