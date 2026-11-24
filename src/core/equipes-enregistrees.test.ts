import { expect, it } from 'vitest';
import { appliquerEquipeEnregistree, enregistrerEquipeCourante } from './equipes-enregistrees';
import { reglages } from './reglages';
import type { DonneesRegion, PokemonPossede } from './sauvegarde-types';
import { enregistrerEquipe, suiviVide } from './suivi';

const pokemon = (uid: string): PokemonPossede => ({ uid, numero: 25, niveau: 10, xp: 0,
  shiny: false, bonheur: 0, calcium: 0, pierreEternelle: false, favori: false, sexe: 'male' });
const oeuf = { ...pokemon('oeuf'), oeuf: { pasRestants: 10, pasMax: 10 } };
const region = (equipe = [pokemon('a')], pc = [pokemon('b')]): DonneesRegion => ({
  ...structuredClone(reglages.depart.region), regionId: 'kanto', zoneId: 'kanto.route-1', etape: 1, equipe, pc,
  badges: [], bossVaincus: [], objetsCles: [], quetes: [], drapeaux: [], evenementsJoues: [],
  argent: 0, inventaire: {}, ligueGagnee: 0,
});

it('enregistre seulement les Pokémon hors œufs et valide les emplacements', () => {
  const r = region([pokemon('a'), oeuf]);
  const resultat = enregistrerEquipeCourante(r, 2);
  expect(resultat).toMatchObject({ ok: true, region: { suivi: { equipes: [null, null, ['a']] } } });
  expect(r.suivi).toBeUndefined();
  for (const n of [-1, 3, .5, NaN]) expect(enregistrerEquipeCourante(r, n).ok).toBe(false);
  expect(enregistrerEquipeCourante(region([oeuf]), 0).ok).toBe(false);
});

it('remplace le dernier actif par un Pokémon du PC sans perte', () => {
  const r = region();
  r.suivi = enregistrerEquipe(suiviVide(), 0, ['b']);
  const resultat = appliquerEquipeEnregistree(r, 0);
  expect(resultat).toMatchObject({ ok: true, region: { equipe: [pokemon('b')], pc: [pokemon('a')] } });
  expect(r.equipe.map(p => p.uid)).toEqual(['a']);
});

it('rétablit l’ordre, garde les œufs à leur place et signale les absents', () => {
  const r = region([pokemon('a'), oeuf, pokemon('c')], [pokemon('b')]);
  r.suivi = enregistrerEquipe(suiviVide(), 0, ['c', 'absent', 'b']);
  const resultat = appliquerEquipeEnregistree(r, 0);
  expect(resultat.ok).toBe(true);
  if (!resultat.ok) return;
  expect(resultat.message).toBeTruthy();
  expect(resultat.region.equipe.map(p => p.uid)).toEqual(['c', 'oeuf', 'b']);
  expect(resultat.region.pc.map(p => p.uid)).toEqual(['a']);
  expect(resultat.region.equipe[1]).toBe(oeuf);
});

it('limite à six avec les œufs et conserve tous les Pokémon', () => {
  const r = region([pokemon('a'), oeuf], ['b', 'c', 'd', 'e', 'f', 'g'].map(pokemon));
  r.suivi = enregistrerEquipe(suiviVide(), 0, ['b', 'c', 'd', 'e', 'f', 'g']);
  const resultat = appliquerEquipeEnregistree(r, 0);
  expect(resultat.ok).toBe(true);
  if (!resultat.ok) return;
  expect(resultat.region.equipe.map(p => p.uid)).toEqual(['b', 'oeuf', 'c', 'd', 'e', 'f']);
  expect([...resultat.region.equipe, ...resultat.region.pc].map(p => p.uid).sort())
    .toEqual([...r.equipe, ...r.pc].map(p => p.uid).sort());
  expect(resultat.message).toBeTruthy();
});

it('refuse un emplacement vide, tous les absents ou un déplacement forcé des œufs', () => {
  const r = region([pokemon('a'), pokemon('c'), oeuf]);
  expect(appliquerEquipeEnregistree(r, 3).ok).toBe(false);
  expect(appliquerEquipeEnregistree(r, 0).ok).toBe(false);
  r.suivi = enregistrerEquipe(suiviVide(), 0, ['absent']);
  expect(appliquerEquipeEnregistree(r, 0).ok).toBe(false);
  r.suivi = enregistrerEquipe(suiviVide(), 0, ['b']);
  expect(appliquerEquipeEnregistree(r, 0).ok).toBe(false);
});

it('nomme dans le message les Pokémon de la Pension, compte les relâchés et dit quand la place manque', () => {
  const r = region([pokemon('a')], [pokemon('b')]);
  r.pension.parents = [{ ...pokemon('p'), numero: 1 }];
  r.suivi = enregistrerEquipe(suiviVide(), 0, ['b', 'p', 'relache']);
  const resultat = appliquerEquipeEnregistree(r, 0);
  expect(resultat.ok && resultat.message).toBe('Équipe A appliquée, mais Bulbizarre et 1 Pokémon ne sont plus disponibles.');

  const seul = region([pokemon('a')], [pokemon('b')]);
  seul.suivi = enregistrerEquipe(suiviVide(), 1, ['b', 'relache']);
  const un = appliquerEquipeEnregistree(seul, 1);
  expect(un.ok && un.message).toBe('Équipe B appliquée, mais 1 Pokémon n’est plus disponible.');

  const pleine = region([pokemon('a'), oeuf], ['b', 'c', 'd', 'e', 'f', 'g'].map(pokemon));
  pleine.suivi = enregistrerEquipe(suiviVide(), 2, ['b', 'c', 'd', 'e', 'f', 'g']);
  const limite = appliquerEquipeEnregistree(pleine, 2);
  expect(limite.ok && limite.message).toBe('Équipe C appliquée, mais Pikachu reste au PC (équipe pleine).');
});

it('ne dit rien quand tous les Pokémon de l’équipe sont présents', () => {
  const r = region([pokemon('a')], [pokemon('b')]);
  r.suivi = enregistrerEquipe(suiviVide(), 0, ['b']);
  const resultat = appliquerEquipeEnregistree(r, 0);
  expect(resultat.ok && resultat.message).toBeUndefined();
});
