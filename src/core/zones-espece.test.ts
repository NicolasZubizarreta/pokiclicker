import { expect, it } from 'vitest';
import fichier from '../../data/regions/kanto/zones.json';
import evolutions from '../../data/evolutions.json';
import { zonesDeEspece } from './zones-espece';

const zones = [
  { id: 'b', nom: 'Deuxième', sauvages: [{ pokemon: 10 }], boss: { pokemon: 99 } },
  { id: 'a', nom: 'Première', sauvages: [{ pokemon: 10 }, { pokemon: 11 }] },
  { id: 'ville', nom: 'Ville' },
];
const donnees = { zones, evolutions: { niveau: [
  { de: 10, vers: 11, niveau: 10 }, { de: 11, vers: 12, niveau: 20 },
], pierre: [{ de: 12, vers: 13, pierre: 'pierre' }] } };
const deuxZones = zones.slice(0, 2).map(({ id, nom }) => ({ id, nom }));

it('renvoie les zones sauvages dans leur ordre sans modifier les données', () => {
  const avant = structuredClone(donnees);
  expect(zonesDeEspece(10, donnees)).toEqual({ zones: deuxZones, via: null });
  expect(donnees).toEqual(avant);
});

it('remonte au stade disponible le plus proche, y compris par pierre', () => {
  expect(zonesDeEspece(12, donnees)).toEqual({ zones: [deuxZones[1]], via: 11 });
  expect(zonesDeEspece(13, donnees)).toEqual({ zones: [deuxZones[1]], via: 11 });
  const sansIntermediaire = { ...donnees, zones: [zones[0]!] };
  expect(zonesDeEspece(12, sansIntermediaire)).toEqual({ zones: [deuxZones[0]], via: 10 });
});

it('renvoie un résultat vide sans sauvage, même pour un boss ou une lignée absente', () => {
  const boss = { id: 'boss', nom: 'Boss', sauvages: [], boss: { pokemon: 99 } };
  for (const numero of [99, 100, 13]) {
    expect(zonesDeEspece(numero, { ...donnees, zones: [boss] })).toEqual({ zones: [], via: null });
  }
});

it('retrouve les zones réelles et le premier ancêtre sauvage à partir des JSON', () => {
  const sauvages = (numero: number) => fichier.zones
    .filter(zone => zone.sauvages?.some(p => p.pokemon === numero))
    .map(({ id, nom }) => ({ id, nom }));
  const origines = new Map([...evolutions.niveau, ...evolutions.pierre].map(e => [e.vers, e.de]));
  expect(sauvages(19).length).toBeGreaterThan(0);
  expect(zonesDeEspece(19)).toEqual({ zones: sauvages(19), via: null });
  expect(sauvages(65)).toEqual([]);
  let ancetre = origines.get(65)!;
  while (!sauvages(ancetre).length && origines.has(ancetre)) ancetre = origines.get(ancetre)!;
  expect(sauvages(ancetre).length).toBeGreaterThan(0);
  expect(zonesDeEspece(65)).toEqual({ zones: sauvages(ancetre), via: ancetre });
  const introuvable = Array.from({ length: 151 }, (_, i) => i + 1).find(numero => {
    let stade = numero;
    while (!sauvages(stade).length) {
      const origine = origines.get(stade);
      if (origine === undefined) return true;
      stade = origine;
    }
    return false;
  });
  // Toutes les espèces peuvent être accessibles : vérifier alors un numéro hors catalogue.
  expect(zonesDeEspece(introuvable ?? 0)).toEqual({ zones: [], via: null });
});
