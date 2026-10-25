import { expect, it } from 'vitest';
import fixture from '../../tests/fixtures/v1-centre.json';
import { accesCentre, acheter, chargerObjets, objetsDuCentre, prixObjet } from './boutique';
import { kanto } from './regions';
import type { EtatMonde } from './conditions';

const objets = chargerObjets();
const etat: EtatMonde = { badges: [], bossVaincus: ['kanto.tour-pokemon'], objets: [], quetes: [], drapeaux: [] };

it('conserve l’ordre et chaque prix affiché du Centre V1', () => {
  const catalogue = objetsDuCentre(objets, kanto, etat);
  expect(catalogue.map(objet => objet.id)).toEqual(fixture.ordre);
  for (const cas of fixture.affichage) {
    expect(catalogue.map(objet => ({ id: objet.id, prix: prixObjet(objet, cas) })))
      .toEqual(cas.objets.map(({ id, prix }) => ({ id, prix })));
  }
});

it('reproduit les 99 achats V1 sans modifier les entrées', () => {
  for (const cas of fixture.achats) {
    const objet = objets.find(objet => objet.id === cas.id)!;
    const region = { argent: cas.argent, inventaire: { [objet.inventaire!]: 2 }, ameliorations: [] as string[] };
    const avant = structuredClone({ region, objet });
    const achat = acheter(region, objet, 1, prixObjet(objet, { badges: cas.badges, palier: false }));
    if (cas.stockApres === 2) expect(achat).toEqual({ ok: false, raison: "Pas assez d'argent." });
    else expect(achat).toEqual({ ok: true, region: { ...region, argent: cas.argentApres,
      inventaire: { [objet.inventaire!]: cas.stockApres } } });
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
