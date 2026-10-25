import { expect, it } from 'vitest';
import objets from '../data/objets.json';
import fixture from './fixtures/v1-objets.json';
import { reglages } from '../src/core/reglages';
import { chargerObjets, prixObjet } from '../src/core/boutique';

it('conserve les 31 objets V1 et convertit leurs zones', () => {
  expect(objets.length).toBe(31);
  expect(fixture.objets.length).toBe(31);
  for (const source of fixture.objets) {
    const objet = objets.find(entree => entree.id === source.id)!;
    expect(objet.prix).toBe(source.prix);
    expect(objet.type).toBe(source.type === 'consumable' ? 'consommable' : 'amelioration');
    expect(objet.zone).toBe(source.zone == null || source.zone === 99 ? null : fixture.zones[source.zone]);
    expect(objet.boutique).toBe(source.zone === 99 ? null : source.shop ?? 'shop');
    expect(objet.sansInflation).toBe(source.noBadgeInflation);
    expect(objet.inventaire).toBe(source.type === 'consumable' ? source.id === 'candy' ? 'bonbon' : source.id : null);
  }
  expect(fixture.zones.length).toBe(22);
  expect(fixture.zones[2]).toBe('kanto.foret-de-jade');
});

it('calcule strictement chaque prix de la fixture V1', () => {
  const catalogue = chargerObjets();
  for (const cas of fixture.prix) {
    const objet = catalogue.find(entree => entree.id === cas.id)!;
    expect(prixObjet(objet, { badges: cas.badges, palier: cas.palier })).toBe(cas.prix);
  }
});

it('conserve les noms et images des balles de capture', () => {
  for (const balle of Object.values(reglages.capture.balles)) {
    const objet = objets.find(entree => entree.nom === balle.nom)!;
    expect(objet.nom).toBe(balle.nom);
    expect(objet.image).toBe(balle.image);
    expect(objet.categorie).toBe('balles');
  }
});

it('garde les images absentes à null et les corrections décidées', () => {
  for (const id of ['runningShoes', 'pokeradar', 'falseSwipe', 'ctJackpot', 'shinyToken', 'shinyCharm', 'diploma']) {
    expect(objets.find(objet => objet.id === id)!.image).toBe(null);
  }
  expect(objets.find(objet => objet.id === 'runningShoes')!.description).toBe("Réduit l'attente entre deux ennemis à 1 s.");
  expect(objets.find(objet => objet.id === 'bicycle')!.description).toBe("Réduit l'attente entre deux ennemis à 0,5 s (remplace les Chaussures).");
  expect(objets.find(objet => objet.id === 'luckyEgg')!.nom).toBe('Œuf Chance');
  expect(fixture.prix.length).toBe(31 * 9 * 2);
  for (const cas of fixture.prix) {
    const source = fixture.objets.find(objet => objet.id === cas.id)!;
    const base = source.type === 'consumable' && !source.noBadgeInflation
      ? Math.floor(source.prix * (1 + cas.badges * 0.05)) : source.prix;
    expect(cas.prix).toBe(cas.palier ? Math.floor(base * 0.85) : base);
  }
});
