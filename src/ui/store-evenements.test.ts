import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import essai from '../../tests/fixtures/evenements/essai.json';
import { creerHorlogeSimulee } from '../core/clock';
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
