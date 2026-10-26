import { afterEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import * as combat from '../core/combat';
import { compteInitial, creerGestionnaire, creerStockageMemoire } from '../core/sauvegarde';
import { creerStoreJeu, type StoreJeu } from './store';

const stores: StoreJeu[] = [];
afterEach(() => { stores.forEach(s => s.getState().arreter()); stores.length = 0; vi.restoreAllMocks(); });
function preparer(etape = 1, actif = false) {
  const stockage = creerStockageMemoire();
  const horloge = creerHorlogeSimulee();
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: () => 'fin' });
  const compte = compteInitial();
  gestionnaire.ecrireCompte({ ...compte, preferences: { ...compte.preferences, autoAttaque: false } });
  const partie = gestionnaire.creerPartie('Nicolas', 'kanto.bourg-palette');
  gestionnaire.ecrirePartie('fin', { ...partie.donnees, pokedexNational: Array.from({ length: 151 }, (_, i) => i + 1) });
  const lire = () => gestionnaire.chargerRegion('fin', 'kanto')!.donnees;
  gestionnaire.ecrireRegion('fin', 'kanto', { ...lire(), ligueGagnee: 1, starterId: 1,
    zoneId: actif ? 'kanto.labo' : 'kanto.bourg-palette', etape,
    evenementsJoues: ['kanto.fin-pokedex', 'kanto.intro'],
    drapeaux: actif ? ['defi-chen-actif', 'defi-chen-intro-vue'] : [],
    equipe: [{ uid: 'fort', numero: 6, niveau: 50, xp: 0, shiny: false, bonheur: 0,
      pierreEternelle: false, calcium: 0, sexe: 'male', favori: false }] });
  const ouvrir = () => {
    const store = creerStoreJeu({ stockage, horloge, alea: () => .1, genererId: () => 'fin' });
    stores.push(store); store.getState().demarrer();
    expect(store.getState().erreur).toBeNull();
    return store;
  };
  const store = ouvrir();
  const avancer = (ms: number) => { horloge.avancer(ms); store.getState().tick(); };
  return { store, ouvrir, lire, avancer, horloge, gestionnaire };
}
it('lance l’intro puis le combat au labo et reprend l’étape sauvegardée', () => {
  const { store, ouvrir, lire } = preparer();
  store.getState().lancerDefiChen();
  expect(store.getState().evenement?.evenement).toBe('kanto.defi-chen-intro');
  expect(store.getState().ennemi).toBeNull();
  for (let i = 0; i < 3; i++) store.getState().terminerEtape();
  expect(store.getState().ennemi?.numero).toBe(128);
  expect(lire().drapeaux).toContain('defi-chen-intro-vue');
  store.getState().arreter();
  expect(ouvrir().getState().ennemi?.numero).toBe(128);
});
it('permet de lancer le défi depuis le labo après le dialogue de fin du Pokédex', () => {
  const { store, ouvrir, gestionnaire, lire } = preparer();
  store.getState().arreter();
  gestionnaire.ecrireRegion('fin', 'kanto', { ...lire(), zoneId: 'kanto.labo' });
  const reprise = ouvrir();
  reprise.getState().lancerDefiChen();
  expect(reprise.getState().evenement?.evenement).toBe('kanto.defi-chen-intro');
  for (let i = 0; i < 3; i++) reprise.getState().terminerEtape();
  expect(reprise.getState().ennemi?.numero).toBe(128);
});
it('reprend le cinquième combat avec le counter et le minuteur V1', () => {
  const { store } = preparer(5, true);
  expect(store.getState().etape).toBe(5);
  expect(store.getState().ennemi?.numero).toBe(9);
  expect(store.getState().minuteur?.totalMs).toBe(30000);
});
it('revient à Bourg Palette après expiration', () => {
  const { store, lire, avancer } = preparer(5, true);
  for (let i = 0; i < 301; i++) avancer(100);
  expect(lire().zoneId).toBe('kanto.bourg-palette');
  expect(lire().etape).toBe(1);
  expect(store.getState().annonce).toContain('Continue de t’entraîner'.replace('’', "'"));
});
it('affiche la victoire puis les crédits une seule fois, même après rechargement', () => {
  const { store, ouvrir, lire, horloge } = preparer(6, true);
  const cliquer = combat.cliquer;
  vi.spyOn(combat, 'cliquer').mockImplementation((etat, limiteur) => cliquer({ ...etat, ennemi: { ...etat.ennemi, pv: 1 } }, limiteur));
  horloge.avancer(100); store.getState().attaquer(); store.getState().tick();
  expect(lire().drapeaux).toContain('defi-chen-gagne');
  expect(store.getState().fin.credits).toBe(false);
  expect(store.getState().evenement?.evenement).toBe('kanto.defi-chen-victoire');
  for (let i = 0; i < 3; i++) store.getState().terminerEtape();
  expect(store.getState().fin.credits).toBe(true);
  store.getState().fermerCredits();
  store.getState().lancerDefiChen();
  expect(store.getState().fin.credits).toBe(false);
  store.getState().arreter();
  expect(ouvrir().getState().fin.credits).toBe(false);
});
it('donne le diplôme après la cinquième ligne, avec le nom et la date fixes de la partie', () => {
  const { store, ouvrir, gestionnaire, horloge, lire } = preparer();
  store.getState().arreter();
  const region = lire();
  gestionnaire.ecrireRegion('fin', 'kanto', { ...region,
    evenementsJoues: region.evenementsJoues.filter(id => id !== 'kanto.fin-pokedex') });
  const fin = ouvrir();
  expect(fin.getState().evenement?.evenement).toBe('kanto.fin-pokedex');
  for (let i = 0; i < 4; i++) fin.getState().terminerEtape();
  expect(fin.getState().fin.diplome).toBeNull();
  const date = new Date(horloge.maintenant()).toISOString();
  fin.getState().terminerEtape();
  expect(fin.getState().fin.diplome).toEqual({ nom: 'Nicolas', date });
  fin.getState().arreter();
  horloge.avancer(1000);
  const reprise = ouvrir();
  expect(reprise.getState().fin.diplome).toEqual({ nom: 'Nicolas', date });
  for (let i = 0; i < 3; i++) reprise.getState().terminerEtape();
  expect(lire().ameliorations.filter(id => id === 'diploma')).toHaveLength(1);
  expect(lire().ameliorations.filter(id => id === 'shinyCharm')).toHaveLength(1);
  expect(lire().evenementsJoues.filter(id => id === 'kanto.fin-pokedex')).toHaveLength(1);
});
it('reprend l’intro à sa ligne', () => {
  const { store, ouvrir } = preparer();
  store.getState().lancerDefiChen();
  store.getState().terminerEtape();
  const commande = store.getState().evenement;
  store.getState().arreter();
  const reprise = ouvrir();
  expect(reprise.getState().evenement).toEqual(commande);
  expect(reprise.getState().ennemi).toBeNull();
});
it('sauvegarde chaque adversaire vaincu et reprend au suivant', () => {
  const { store, lire, ouvrir, horloge } = preparer(4, true);
  const cliquer = combat.cliquer;
  vi.spyOn(combat, 'cliquer').mockImplementation((etat, limiteur) => cliquer({ ...etat,
    ennemi: { ...etat.ennemi, pv: 1 } }, limiteur));
  horloge.avancer(100); store.getState().attaquer();
  expect(lire().etape).toBe(5);
  store.getState().arreter();
  expect(ouvrir().getState().ennemi?.numero).toBe(9);
});
it('reprend le dialogue de victoire avant de proposer les crédits', () => {
  const { store, ouvrir, horloge } = preparer(6, true);
  const cliquer = combat.cliquer;
  vi.spyOn(combat, 'cliquer').mockImplementation((etat, limiteur) => cliquer({ ...etat,
    ennemi: { ...etat.ennemi, pv: 1 } }, limiteur));
  horloge.avancer(100); store.getState().attaquer();
  store.getState().terminerEtape();
  const commande = store.getState().evenement;
  store.getState().arreter();
  const reprise = ouvrir();
  expect(reprise.getState().evenement).toEqual(commande);
  expect(reprise.getState().fin.credits).toBe(false);
  reprise.getState().terminerEtape(); reprise.getState().terminerEtape();
  expect(reprise.getState().fin.credits).toBe(true);
});
it('refuse le défi tant que les conditions de la V1 ne sont pas réunies', () => {
  const { store, ouvrir, gestionnaire, lire } = preparer();
  store.getState().arreter();
  gestionnaire.ecrireRegion('fin', 'kanto', { ...lire(), ligueGagnee: 0 });
  const reprise = ouvrir();
  reprise.getState().lancerDefiChen();
  expect(lire().zoneId).toBe('kanto.bourg-palette');
  expect(lire().drapeaux).not.toContain('defi-chen-actif');
});
it('termine le traitement d’une capture avant le déplacement de fin du Pokédex', () => {
  const { store, ouvrir, gestionnaire, lire, horloge } = preparer();
  store.getState().arreter();
  const partie = gestionnaire.chargerPartie('fin')!;
  gestionnaire.ecrirePartie('fin', { ...partie.donnees, pokedexNational: partie.donnees.pokedexNational.slice(0, 150) });
  gestionnaire.ecrireRegion('fin', 'kanto', { ...lire(), zoneId: 'kanto.route-1',
    evenementsJoues: ['kanto.intro'] });
  const reprise = ouvrir();
  vi.spyOn(combat, 'avancerCombat').mockImplementationOnce(etat => ({ ...etat, evenements: [
    { type: 'capture-reussie', numero: 151, niveau: 5, shiny: false, boss: false, rarete: 'commun' },
    { type: 'arret-auto', motif: 'nouveau' },
  ] }));
  horloge.avancer(100);
  expect(() => reprise.getState().tick()).not.toThrow();
  expect(reprise.getState().evenement?.evenement).toBe('kanto.fin-pokedex');
});
