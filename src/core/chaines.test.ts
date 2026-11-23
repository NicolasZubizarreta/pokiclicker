import { expect, it } from 'vitest';
import { avancerChaine, chaineDesActifs, cleChaine, multiplicateurChaine } from './chaines';
import { creerEnnemi } from './ennemis';
import { reglages } from './reglages';
import { noterCombat, suiviVide } from './suivi';
import type { Zone } from './monde';

const sauvage = (numero: number, shiny = false, boss = false) => ({ numero, shiny, boss });
const zone = { id: 'z', type: 'route', etapes: 10, niveaux: [5, 5], multiplicateurPv: 1,
  sauvages: [{ pokemon: 19, rarete: 'commun', apparition: 1, capture: 100 }], boss: { pokemon: 20, niveau: 9, capture: 0 } } as unknown as Zone;

it('prolonge la chaîne sur la même espèce et la remet à une sur une autre', () => {
  let c = avancerChaine(undefined, sauvage(19));
  expect(c).toEqual({ numero: 19, longueur: 1 });
  c = avancerChaine(c, sauvage(19));
  expect(c.longueur).toBe(2);
  expect(avancerChaine(c, sauvage(16))).toEqual({ numero: 16, longueur: 1 });
});

it('un boss ne touche pas la chaîne et un chromatique la clôt', () => {
  const c = { numero: 19, longueur: 7 };
  expect(avancerChaine(c, sauvage(20, false, true))).toBe(c);
  expect(avancerChaine(c, sauvage(19, true))).toEqual({ numero: 0, longueur: 0 });
});

it('le multiplicateur prend le plus haut palier atteint, sans dépasser le dernier', () => {
  expect(reglages.combat.chaines.map(p => p.longueur)).toEqual([5, 10, 20]);
  expect([1, 4, 5, 9, 10, 19, 20, 500].map(n => multiplicateurChaine(n))).toEqual([1, 1, 1.25, 1.25, 1.5, 1.5, 2, 2]);
});

it('la chaîne passe par les objets actifs et se relit', () => {
  const cles = cleChaine({ numero: 19, longueur: 6 });
  expect(chaineDesActifs([...cles, 'badge:roche'])).toEqual({ numero: 19, longueur: 6 });
  expect(chaineDesActifs(['badge:roche'])).toBeNull();
  expect(cleChaine(undefined)).toEqual([]);
});

it('augmente la chance chromatique de l’espèce de la chaîne seulement, sans changer la suite de tirages', () => {
  const alea = (valeur: number) => { const tirages = [valeur, 0, 0, 0.5, 0.5]; let i = 0; return () => tirages[i++] ?? 0; };
  // Chance de base 1/512 ; un tirage à 0,0022 la rate sans chaîne et la réussit avec une chaîne de 5 (×1,25).
  const chance = reglages.combat.chanceShiny;
  const tirage = chance * 1.1;
  expect(creerEnnemi(zone, 1, alea(tirage)).shiny).toBe(false);
  expect(creerEnnemi(zone, 1, alea(tirage), reglages.combat, cleChaine({ numero: 19, longueur: 5 })).shiny).toBe(true);
  expect(creerEnnemi(zone, 1, alea(tirage), reglages.combat, cleChaine({ numero: 16, longueur: 5 })).shiny).toBe(false);
  expect(creerEnnemi(zone, 1, alea(tirage), reglages.combat, cleChaine({ numero: 19, longueur: 4 })).shiny).toBe(false);
});

it('le suivi garde la chaîne et son record', () => {
  let s = suiviVide();
  const contexte = { tempsJeuMs: 0, dateLocale: '2026-11-23' };
  const vaincu = (numero: number, shiny = false) => ({ type: 'ennemi-vaincu' as const, etape: 1, numero, niveau: 5, shiny, boss: false, rarete: 'commun' as const });
  for (let i = 0; i < 4; i++) s = noterCombat(s, vaincu(19), contexte);
  expect(s.chaine).toEqual({ numero: 19, longueur: 4 });
  s = noterCombat(s, vaincu(19, true), contexte);
  expect(s.chaine).toEqual({ numero: 0, longueur: 0 });
  expect(s.records.chaineMax).toBe(5);
});
