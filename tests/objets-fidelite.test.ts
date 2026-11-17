import { expect, it } from 'vitest';
import objets from '../data/objets.json';
import fixture from './fixtures/v1-objets.json';
import { reglages } from '../src/core/reglages';
import { chargerObjets, prixObjet } from '../src/core/boutique';

// Objets du Centre : prix de base de la V1, sauf calcium, pierres et Jeton Shiny dont le prix actuel est fixé par Nicolas.
const PRIX_ACTUELS: Record<string, { prix?: number; sansInflation?: boolean }> = {
  calcium: { prix: 20000 }, shinyToken: { prix: 1000000 },
  fireStone: { prix: 8000 }, waterStone: { prix: 8000 }, leafStone: { prix: 8000 },
  thunderStone: { prix: 8000 }, moonStone: { prix: 8000 }, everstone: { prix: 8000 },
};
function prixAttendu(source: { id: string; prix: number; type: string; noBadgeInflation: boolean }, badges: number, palier: boolean): number {
  const prix = PRIX_ACTUELS[source.id]?.prix ?? source.prix;
  const sansInflation = PRIX_ACTUELS[source.id]?.sansInflation ?? source.noBadgeInflation;
  const base = source.type === 'consumable' && !sansInflation ? Math.floor(prix * (1 + badges * reglages.boutique.inflationParBadge)) : prix;
  return palier ? Math.floor(base * 0.85) : base;
}

it('conserve les 31 objets V1 et convertit leurs zones', () => {
  expect(objets.length).toBe(32);
  expect(objets.filter(objet => objet.id !== 'pomegBerry').map(objet => objet.id)).toEqual(fixture.objets.map(objet => objet.id));
  expect(fixture.objets.length).toBe(31);
  for (const source of fixture.objets) {
    const objet = objets.find(entree => entree.id === source.id)!;
    expect(objet.prix).toBe(PRIX_ACTUELS[source.id]?.prix ?? source.prix);
    expect(objet.type).toBe(source.type === 'consumable' ? 'consommable' : 'amelioration');
    expect(objet.zone).toBe(source.zone == null || source.zone === 99 ? null : fixture.zones[source.zone]);
    expect(objet.boutique).toBe(source.zone === 99 ? null : source.shop ?? 'shop');
    expect(objet.sansInflation).toBe(PRIX_ACTUELS[source.id]?.sansInflation ?? source.noBadgeInflation);
    expect(objet.inventaire).toBe(source.type === 'consumable' ? source.id === 'candy' ? 'bonbon' : source.id : null);
  }
  expect(fixture.zones.length).toBe(22);
  expect(fixture.zones[2]).toBe('kanto.foret-de-jade');
});

it('calcule strictement chaque prix de la fixture V1', () => {
  const catalogue = chargerObjets();
  for (const cas of fixture.prix) {
    const objet = catalogue.find(entree => entree.id === cas.id)!;
    const source = fixture.objets.find(entree => entree.id === cas.id)!;
    expect(prixObjet(objet, { badges: cas.badges, palier: cas.palier })).toBe(prixAttendu(source, cas.badges, cas.palier));
  }
});

it('conserve les noms et images des balles de capture', () => {
  for (const balle of Object.values(reglages.capture.balles)) {
    const objet = objets.find(entree => entree.id === balle.cle)!;
    expect(objet.nom).toBe(balle.nom);
    expect(objet.image).toBe(balle.image);
    expect(objet.categorie).toBe('balles');
  }
});

it('garde les images absentes à null et les corrections décidées', () => {
  // Catalogue historique sans les icônes U-T2 et X-T2 ; les images réelles ont leurs tests dédiés.
  const objets = structuredClone([...chargerObjets()]).map(objet => ['shinyToken', 'diploma'].includes(objet.id) ? { ...objet, image: null } : objet);
  // Le Poké-Radar a reçu l'icône qu'il avait déjà en combat (tests/objets-images.test.ts) : il sort de cette liste.
  for (const id of ['runningShoes', 'falseSwipe', 'ctJackpot', 'shinyToken', 'shinyCharm', 'diploma']) {
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
