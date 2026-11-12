import { expect, it } from 'vitest';
import { compteInitial, regionInitiale } from './sauvegarde';
import { chargerSucces, mesuresDe, registreSucces, succesAccordes, validerSucces } from './succes';
import type { DefinitionSucces, Mesures } from './succes';

const premiersPas: DefinitionSucces = {
  id: 'premiers-pas', nom: 'Premiers pas', description: 'Attrape ton premier Pokémon.',
  diamants: 5, mesure: 'pokedex', seuil: 1,
};
const mesures: Mesures = { pokedex: 1, badges: 0, eliminations: 0, eclosions: 0 };

it('charge les sept succès du registre réel', () => {
  expect(chargerSucces().map(succes => succes.id)).toEqual(['premiers-pas', 'premier-badge', 'collectionneur',
    'eclosions-10', 'eclosions-50', 'eclosions-100', 'eclosions-151']);
  expect(chargerSucces()).toEqual(registreSucces);
});

it.each([
  ['un doublon', [premiersPas, premiersPas]],
  ['un seuil nul', [{ ...premiersPas, seuil: 0 }]],
  ['une mesure inconnue', [{ ...premiersPas, mesure: 'argent' }]],
  ['un identifiant avec deux-points', [{ ...premiersPas, id: 'kanto:premiers-pas' }]],
  ['un identifiant vide', [{ ...premiersPas, id: ' ' }]],
  ['un nom vide', [{ ...premiersPas, nom: ' ' }]],
  ['une description vide', [{ ...premiersPas, description: '' }]],
  ['des diamants négatifs', [{ ...premiersPas, diamants: -1 }]],
  ['des diamants fractionnaires', [{ ...premiersPas, diamants: 1.5 }]],
  ['un seuil fractionnaire', [{ ...premiersPas, seuil: 1.5 }]],
])('rejette %s', (_nom, liste) => {
  expect(() => validerSucces(liste)).toThrow(Error);
});

it('accorde et crédite une fois sans modifier les arguments, puis reste idempotent', () => {
  const compte = { ...compteInitial(), diamants: 7, skins: ['bleu'], preferences: { sonActive: false } };
  const registre = [structuredClone(premiersPas)];
  const avant = structuredClone({ compte, registre, mesures });
  const resultat = succesAccordes(registre, compte, mesures);
  expect(resultat.nouveaux).toEqual([premiersPas]);
  expect(resultat.compte).toEqual({ ...compte, diamants: 12, succes: ['premiers-pas'] });
  expect({ compte, registre, mesures }).toEqual(avant);
  const second = succesAccordes(registre, resultat.compte, mesures);
  expect(second.nouveaux).toEqual([]);
  expect(second.compte).toBe(resultat.compte);
});

it('accorde deux succès à la fois et additionne leurs diamants', () => {
  const resultat = succesAccordes(registreSucces, compteInitial(), { ...mesures, badges: 1 });
  expect(resultat.nouveaux.map(succes => succes.id)).toEqual(['premiers-pas', 'premier-badge']);
  expect(resultat.compte.diamants).toBe(10);
});

it('rend le même compte quand aucun seuil n’est atteint', () => {
  const compte = compteInitial();
  expect(succesAccordes(registreSucces, compte, { pokedex: 0, badges: 0, eliminations: 0, eclosions: 0 }))
    .toEqual({ compte, nouveaux: [] });
  expect(succesAccordes(registreSucces, compte, { pokedex: 0, badges: 0, eliminations: 0, eclosions: 0 }).compte).toBe(compte);
});

it('ne touche pas un compte ayant déjà le succès même avec des mesures supérieures', () => {
  const compte = { ...compteInitial(), diamants: 5, succes: ['premiers-pas'] };
  const resultat = succesAccordes([premiersPas], compte, { ...mesures, pokedex: 100 });
  expect(resultat.compte).toBe(compte);
  expect(resultat.nouveaux).toEqual([]);
});

it('conserve les identifiants absents du registre', () => {
  const compte = { ...compteInitial(), succes: ['ancien-succes'] };
  expect(succesAccordes([premiersPas], compte, mesures).compte.succes).toEqual(['ancien-succes', 'premiers-pas']);
});

it('lit les compteurs existants sans modifier la région ni le Pokédex', () => {
  const region = { ...regionInitiale('kanto', 'kanto.route-1'), badges: ['roche'],
    statistiques: { eliminations: 42, argentTotalGagne: 100 } };
  const pokedex = [1, 4, 7];
  const avant = structuredClone({ region, pokedex });
  expect(mesuresDe(region, pokedex)).toEqual({ pokedex: 3, badges: 1, eliminations: 42, eclosions: 0 });
  expect({ region, pokedex }).toEqual(avant);
});

it('ne crédite qu’une fois avec les compteurs de deux parties différentes', () => {
  const premiere = regionInitiale('kanto', 'kanto.route-1');
  const seconde = regionInitiale('kanto', 'kanto.bourg-palette');
  const resultat = succesAccordes([premiersPas], compteInitial(), mesuresDe(premiere, [1]));
  const suivant = succesAccordes([premiersPas], resultat.compte, mesuresDe(seconde, [4, 7]));
  expect(suivant.compte).toBe(resultat.compte);
  expect(suivant.compte.diamants).toBe(5);
  expect(suivant.nouveaux).toEqual([]);
});

it('accorde un succès ajouté aux données du registre sans changer le code', () => {
  const ajout: DefinitionSucces = { ...premiersPas, id: 'combattant', mesure: 'eliminations', seuil: 10, diamants: 8 };
  const compte = { ...compteInitial(), succes: ['premiers-pas'] };
  const resultat = succesAccordes([premiersPas, ajout], compte, { ...mesures, eliminations: 10 });
  expect(resultat.nouveaux).toEqual([ajout]);
  expect(resultat.compte.diamants).toBe(8);
});
