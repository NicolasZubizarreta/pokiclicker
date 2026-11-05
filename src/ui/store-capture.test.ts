// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { creerGestionnaire, creerStockageMemoire } from '../core/sauvegarde';
import { reglages } from '../core/reglages';
import { creerStoreJeu, type StoreJeu } from './store';

const stores: StoreJeu[] = [];
beforeEach(() => vi.useFakeTimers());
afterEach(() => { stores.forEach(s => s.getState().arreter()); stores.length = 0; vi.useRealTimers(); });
function preparer(alea = () => .1, pleine = false) {
  const stockage = creerStockageMemoire();
  const horloge = creerHorlogeSimulee();
  let id = 0;
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: () => 'partie' });
  const lancer = () => {
    const store = creerStoreJeu({ stockage, horloge, alea, genererId: () => `prise-${++id}` });
    stores.push(store);
    store.getState().demarrer();
    return store;
  };
  gestionnaire.creerPartie('Capture');
  const region = gestionnaire.chargerRegion('partie', 'kanto')!.donnees;
  const pokemon = { uid: 'initial', numero: 1, niveau: 5, xp: 0, shiny: false,
    sexe: 'male' as const, bonheur: 0, calcium: 0, pierreEternelle: false, favori: false };
  gestionnaire.ecrireRegion('partie', 'kanto', { ...region, inventaire: { pokeball: 2, masterball: 2 },
    equipe: pleine ? Array.from({ length: 6 }, (_, i) => ({ ...pokemon, uid: `initial-${i}` })) : [] });
  const store = lancer();
  const avancer = (ms: number) => { for (let t = 0; t < ms; t += 100) { horloge.avancer(100); store.getState().tick(); } };
  const relire = () => gestionnaire.chargerRegion('partie', 'kanto')!.donnees;
  return { store, avancer, relire, lancer, gestionnaire };
}

it('conserve autoClicLie et utilise true pour une ancienne sauvegarde', () => {
  const { store, lancer, gestionnaire } = preparer();
  expect(store.getState().autoClicLie).toBe(true);
  store.getState().reglerAutoClicLie(false);
  expect(store.getState().autoClicLie).toBe(false);
  expect(gestionnaire.chargerCompte()!.donnees.preferences.autoClicLie).toBe(false);
  store.getState().arreter();
  expect(lancer().getState().autoClicLie).toBe(false);
});

it('sauvegarde immédiatement seulement après le démarrage', () => {
  const stockage = creerStockageMemoire();
  const horloge = creerHorlogeSimulee();
  const store = creerStoreJeu({ stockage, horloge, alea: () => .1, genererId: () => 'partie' });
  stores.push(store);
  const ecrire = vi.spyOn(stockage, 'ecrire');
  store.getState().reglerAutoClicLie(false);
  expect(store.getState().sauvegarder()).toBe(false);
  expect(ecrire).not.toHaveBeenCalled();
  store.getState().demarrer();
  expect(store.getState().autoClicLie).toBe(true);
  expect(store.getState().sauvegarder()).toBe(true);
  expect(ecrire).toHaveBeenCalled();
  expect(creerGestionnaire({ stockage, horloge, genererId: () => 'partie' }).chargerCompte()).not.toBeNull();
});

it('sauvegarder() juge sa propre écriture : une erreur passée du compte ne bloque pas un succès', () => {
  const stockage = creerStockageMemoire();
  const store = creerStoreJeu({ stockage, horloge: creerHorlogeSimulee(), alea: () => .1, genererId: () => 'partie' });
  stores.push(store);
  store.getState().demarrer();
  vi.spyOn(stockage, 'ecrire').mockImplementationOnce(() => { throw new Error('stockage plein'); });
  store.getState().reglerAutoClicLie(false);
  expect(store.getState().erreur).not.toBeNull();
  expect(store.getState().sauvegarder()).toBe(true);
  expect(store.getState().erreur).toBeNull();
  expect(creerGestionnaire({ stockage, horloge: creerHorlogeSimulee(), genererId: () => 'partie' }).chargerCompte()?.donnees.preferences.autoClicLie).toBe(false);
});

it('consomme et sauvegarde immédiatement la balle, même après un échec', () => {
  const { store, avancer, relire } = preparer(() => .99);
  const numero = store.getState().ennemi!.numero;
  store.getState().capturer('pokeball');
  expect(relire().inventaire.pokeball).toBe(1);
  expect(store.getState().capture.enCours).toBe(true);
  store.getState().capturer('pokeball');
  expect(store.getState().annonce).toBe('Une capture est déjà en cours.');
  expect(relire().inventaire.pokeball).toBe(1);
  avancer(1000);
  expect(store.getState().capture.enCours).toBe(false);
  expect(store.getState().annonce).toContain("s'est échappé !");
  expect(store.getState().pokedex).not.toContain(numero);
  expect(relire().equipe).toEqual([]);
  expect(relire().inventaire.pokeball).toBe(1);
});

it.each([false, true])('capture vers équipe ou PC (équipe pleine : %s), conserve le Pokédex et recharge', pleine => {
  const { store, avancer, relire, lancer, gestionnaire } = preparer(() => .1, pleine);
  const numero = store.getState().ennemi!.numero;
  expect(store.getState().autoAttaque).toBe(false);
  expect(store.getState().annonce).toBe('Nouveau Pokémon ! Auto-attaque arrêtée.');
  expect(gestionnaire.chargerCompte()!.donnees.preferences.autoAttaque).toBe(false);
  store.getState().capturer('masterball');
  avancer(1000);
  const region = relire();
  expect(region[pleine ? 'pc' : 'equipe'].at(-1)).toMatchObject({ numero, xp: 0, bonheur: 0 });
  expect(store.getState().pokedex).toContain(numero);
  expect(store.getState().autoAttaque).toBe(true);
  expect(store.getState().annonce).toContain('est capturé !');
  if (pleine) expect(store.getState().annonce).toContain('est envoyé au PC.');
  expect(store.getState().enRecherche).toBe(false);
  expect(store.getState().capture.possible).toBe(false);
  expect(region.inventaire.masterball).toBe(1);
  avancer(1000);
  expect(store.getState().autoAttaque).toBe(true);
  expect(store.getState().capture.possible).toBe(true);
  store.getState().arreter();
  const recharge = lancer().getState();
  expect(recharge.pokedex).toEqual(store.getState().pokedex);
  expect(relire()).toEqual(region);
  expect(recharge.pc).toEqual(region.pc);
  expect(recharge.equipe.filter(Boolean).map(p => p!.pokemon)).toEqual(region.equipe);
});

it('conserve les préférences manuelles et les transmet après navigation et rechargement', () => {
  const { store, lancer, gestionnaire } = preparer();
  store.getState().reglerArretAuto({ actif: false, shiny: false });
  store.getState().basculerAutoAttaque();
  expect(store.getState().autoAttaque).toBe(true);
  store.getState().allerVers('kanto.route-1');
  expect(store.getState().autoAttaque).toBe(true);
  expect(store.getState().arretAuto).toEqual({ ...reglages.depart.preferences.arretAuto, actif: false, shiny: false });
  store.getState().basculerAutoAttaque();
  store.getState().arreter();
  const recharge = lancer().getState();
  expect(recharge.autoAttaque).toBe(false);
  expect(recharge.arretAuto).toEqual(store.getState().arretAuto);
  expect(gestionnaire.chargerCompte()!.donnees.preferences.autoAttaque).toBe(false);
});

it('mémoïse la capture et refuse une clé inconnue sans consommation', () => {
  const { store, avancer, relire } = preparer();
  const capture = store.getState().capture;
  expect(capture.balles.map(b => [b.cle, b.quantite])).toEqual([['pokeball', 2], ['masterball', 2]]);
  avancer(100);
  expect(store.getState().capture).toBe(capture);
  store.getState().capturer('inconnue');
  expect(store.getState().annonce).toBe("Tu n'as aucune balle.");
  expect(relire().inventaire).toEqual({ pokeball: 2, masterball: 2 });
});
