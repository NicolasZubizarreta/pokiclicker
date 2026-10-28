import { expect, it } from 'vitest';
import { chargerObjets } from './boutique';
import { deblocages, deblocagesAtteints, nouveauxDeblocages } from './deblocages';
import { kanto } from './regions';
import { etatMondeDe, regionInitiale, validerDonneesRegion } from './sauvegarde';

const depart = () => regionInitiale('kanto', 'kanto.route-1');
const avecBoss = (...zones: string[]) => ({ ...depart(), bossVaincus: zones });

it('décrit chaque fonction avec un texte français et un déclencheur connu du monde', () => {
  expect(deblocages.map(d => d.id)).toEqual(['sac', 'pc', 'pension', 'centre-commercial', 'casino',
    'poke-radar-au-shop', 'poke-radar', 'fauchage-au-shop', 'fauchage', 'auto-clic-au-shop', 'auto-clic']);
  for (const deblocage of deblocages) {
    expect(deblocage.texte).toMatch(/débloqué|disponible au Shop/);
    const declencheur = deblocage.declencheur;
    if ('zone' in declencheur) expect(() => kanto.zone(declencheur.zone)).not.toThrow();
    if ('lieu' in declencheur) expect(() => kanto.lieu(declencheur.lieu)).not.toThrow();
    if ('objetShop' in declencheur) expect(chargerObjets().some(objet => objet.id === declencheur.objetShop && objet.boutique === 'shop')).toBe(true);
  }
});

it('ouvre le Sac au départ, le PC avec Argenta, puis Pension, Centre et Casino avec la Tour Pokémon', () => {
  expect(deblocagesAtteints(depart(), kanto)).toEqual(['sac']);
  expect(deblocagesAtteints(avecBoss('kanto.route-1', 'kanto.foret-de-jade'), kanto)).toEqual(['sac', 'pc']);
  const tour = avecBoss('kanto.tour-pokemon');
  expect(deblocagesAtteints(tour, kanto)).toEqual(expect.arrayContaining(['pension', 'centre-commercial', 'casino']));
});

it('ouvre le Poké-Radar, le Fauchage et l’Auto-clic à l’achat de l’objet', () => {
  const region = { ...depart(), ameliorations: ['pokeradar', 'falseSwipe', 'leftovers'] };
  expect(deblocagesAtteints(region, kanto)).toEqual(['sac', 'poke-radar', 'fauchage', 'auto-clic']);
});

const idsZones = kanto.zones.map(zone => zone.id).filter(id => id !== 'kanto.bourg-palette');

it.each([
  ['poke-radar-au-shop', 'pokeradar', 'kanto.cave-taupiqueur', 'Poké-Radar disponible au Shop !'],
  ['fauchage-au-shop', 'falseSwipe', 'kanto.centrale', 'CT Fauchage disponible au Shop !'],
  ['auto-clic-au-shop', 'leftovers', 'kanto.sylphe-sarl', 'Auto-clic (Restes) disponible au Shop !'],
])('annonce %s à l’arrivée de l’objet %s au Shop, dès que la zone %s s’ouvre', (id, objet, zone, texte) => {
  expect(deblocages.find(d => d.id === id)!.texte).toBe(texte);
  expect(chargerObjets().find(o => o.id === objet)!.zone).toBe(zone);
  // Premier nombre de boss battus (dans l'ordre des zones) qui ouvre la zone de l'objet.
  const ouvre = idsZones.findIndex((_, rang) => kanto.zonesOuvertes(etatMondeDe(avecBoss(...idsZones.slice(0, rang + 1))))
    .some(ouverte => ouverte.id === zone));
  expect(ouvre).toBeGreaterThan(0);
  expect(deblocagesAtteints(avecBoss(...idsZones.slice(0, ouvre)), kanto)).not.toContain(id);
  expect(deblocagesAtteints(avecBoss(...idsZones.slice(0, ouvre + 1)), kanto)).toContain(id);
  // L'achat de l'objet ne retire pas l'annonce du Shop : elle est déjà vue, et l'annonce d'achat reste distincte.
  const achete = { ...avecBoss(...idsZones.slice(0, ouvre + 1)), ameliorations: [objet] };
  expect(deblocagesAtteints(achete, kanto)).toEqual(expect.arrayContaining([id, id.replace('-au-shop', '')]));
});

it('annonce l’arrivée au Shop sans attendre l’achat, et ne la rejoue pas une fois vue', () => {
  const region = { ...avecBoss(...idsZones.slice(0, 12)), annoncesVues: ['sac', 'pc', 'pension', 'centre-commercial', 'casino'] };
  const ids = (r: typeof region) => nouveauxDeblocages(r, kanto, []).annoncer.map(d => d.id);
  expect(ids(region)).toEqual(['poke-radar-au-shop', 'fauchage-au-shop']);
  expect(ids({ ...region, annoncesVues: [...region.annoncesVues, 'poke-radar-au-shop', 'fauchage-au-shop'] })).toEqual([]);
});

it('ne propose que les fonctions ouvertes et pas encore vues, dans l’ordre du fichier', () => {
  const tour = { ...avecBoss('kanto.tour-pokemon'), annoncesVues: ['sac', 'pc'] };
  expect(nouveauxDeblocages(tour, kanto, []).annoncer.map(d => d.id)).toEqual(['pension', 'centre-commercial', 'casino']);
  expect(nouveauxDeblocages(tour, kanto, ['pension', 'casino']).annoncer.map(d => d.id)).toEqual(['centre-commercial']);
  expect(nouveauxDeblocages({ ...tour, annoncesVues: deblocagesAtteints(tour, kanto) }, kanto, []))
    .toEqual({ annoncer: [], silencieux: [] });
});

it('ne rejoue pas le Sac quand l’intro l’a déjà annoncé', () => {
  expect(nouveauxDeblocages({ ...depart(), annoncesVues: [] }, kanto, []).annoncer.map(d => d.id)).toEqual(['sac']);
  const intro = { ...depart(), annoncesVues: [], drapeaux: ['sac-ouvert'] };
  expect(nouveauxDeblocages(intro, kanto, [])).toEqual({ annoncer: [], silencieux: ['sac'] });
});

it('accepte une sauvegarde sans annoncesVues et refuse un champ mal formé', () => {
  const region = depart();
  expect(region.annoncesVues).toBeUndefined();
  expect(() => validerDonneesRegion(region)).not.toThrow();
  expect(() => validerDonneesRegion({ ...region, annoncesVues: ['pc'] })).not.toThrow();
  expect(() => validerDonneesRegion({ ...region, annoncesVues: 'pc' })).toThrow();
});
