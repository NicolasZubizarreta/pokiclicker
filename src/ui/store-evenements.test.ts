import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import chenBoss from '../../data/evenements/chen-boss.json';
import rivaux from '../../data/evenements/rival.json';
import essai from '../../tests/fixtures/evenements/essai.json';
import { creerHorlogeSimulee } from '../core/clock';
import * as combat from '../core/combat';
import { chargerEvenements, type Evenement } from '../core/evenements';
import { kanto } from '../core/regions';
import { reglages } from '../core/reglages';
import { compteInitial, creerGestionnaire, creerStockageMemoire, etatMondeDe, type DonneesRegion } from '../core/sauvegarde';
import { creerStoreJeu, type StoreJeu } from './store';

const stores: StoreJeu[] = [];
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  stores.forEach(store => store.getState().arreter());
  stores.length = 0;
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function preparer(evenements: unknown = essai, modifier: (region: DonneesRegion) => DonneesRegion = region => region) {
  const stockage = creerStockageMemoire();
  const horloge = creerHorlogeSimulee();
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: () => 'test' });
  const compte = compteInitial();
  gestionnaire.ecrireCompte({ ...compte, preferences: { ...compte.preferences,
    arretAuto: { ...reglages.depart.preferences.arretAuto, actif: false } } });
  gestionnaire.creerPartie('Test', 'kanto.bourg-palette');
  const lire = () => gestionnaire.chargerRegion('test', 'kanto')!.donnees;
  gestionnaire.ecrireRegion('test', 'kanto', modifier(lire()));
  const stockInitial = lire().inventaire.pokeball ?? 0;
  const catalogue = chargerEvenements({ essai: evenements }, kanto);
  const ouvrir = () => {
    const store = creerStoreJeu({ stockage, horloge, alea: () => .1, genererId: () => 'test', evenements: catalogue });
    stores.push(store);
    store.getState().demarrer();
    expect(store.getState().erreur).toBeNull();
    return store;
  };
  return { store: ouvrir(), ouvrir, lire, horloge, gestionnaire, stockInitial };
}

describe('événements du store de bout en bout', () => {
  it('conserve la référence de la commande entre deux affichages', () => {
    const partie = preparer();
    partie.store.getState().allerVers('kanto.route-1');
    const commande = partie.store.getState().evenement;
    expect(commande).not.toBeNull();
    partie.horloge.avancer(100);
    partie.store.getState().tick();
    expect(partie.store.getState().evenement).toBe(commande);
    partie.store.getState().terminerEtape();
    expect(partie.store.getState().evenement).not.toBe(commande);
  });

  it('reconstruit le combat à l’étape 1 après deplacer vers la zone courante', () => {
    const partie = preparer({ version: 1, evenements: [{ id: 'retour', declencheur: { type: 'debut-partie' },
      etapes: [{ type: 'dialogue', locuteur: 'Chen', texte: 'Retour' },
        { type: 'deplacer', zone: 'kanto.route-1' }] }] }, region => ({ ...region, zoneId: 'kanto.route-1', etape: 5 }));
    expect(partie.store.getState().etape).toBe(5);
    partie.store.getState().terminerEtape();
    expect(partie.store.getState().etape).toBe(1);
    expect(partie.store.getState().ennemi?.pv).toBe(partie.store.getState().ennemi?.pvMax);
    partie.horloge.avancer(100);
    partie.store.getState().tick();
    expect(partie.store.getState().etape).toBe(1);
    expect(partie.lire().etape).toBe(1);
  });

  it.each([essai, { version: 1, evenements: [] }])('abandonne sans exception un événement absent du catalogue %j', catalogue => {
    const partie = preparer(catalogue, region => ({ ...region,
      evenementEnCours: { id: 'absent', etape: 0, file: ['disparu'] } }));
    expect(partie.store.getState().evenement).toBeNull();
    expect(partie.lire().evenementEnCours).toBeUndefined();
  });

  it('termine le lot boss-vaincu et reprise-auto avant de quitter le combat', () => {
    const reprendre = combat.reprendreCombat;
    vi.spyOn(combat, 'reprendreCombat').mockImplementation((...args) => ({ ...reprendre(...args), interrompu: true }));
    const vider = combat.viderEvenements;
    let repriseApresBoss = false;
    vi.spyOn(combat, 'viderEvenements').mockImplementation(etat => {
      if (etat.evenements.some(e => e.type === 'boss-vaincu')) {
        repriseApresBoss = etat.evenements.some(e => e.type === 'reprise-auto');
      }
      return vider(etat);
    });
    const partie = preparer({ version: 1, evenements: [{ id: 'retour',
      declencheur: { type: 'boss-vaincu', zone: 'kanto.route-1' },
      etapes: [{ type: 'deplacer', zone: 'kanto.bourg-palette' }] }] }, region => ({ ...region,
      zoneId: 'kanto.route-1', etape: reglages.combat.etapeBoss,
      equipe: [{ uid: 'fort', numero: 6, niveau: reglages.recompenses.niveauMax, xp: 0, shiny: false, bonheur: 0,
        pierreEternelle: false, calcium: 0, sexe: 'male', favori: false }] }));
    expect(() => {
      for (let i = 0; i < 10000 && partie.store.getState().lieu?.id !== 'kanto.bourg-palette'; i++) {
        partie.store.getState().attaquer();
        partie.horloge.avancer(100);
        partie.store.getState().tick();
      }
    }).not.toThrow();
    expect(repriseApresBoss).toBe(true);
    expect(partie.store.getState().lieu?.id).toBe('kanto.bourg-palette');
    expect(partie.store.getState().ennemi).toBeNull();
  });

  it('écrit le don avec la progression, reprend le combat et termine sans rejouer', () => {
    const partie = preparer();
    const stock = partie.lire().inventaire.pokeball ?? 0;
    partie.store.getState().allerVers('kanto.route-1');
    expect(partie.store.getState().evenement).toEqual({ type: 'dialogue', evenement: 'kanto.essai',
      etape: 0, locuteur: 'Prof. Chen', texte: 'Bonjour !' });
    partie.store.getState().terminerEtape();
    expect(partie.lire().inventaire.pokeball).toBe(stock + 5);
    const commande = partie.store.getState().evenement;
    expect(commande).toMatchObject({ type: 'combat', evenement: 'kanto.essai', etape: 4, pokemon: 143, niveau: 30, capture: 25 });
    expect(partie.lire().evenementEnCours).toMatchObject({ id: 'kanto.essai', etape: 4 });
    partie.store.getState().arreter();
    const reprise = partie.ouvrir();
    expect(reprise.getState().evenement).toEqual(commande);
    expect(partie.lire().inventaire.pokeball).toBe(stock + 5);
    reprise.getState().terminerEtape();
    expect(reprise.getState().lieu?.id).toBe('kanto.bourg-palette');
    expect(reprise.getState().etape).toBe(1);
    expect(reprise.getState().evenement).toBeNull();
    expect(partie.lire().evenementsJoues).toContain('kanto.essai');
    expect(partie.lire().evenementEnCours).toBeUndefined();
    reprise.getState().allerVers('kanto.route-1');
    expect(reprise.getState().evenement).toBeNull();
    expect(partie.lire().inventaire.pokeball).toBe(stock + 5);
  });

  it('refuse une zone pourtant ouverte avec sa raison puis permet le passage avec flute', () => {
    const precedente = kanto.zonePrecedente('kanto.foret-de-jade')!.id;
    const partie = preparer(essai, region => ({ ...region,
      bossVaincus: kanto.zones.filter(zone => !zone.sansCombat).map(zone => zone.id) }));
    partie.store.getState().allerVers('kanto.route-1');
    partie.store.getState().terminerEtape();
    partie.store.getState().terminerEtape();
    expect(kanto.accesZone('kanto.foret-de-jade', etatMondeDe(partie.lire()))).toEqual({ ok: true });
    partie.store.getState().allerVers(precedente);
    expect(partie.store.getState().zoneSuivante).toMatchObject({ id: 'kanto.foret-de-jade', ouverte: false, raison: 'Un Ronflex dort.' });
    partie.store.getState().allerVers('kanto.foret-de-jade');
    expect(partie.store.getState().lieu?.id).toBe(precedente);
    expect(partie.lire().zoneId).toBe(precedente);
    partie.store.getState().arreter();
    partie.gestionnaire.ecrireRegion('test', 'kanto', { ...partie.lire(), drapeaux: [...partie.lire().drapeaux, 'flute'] });
    const reprise = partie.ouvrir();
    expect(reprise.getState().zoneSuivante).toMatchObject({ ouverte: true, raison: null });
    reprise.getState().allerVers('kanto.foret-de-jade');
    expect(reprise.getState().lieu?.id).toBe('kanto.foret-de-jade');
    expect(partie.lire().zoneId).toBe('kanto.foret-de-jade');
  });

  it('ne donne la récompense de début de partie qu’une fois sur deux démarrages', () => {
    const evenement: Evenement = { id: 'test.depart', declencheur: { type: 'debut-partie' },
      priorite: 0, repetable: false, etapes: [{ type: 'donner', objet: 'pokeball', quantite: 5 }] };
    const partie = preparer({ version: 1, evenements: [evenement] });
    const stock = partie.lire().inventaire.pokeball;
    expect(stock).toBe(partie.stockInitial + 5);
    expect(partie.lire().evenementsJoues).toEqual(['test.depart']);
    partie.store.getState().arreter();
    partie.store.getState().demarrer();
    expect(partie.lire().inventaire.pokeball).toBe(stock);
    expect(partie.lire().evenementsJoues).toEqual(['test.depart']);
  });

  it('Chen au premier boss : combat figé et minuteur intact pendant ses répliques, puis le chrono part', () => {
    const faible = [{ uid: 'faible', numero: 10, niveau: 1, xp: 0, shiny: false, bonheur: 0,
      pierreEternelle: false, calcium: 0, sexe: 'male' as const, favori: false }];
    const partie = preparer(chenBoss, region => ({ ...region, zoneId: 'kanto.route-1',
      etape: reglages.combat.etapeBoss, equipe: faible }));
    const { store } = partie;
    partie.horloge.avancer(100);
    store.getState().tick();
    const premiere = store.getState().evenement;
    expect(premiere).toMatchObject({ type: 'dialogue', evenement: 'kanto.chen-premier-boss', etape: 0 });
    const plein = { restantMs: reglages.combat.minuteurBossMs, totalMs: reglages.combat.minuteurBossMs };
    for (let i = 0; i < 400; i++) { partie.horloge.avancer(100); store.getState().tick(); }
    expect(store.getState().minuteur).toEqual(plein);
    expect(store.getState().attaquer()).toBe(false);
    expect(store.getState().ennemi?.pv).toBe(store.getState().ennemi?.pvMax);
    for (let i = 0; i < 4; i++) store.getState().terminerEtape();
    expect(store.getState().evenement).toBeNull();
    expect(partie.lire().evenementsJoues).toContain('kanto.chen-premier-boss');
    partie.horloge.avancer(1000);
    store.getState().tick();
    expect(store.getState().minuteur?.restantMs).toBeLessThan(reglages.combat.minuteurBossMs);
    // Échec après les 30 s : retour à l'étape 9, et Chen ne reparle pas au retour sur le boss.
    for (let i = 0; i < 400 && store.getState().etape === reglages.combat.etapeBoss; i++) {
      partie.horloge.avancer(100);
      store.getState().tick();
    }
    expect(store.getState().etape).toBe(reglages.combat.etapeBoss - 1);
    expect(store.getState().evenement).toBeNull();
  });

  it('Blue : présenté avant son premier défi, jamais présenté après coup à une ancienne sauvegarde', () => {
    const tous = (region: DonneesRegion) => ({ ...region,
      bossVaincus: kanto.zones.filter(zone => !zone.sansCombat && zone.id !== 'kanto.foret-de-jade').map(zone => zone.id) });
    const neuve = preparer(rivaux, tous);
    neuve.store.getState().allerVers('kanto.foret-de-jade');
    expect(neuve.store.getState().evenement).toMatchObject({ evenement: 'kanto.blue-presentation', locuteur: 'Blue' });
    neuve.store.getState().terminerEtape();
    neuve.store.getState().terminerEtape();
    expect(neuve.store.getState().evenement).toMatchObject({ evenement: 'kanto.rival-foret' });
    const ancienne = preparer(rivaux, region => ({ ...tous(region), evenementsJoues: ['kanto.rival-foret'] }));
    ancienne.store.getState().allerVers('kanto.foret-de-jade');
    expect(ancienne.store.getState().evenement).toBeNull();
    expect(ancienne.lire().evenementsJoues).toContain('kanto.blue-presentation');
  });

  it('déclenche le dialogue après une victoire sur le boss', () => {
    const evenement: Evenement = { id: 'test.boss', declencheur: { type: 'boss-vaincu', zone: 'kanto.route-1' },
      priorite: 0, repetable: false, etapes: [{ type: 'dialogue', locuteur: 'Chen', texte: 'Bravo !' }] };
    const partie = preparer({ version: 1, evenements: [evenement] }, region => ({ ...region,
      zoneId: 'kanto.route-1', etape: reglages.combat.etapeBoss,
      equipe: [{ uid: 'fort', numero: 6, niveau: 100, xp: 0, shiny: false, bonheur: 0,
        pierreEternelle: false, calcium: 0, sexe: 'male', favori: false }] }));
    expect(partie.store.getState().evenement).toBeNull();
    for (let i = 0; i < 10000 && partie.store.getState().evenement === null; i++) {
      partie.store.getState().attaquer();
      partie.horloge.avancer(100);
      partie.store.getState().tick();
    }
    expect(partie.store.getState().evenement).toEqual({ type: 'dialogue', evenement: 'test.boss',
      etape: 0, locuteur: 'Chen', texte: 'Bravo !' });
    expect(partie.lire().bossVaincus).toContain('kanto.route-1');
  });
});
