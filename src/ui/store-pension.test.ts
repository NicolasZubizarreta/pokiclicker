import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { chargerEvenements } from '../core/evenements';
import { kanto } from '../core/regions';
import { reglages } from '../core/reglages';
import { compteInitial, creerGestionnaire, creerStockageMemoire, type DonneesRegion, type PokemonPossede } from '../core/sauvegarde';
import { creerStoreJeu, type StoreJeu } from './store';

const stores: StoreJeu[] = [];
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  stores.forEach(store => store.getState().arreter());
  stores.length = 0;
  vi.useRealTimers();
});

const pokemon = (uid: string, numero = 25, sexe: PokemonPossede['sexe'] = 'femelle'): PokemonPossede => ({
  uid, numero, sexe, niveau: 100, xp: 0, shiny: false, bonheur: 0,
  pierreEternelle: false, calcium: 0, favori: false,
});

function preparer(modifier: (region: DonneesRegion) => DonneesRegion = region => region) {
  const stockage = creerStockageMemoire();
  const horloge = creerHorlogeSimulee();
  let id = 0;
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: () => 'test' });
  const compte = compteInitial();
  gestionnaire.ecrireCompte({ ...compte, preferences: { ...compte.preferences, autoAttaque: false,
    arretAuto: { ...reglages.depart.preferences.arretAuto, actif: false } } });
  gestionnaire.creerPartie('Test', 'kanto.bourg-palette');
  const lire = () => gestionnaire.chargerRegion('test', 'kanto')!.donnees;
  gestionnaire.ecrireRegion('test', 'kanto', modifier({ ...lire(), argent: 100000,
    equipe: [{ ...pokemon('fort', 6), calcium: 100000 }], pc: [pokemon('mere', 26), pokemon('pere', 26, 'male')],
    bossVaincus: ['kanto.tour-pokemon'] }));
  const ouvrir = () => {
    const store = creerStoreJeu({ stockage, horloge, alea: () => 0, genererId: () => `oeuf-${++id}`,
      evenements: chargerEvenements({ test: { version: 1, evenements: [] } }, kanto) });
    stores.push(store);
    store.getState().demarrer();
    expect(store.getState().erreur).toBeNull();
    return store;
  };
  const store = ouvrir();
  const victoire = (cible = store) => {
    const avant = cible.getState().argent;
    for (let i = 0; i < 10000 && cible.getState().argent === avant; i++) {
      cible.getState().attaquer();
      horloge.avancer(100);
      cible.getState().tick();
    }
    expect(cible.getState().argent).toBeGreaterThan(avant);
  };
  return { store, ouvrir, lire, horloge, victoire, gestionnaire };
}

it('pond après une victoire, retire l’œuf, avance et éclot à la 25e victoire avec annonce et Pokédex', () => {
  const p = preparer();
  expect(p.store.getState().deposerParent('mere')).toBeNull();
  expect(p.store.getState().deposerParent('pere')).toBeNull();
  expect(p.store.getState().pension.chance).toBe(.04);
  p.store.getState().allerVers('kanto.route-1');
  p.victoire();
  const oeuf = p.store.getState().pension.oeufs[0]!;
  expect(p.store.getState().pension.oeufs).toHaveLength(1);
  expect(oeuf.oeuf).toEqual({ pasRestants: 25, pasMax: 25 });
  expect(p.lire().pension.oeufs).toEqual([oeuf]);
  expect(p.store.getState().pokedex).not.toContain(25);
  expect(p.store.getState().prendreOeuf(oeuf.uid)).toBeNull();
  expect(p.store.getState().pokedex).toContain(25);
  for (let i = 0; i < 24; i++) p.victoire();
  expect(p.store.getState().equipe.find(p => p?.pokemon.uid === oeuf.uid)?.pokemon.oeuf?.pasRestants).toBe(1);
  expect(p.lire().equipe.find(p => p.uid === oeuf.uid)?.oeuf?.pasRestants).toBe(1);
  p.store.getState().arreter();
  const reprise = p.ouvrir();
  expect(reprise.getState().equipe.find(p => p?.pokemon.uid === oeuf.uid)?.pokemon.oeuf?.pasRestants).toBe(1);
  reprise.getState().arreter();
  p.store.getState().demarrer();
  p.victoire();
  expect(p.store.getState().equipe.find(p => p?.pokemon.uid === oeuf.uid)?.pokemon).toMatchObject({ niveau: 1, bonheur: 125, shiny: true });
  expect(p.store.getState().equipe.find(p => p?.pokemon.uid === oeuf.uid)?.pokemon.oeuf).toBeUndefined();
  expect(p.store.getState().pokedex).toContain(25);
  expect(p.store.getState().annonce).toContain('Pikachu éclot !');
  expect(p.lire().equipe.find(p => p.uid === oeuf.uid)?.oeuf).toBeUndefined();
});

it('persiste les parents, les œufs et les emplacements et garde une référence stable', () => {
  const p = preparer();
  p.store.getState().deposerParent('mere');
  p.store.getState().deposerParent('pere');
  expect(p.store.getState().acheterEmplacementOeuf()).toBeNull();
  p.store.getState().allerVers('kanto.route-1');
  p.victoire();
  const pension = p.store.getState().pension;
  expect(pension).toMatchObject({ emplacements: 2, emplacementsMax: 5, prochainEmplacement: { prix: 10000, raison: null } });
  p.horloge.avancer(100);
  p.store.getState().tick();
  expect(p.store.getState().pension).toBe(pension);
  p.store.getState().arreter();
  const reprise = p.ouvrir();
  expect(reprise.getState().pension).toEqual(pension);
  expect(reprise.getState().retirerParent('mere')).toBeNull();
  expect(reprise.getState().equipe.some(p => p?.pokemon.uid === 'mere')).toBe(true);
  expect(p.lire().pension.parents.map(p => p.uid)).toEqual(['pere']);
});

it('bloque la ponte avant la Tour Pokémon et annonce le déblocage une seule fois', () => {
  const p = preparer(region => ({ ...region, bossVaincus: [], zoneId: 'kanto.tour-pokemon',
    etape: reglages.combat.etapeBoss, pension: { ...region.pension, parents: [pokemon('mere'), pokemon('pere', 25, 'male')] } }));
  expect(p.store.getState().pension.acces).toEqual({ ouvert: false, raison: 'Bats le boss de Tour Pokémon.' });
  p.victoire();
  expect(p.store.getState().pension.oeufs).toHaveLength(0);
  expect(p.store.getState().pension.acces).toEqual({ ouvert: true, raison: null });
  const annonces = (cible: StoreJeu) => {
    const textes: string[] = [];
    for (let i = 0; i < 200; i++) {
      p.horloge.avancer(100);
      cible.getState().tick();
      const texte = cible.getState().deblocage;
      if (texte !== null && !textes.includes(texte)) textes.push(texte);
    }
    return textes;
  };
  expect(annonces(p.store)[0]).toBe('Pension débloquée ! Elle est à Bourg Palette.');
  expect(p.lire().annoncesVues).toContain('pension');
  p.store.getState().arreter();
  p.gestionnaire.ecrireRegion('test', 'kanto', { ...p.lire(), etape: reglages.combat.etapeBoss });
  const reprise = p.ouvrir();
  expect(reprise.getState().deblocage).toBeNull();
  p.victoire(reprise);
  expect(annonces(reprise)).not.toContain('Pension débloquée ! Elle est à Bourg Palette.');
});

it('inscrit aussi au Pokédex une espèce inconnue lors de l’éclosion', () => {
  const p = preparer(region => ({ ...region, equipe: [...region.equipe,
    { ...pokemon('oeuf', 133), niveau: 1, bonheur: 0, oeuf: { pasRestants: 1, pasMax: 25 } }] }));
  expect(p.store.getState().pokedex).not.toContain(133);
  p.store.getState().allerVers('kanto.route-1');
  p.victoire();
  expect(p.store.getState().pokedex).toContain(133);
  expect(p.store.getState().annonce).toContain('Évoli éclot !');
  p.store.getState().arreter();
  expect(p.ouvrir().getState().pokedex).toContain(133);
});

it('affiche le refus du prochain achat puis la limite des cinq emplacements', () => {
  const pauvre = preparer(region => ({ ...region, argent: 4999 }));
  expect(pauvre.store.getState().pension.prochainEmplacement).toEqual({ prix: 5000, raison: "Pas assez d'argent." });
  expect(pauvre.store.getState().acheterEmplacementOeuf()).toBe("Pas assez d'argent.");
  const p = preparer();
  for (let i = 0; i < 4; i++) expect(p.store.getState().acheterEmplacementOeuf()).toBeNull();
  expect(p.store.getState().pension.prochainEmplacement).toBeNull();
  expect(p.store.getState().acheterEmplacementOeuf()).toBe('La pension est pleine.');
});

it('retire vers le PC quand l’équipe est pleine et annonce la destination', () => {
  const p = preparer(region => ({ ...region, equipe: Array.from({ length: 6 }, (_, i) => pokemon(`equipe-${i}`, 6)),
    pension: { ...region.pension, parents: [pokemon('mere')],
      oeufs: [{ ...pokemon('oeuf'), niveau: 1, bonheur: 0, oeuf: { pasRestants: 25, pasMax: 25 } }] } }));
  expect(p.store.getState().retirerParent('mere')).toBeNull();
  expect(p.store.getState().annonce).toBe('Pikachu est envoyé au PC.');
  expect(p.store.getState().prendreOeuf('oeuf')).toBeNull();
  expect(p.store.getState().pc.map(p => p.uid)).toContain('oeuf');
  expect(p.store.getState().pokedex).toContain(25);
  expect(p.lire().pension.oeufs).toHaveLength(0);
});
