import { expect, it } from 'vitest';
import fixture from '../../tests/fixtures/v1-centre.json';
import objetsV1 from '../../tests/fixtures/v1-objets.json';
import { ECARTS_V1, prixAttendu } from '../../tests/ecarts-v1';
import { accesCentre, acheter, chargerObjets, objetsDuCentre, prixObjet } from './boutique';
import { kanto } from './regions';
import type { EtatMonde } from './conditions';

const objets = chargerObjets();
const etat: EtatMonde = { badges: [], bossVaincus: ['kanto.tour-pokemon'], objets: [], quetes: [], drapeaux: [] };

// Prix attendu : celui de la V1, sauf pour les écarts voulus de `tests/ecarts-v1.ts` (calcium, pierres).
function prixDuCentre(id: string, prixV1: number, badges: number, palier: boolean): number {
  const source = objetsV1.objets.find(objet => objet.id === id)!;
  return id in ECARTS_V1 ? prixAttendu(source, badges, palier) : prixV1;
}

it('conserve l’ordre et chaque prix affiché du Centre V1, aux écarts voulus près', () => {
  const catalogue = objetsDuCentre(objets, kanto, etat);
  expect(catalogue.map(objet => objet.id)).toEqual(fixture.ordre);
  for (const cas of fixture.affichage) {
    expect(catalogue.map(objet => ({ id: objet.id, prix: prixObjet(objet, cas) })))
      .toEqual(cas.objets.map(({ id, prix }) => ({ id, prix: prixDuCentre(id, prix, cas.badges, cas.palier) })));
  }
});

it('reproduit les 99 achats V1 sans modifier les entrées', () => {
  for (const cas of fixture.achats) {
    const objet = objets.find(objet => objet.id === cas.id)!;
    const region = { argent: cas.argent, inventaire: { [objet.inventaire!]: 2 }, ameliorations: [] as string[] };
    const avant = structuredClone({ region, objet });
    const achat = acheter(region, objet, 1, prixObjet(objet, { badges: cas.badges, palier: false }));
    const prix = prixDuCentre(cas.id, cas.argent - cas.argentApres, cas.badges, false);
    const refuse = cas.id in ECARTS_V1 ? cas.argent < prix : cas.stockApres === 2;
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
