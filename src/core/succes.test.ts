import { expect, it } from 'vitest';
import { compteInitial, regionInitiale } from './sauvegarde';
import { chargerSucces, MESURES_SUCCES, mesuresDe, mesuresVides, registreSucces, succesAccordes, validerSucces } from './succes';
import { suiviVide } from './suivi';
import type { DefinitionSucces, Mesures } from './succes';

const premiersPas: DefinitionSucces = {
  id: 'premiers-pas', nom: 'Premiers pas', description: 'Attrape ton premier Pokémon.',
  diamants: 5, mesure: 'pokedex', seuil: 1,
};
const mesures: Mesures = { ...mesuresVides(), pokedex: 1 };

it('charge les succès du registre réel : les sept d’origine, puis les nouveaux', () => {
  const ids = chargerSucces().map(succes => succes.id);
  expect(ids.slice(0, 7)).toEqual(['premiers-pas', 'premier-badge', 'collectionneur',
    'eclosions-10', 'eclosions-50', 'eclosions-100', 'eclosions-151']);
  expect(ids.length - 7).toBeGreaterThanOrEqual(10);
  expect(ids.length - 7).toBeLessThanOrEqual(30);
  expect(chargerSucces()).toEqual(registreSucces);
});

it('chaque mesure des nouveaux succès est lue dans la partie', () => {
  const region = { ...regionInitiale('kanto', 'kanto.route-1'), badges: ['roche', 'cascade'], bossVaincus: ['a', 'b', 'c'],
    statistiques: { eliminations: 5, argentTotalGagne: 250000 }, equipe: [], pc: [] };
  const suivi = { ...suiviVide(), captures: 12, capturesShiny: 2, evolutions: 3, serieVictoires: 9,
    jetons: { gagnes: 40, perdus: 0, mises: 0 }, hall: [{ date: '2026-01-01T00:00:00.000Z', tempsJeuMs: 1, equipe: [] }],
    records: { ...suiviVide().records, serieVictoiresMax: 33 }, casino: { machine: { parties: 4, meilleurGain: 0, meilleureSerie: 0, serieActuelle: 0 },
      roulette: { parties: 6, meilleurGain: 0, meilleureSerie: 0, serieActuelle: 0 } } };
  const mesuresLues = mesuresDe({ ...region, suivi }, [1, 2]);
  expect(mesuresLues).toMatchObject({ captures: 12, capturesShiny: 2, evolutions: 3, zonesFinies: 3, argentTotal: 250000,
    jetonsGagnes: 40, victoiresLigue: 1, serieVictoires: 33, casinoParties: 10, niveauMax: 0, lignees: 0 });
  expect(Object.keys(mesuresLues).sort()).toEqual([...MESURES_SUCCES].sort());
});

it('toutes les mesures du registre existent et les seuils d’une même mesure sont distincts', () => {
  for (const mesure of MESURES_SUCCES) {
    const seuils = registreSucces.filter(s => s.mesure === mesure).map(s => s.seuil);
    expect(new Set(seuils).size).toBe(seuils.length);
  }
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
  expect(succesAccordes(registreSucces, compte, mesuresVides()))
    .toEqual({ compte, nouveaux: [] });
  expect(succesAccordes(registreSucces, compte, mesuresVides()).compte).toBe(compte);
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
  expect(mesuresDe(region, pokedex)).toMatchObject({ pokedex: 3, badges: 1, eliminations: 42, eclosions: 0, argentTotal: 100 });
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
