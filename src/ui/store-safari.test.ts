import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { chargerEvenements } from '../core/evenements';
import { kanto } from '../core/regions';
import { VISITE_SAFARI } from '../core/safari';
import { creerGestionnaire, creerStockageMemoire, type DonneesRegion } from '../core/sauvegarde';
import { creerStoreJeu, type StoreJeu } from './store';

const stores: StoreJeu[] = [];
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  stores.forEach(store => store.getState().arreter());
  stores.length = 0;
  vi.useRealTimers();
});

function preparer(modifier: (region: DonneesRegion) => DonneesRegion = region => region, valeurAlea = 0) {
  const stockage = creerStockageMemoire();
  const horloge = creerHorlogeSimulee();
  const alea = vi.fn(() => valeurAlea);
  let id = 0;
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: () => 'test' });
  gestionnaire.creerPartie('Test', 'kanto.bourg-palette');
  const lire = () => gestionnaire.chargerRegion('test', 'kanto')!.donnees;
  gestionnaire.ecrireRegion('test', 'kanto', modifier({ ...lire(), argent: 20_000, bossVaincus: ['kanto.arene-de-parmanie'] }));
  const ouvrir = () => {
    const store = creerStoreJeu({ stockage, horloge, alea, genererId: () => `safari-${++id}`,
      evenements: chargerEvenements({ test: { version: 1, evenements: [] } }, kanto) });
    stores.push(store);
    store.getState().demarrer();
    expect(store.getState().erreur).toBeNull();
    return store;
  };
  return { store: ouvrir(), ouvrir, lire, alea };
}

it('paie l\'entrée, note la dépense, sauvegarde la visite et la retrouve après rechargement', () => {
  const p = preparer();
  expect(p.store.getState().safari).toMatchObject({ acces: { ouvert: true }, prix: VISITE_SAFARI.prix, visite: null });
  expect(p.store.getState().entrerAuSafari()).toMatchObject({ ok: true });
  expect(p.lire().argent).toBe(20_000 - VISITE_SAFARI.prix);
  expect(p.lire().suivi?.depenses.safari).toBe(VISITE_SAFARI.prix);
  expect(p.lire().safariEnCours).toEqual({ pas: VISITE_SAFARI.pas, balles: VISITE_SAFARI.balles, captures: 0 });
  p.store.getState().arreter();
  expect(p.ouvrir().getState().safari.visite).toMatchObject({ pas: VISITE_SAFARI.pas, balles: VISITE_SAFARI.balles });
});

it('refuse l\'entrée sans argent, sans rien débiter, et avant l\'Arène de Parmanie', () => {
  const pauvre = preparer(r => ({ ...r, argent: 10 }));
  expect(pauvre.store.getState().entrerAuSafari()).toMatchObject({ ok: false, raison: expect.stringMatching(/Il te manque/) });
  expect(pauvre.lire().argent).toBe(10);
  const ferme = preparer(r => ({ ...r, bossVaincus: [] }));
  expect(ferme.store.getState().safari.acces).toMatchObject({ ouvert: false, raison: expect.stringMatching(/Parmanie/) });
  expect(ferme.store.getState().entrerAuSafari()).toMatchObject({ ok: false });
  expect(ferme.lire().argent).toBe(20_000);
});

it('une capture entre au Pokédex, dans l\'équipe, et se sauvegarde', () => {
  const p = preparer();
  p.store.getState().entrerAuSafari();
  expect(p.store.getState().avancerSafari()).toMatchObject({ ok: true });
  expect(p.store.getState().safari.visite?.rencontre).not.toBeNull();
  const numero = p.store.getState().safari.visite!.rencontre!.numero;
  expect(p.store.getState().lancerBalleSafari()).toMatchObject({ ok: true, numero });
  expect(p.store.getState().safari.visite).toMatchObject({ captures: 1, balles: VISITE_SAFARI.balles - 1, rencontre: null });
  expect(p.lire().equipe.some(m => m.numero === numero)).toBe(true);
  expect(p.store.getState().pokedex).toBeDefined();
});

it('quitter termine la visite avec le bilan et ne rend pas l\'entrée', () => {
  const p = preparer();
  p.store.getState().entrerAuSafari();
  expect(p.store.getState().quitterSafari()).toMatchObject({ ok: true, fin: { raison: 'sortie', captures: 0 } });
  expect(p.store.getState().safari.visite).toBeNull();
  expect(p.lire().safariEnCours).toBeUndefined();
  expect(p.lire().argent).toBe(20_000 - VISITE_SAFARI.prix);
});
