import { expect, it } from 'vitest';
import fixture from '../../tests/fixtures/v1-centre.json';
import objetsV1 from '../../tests/fixtures/v1-objets.json';
import { accesCentre, acheter, chargerObjets, objetsDuCentre, prixObjet } from './boutique';
import { kanto } from './regions';
import { reglages } from './reglages';
import type { EtatMonde } from './conditions';

// Objets du Centre : prix de base de la V1, sauf calcium, pierres et Jeton Shiny dont le prix actuel est fixé par Nicolas.
const PRIX_ACTUELS: Record<string, { prix?: number; sansInflation?: boolean }> = {
  calcium: { prix: 20000 }, shinyToken: { prix: 1000000, sansInflation: false },
  fireStone: { prix: 8000 }, waterStone: { prix: 8000 }, leafStone: { prix: 8000 },
  thunderStone: { prix: 8000 }, moonStone: { prix: 8000 }, everstone: { prix: 8000 },
};
function prixAttendu(source: { id: string; prix: number; type: string; noBadgeInflation: boolean }, badges: number, palier: boolean): number {
  const prix = PRIX_ACTUELS[source.id]?.prix ?? source.prix;
  const sansInflation = PRIX_ACTUELS[source.id]?.sansInflation ?? source.noBadgeInflation;
  const base = source.type === 'consumable' && !sansInflation ? Math.floor(prix * (1 + badges * reglages.boutique.inflationParBadge)) : prix;
  return palier ? Math.floor(base * 0.85) : base;
}

const objets = chargerObjets();
const etat: EtatMonde = { badges: [], bossVaincus: ['kanto.tour-pokemon'], objets: [], quetes: [], drapeaux: [] };

function prixDuCentre(id: string, badges: number, palier: boolean): number {
  const source = objetsV1.objets.find(objet => objet.id === id)!;
  return prixAttendu(source, badges, palier);
}

it('conserve l’ordre et chaque prix affiché du Centre V1, aux écarts voulus près', () => {
  const catalogue = objetsDuCentre(objets, kanto, etat).filter(objet => objet.id !== 'pomegBerry');
  expect(catalogue.map(objet => objet.id)).toEqual(fixture.ordre);
  for (const cas of fixture.affichage) {
    expect(catalogue.map(objet => ({ id: objet.id, prix: prixObjet(objet, cas) })))
      .toEqual(cas.objets.map(({ id }) => ({ id, prix: prixDuCentre(id, cas.badges, cas.palier) })));
  }
});

it('reproduit les 99 achats V1 sans modifier les entrées', () => {
  for (const cas of fixture.achats) {
    const objet = objets.find(objet => objet.id === cas.id)!;
    const region = { argent: cas.argent, inventaire: { [objet.inventaire!]: 2 }, ameliorations: [] as string[] };
    const avant = structuredClone({ region, objet });
    const achat = acheter(region, objet, 1, prixObjet(objet, { badges: cas.badges, palier: false }));
    const prix = prixDuCentre(cas.id, cas.badges, false);
    const refuse = cas.argent < prix;
    if (refuse) expect(achat).toEqual({ ok: false, raison: "Pas assez d'argent." });
    else expect(achat).toEqual({ ok: true, region: { ...region, argent: cas.argent - prix,
      inventaire: { [objet.inventaire!]: 3 } } });
    expect({ region, objet }).toEqual(avant);
  }
});

it.each(fixture.acces)('reproduit l’accès V1 pour unlockedZone=$unlockedZone', ({ unlockedZone, actif }) => {
  const entree = { ...etat, bossVaincus: kanto.zones
    .filter(zone => zone.ancienId >= 1 && zone.ancienId < unlockedZone).map(zone => zone.id) };
  const avant = structuredClone(entree);
  expect(accesCentre(kanto, entree)).toEqual(actif ? { ok: true }
    : { ok: false, raison: 'Bats le boss de Tour Pokémon.' });
  expect(entree).toEqual(avant);
});
