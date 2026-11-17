import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { compteInitial, creerGestionnaire, creerStockageMemoire, type PokemonPossede } from '../core/sauvegarde';
import { reglages } from '../core/reglages';
import { calculerOr } from '../core/recompenses';
import { creerStoreJeu, type StoreJeu } from './store';

const stores: StoreJeu[] = [];
beforeEach(() => vi.useFakeTimers());
afterEach(() => { stores.forEach(s => s.getState().arreter()); stores.length = 0; vi.useRealTimers(); });
const pokemon = (uid: string): PokemonPossede => ({ uid, numero: 6, niveau: 100, calcium: 100000,
  xp: 0, shiny: false, sexe: 'male', bonheur: 0, pierreEternelle: false, favori: false });
function preparer({ actif = true, connue = true, shiny = false, pleine = false, oeufs = 0, dexOeuf = true, ancienOeuf = false } = {}) {
  const stockage = creerStockageMemoire(), horloge = creerHorlogeSimulee();
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: () => 'test' });
  const compte = compteInitial();
  gestionnaire.ecrireCompte({ ...compte, preferences: { ...compte.preferences, autoAttaque: false,
    arretAuto: { ...reglages.depart.preferences.arretAuto, actif: false } } });
  gestionnaire.creerPartie('Test');
  const partie = gestionnaire.chargerPartie('test')!.donnees;
  gestionnaire.ecrirePartie('test', { ...partie, pokedexNational: connue ? Array.from({ length: 151 }, (_, i) => i + 1) : [] });
  const lire = () => gestionnaire.chargerRegion('test', 'kanto')!.donnees;
  gestionnaire.ecrireRegion('test', 'kanto', { ...lire(),
    especesEcloses: dexOeuf ? [133] : [], inventaire: { masterball: 3 },
    equipe: [...Array.from({ length: pleine ? 6 : 1 }, (_, i) => pokemon(`fort-${i}`)),
      ...Array.from({ length: oeufs }, (_, i) => ({ ...pokemon(`oeuf-${i}`), numero: 133, niveau: 1,
        shiny, oeuf: { pasRestants: 1, pasMax: 25 }, ...(ancienOeuf ? { niveau: 50, xp: 99, bonheur: 40 } : {}) }))] });
  let id = 0;
  const ouvrir = () => {
    const store = creerStoreJeu({ stockage, horloge, alea: () => shiny ? 0 : .1, genererId: () => `id-${++id}` });
    stores.push(store); store.getState().demarrer(); return store;
  };
  const store = ouvrir();
  expect(store.getState().relacherDoublons).toBe(false);
  store.getState().reglerRelacherDoublons(actif);
  store.getState().allerVers('kanto.route-1');
  const avancer = () => { horloge.avancer(100); store.getState().tick(); };
  const capturer = () => { store.getState().capturer('masterball'); for (let i = 0; i < 10; i++) avancer(); };
  const victoire = () => {
    const avant = store.getState().argent;
    for (let i = 0; i < 10000 && store.getState().argent === avant; i++) { store.getState().attaquer(); avancer(); }
    expect(store.getState().argent).toBeGreaterThan(avant);
  };
  return { store, lire, ouvrir, capturer, victoire };
}
it('capture : option éteinte garde le doublon', () => {
  const p = preparer({ actif: false }); p.capturer(); expect(p.lire().equipe).toHaveLength(2);
});
it('capture : doublon relâché, équipe et PC inchangés, or versé et annonce unique', () => {
  const p = preparer(); const avant = p.lire(); const ennemi = p.store.getState().ennemi!;
  p.capturer();
  expect(p.lire().equipe).toEqual(avant.equipe); expect(p.lire().pc).toEqual(avant.pc);
  expect(p.lire().argent).toBe(avant.argent + calculerOr(ennemi, []) * reglages.recompenses.or.capture);
  expect(p.store.getState().annonce?.match(/1 doublon relâché/g)).toHaveLength(1);
});
it('capture : espèce nouvelle gardée et inscrite', () => {
  const p = preparer({ connue: false }); const numero = p.store.getState().ennemi!.numero; p.capturer();
  expect(p.lire().equipe).toHaveLength(2); expect(p.store.getState().pokedex).toContain(numero);
});
it('capture : shiny connu gardé', () => { const p = preparer({ shiny: true }); p.capturer(); expect(p.lire().equipe).toHaveLength(2); });
it('capture : équipe pleine aucun doublon envoyé au PC', () => {
  const p = preparer({ pleine: true }); const pc = p.lire().pc; p.capturer();
  expect(p.lire().pc).toEqual(pc); expect(p.store.getState().annonce).not.toContain('envoyé au PC');
});
it('éclosion : doublon retiré sans fenêtre et sans objet rendu', () => {
  const p = preparer({ oeufs: 1 }); const inventaire = p.lire().inventaire; p.victoire();
  expect(p.lire().equipe.map(p => p.uid)).toEqual(['fort-0']);
  expect(p.store.getState().eclosion).toBeNull(); expect(p.lire().inventaire).toEqual(inventaire);
});
it('éclosion : espèce nouvelle gardée', () => {
  const p = preparer({ oeufs: 1, dexOeuf: false, connue: false }); p.victoire();
  expect(p.lire().equipe).toHaveLength(2); expect(p.store.getState().eclosion?.uid).toBe('oeuf-0');
});
it('éclosion : deux œufs nouveaux gardent seulement le premier', () => {
  const p = preparer({ oeufs: 2, dexOeuf: false }); p.victoire();
  expect(p.lire().equipe.map(p => p.uid)).toEqual(['fort-0', 'oeuf-0']);
  p.store.getState().fermerEclosion(); expect(p.store.getState().eclosion).toBeNull();
});
it('éclosion : shiny connu gardé et inscrit aux dex shiny', () => {
  const p = preparer({ oeufs: 1, shiny: true }); p.victoire();
  expect(p.lire().equipe).toHaveLength(2); expect(p.lire().especesShiny).toContain(133);
  expect(p.store.getState().pension.especesEclosesShiny).toContain(133);
});
it('éclosion : option éteinte garde tous les œufs', () => {
  const p = preparer({ oeufs: 2, actif: false }); p.victoire(); expect(p.lire().equipe).toHaveLength(3);
});
it('éclosion : connue au Pokédex seulement reste gardée', () => {
  const p = preparer({ oeufs: 1, dexOeuf: false }); p.victoire(); expect(p.lire().equipe).toHaveLength(2);
});
it('notification : deux doublons relâchés annoncés une seule fois', () => {
  const p = preparer({ oeufs: 2 }); p.victoire();
  expect(p.store.getState().annonce?.match(/2 doublons relâchés/g)).toHaveLength(1);
});
it('préférence désactivée par défaut puis persistée avec le compte', () => {
  const p = preparer(); p.store.getState().arreter(); expect(p.ouvrir().getState().relacherDoublons).toBe(true);
});
it.each([false, true])('éclosion d’un œuf d’ancienne sauvegarde : niveau 1, XP 0, bonheur de naissance (passer les éclosions=%s)', passer => {
  const p = preparer({ oeufs: 1, dexOeuf: false, ancienOeuf: true });
  p.store.getState().reglerPasserEclosions(passer); p.victoire();
  expect(p.lire().equipe.find(e => e.uid === 'oeuf-0')).toMatchObject({ niveau: 1, xp: 0, bonheur: reglages.pension.bonheurNaissance });
  if (!passer) expect(p.store.getState().eclosion).toMatchObject({ niveau: 1, bonheur: reglages.pension.bonheurNaissance });
});
