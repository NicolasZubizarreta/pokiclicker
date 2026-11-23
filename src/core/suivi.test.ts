import { expect, it } from 'vitest';
import type { EvenementCombat } from './combat';
import { definirTitre, enregistrerEquipe, enregistrerVictoireLigue, lireSuivi, noterCadence, noterCombat,
  noterDepense, noterDps, noterEclosions, noterEvolution, noterMannequin, noterPartieCasino, noterRecordClic, suiviVide } from './suivi';
import { validerDonneesRegion } from './sauvegarde-validation';
import { regionInitiale } from './sauvegarde';
import { kanto } from './regions';

const capture = (shiny = false, boss = false): EvenementCombat => ({ type: 'capture-reussie', numero: 25, niveau: 5, shiny, boss, rarete: null });
const victoire: EvenementCombat = { type: 'ennemi-vaincu', numero: 25, niveau: 5, shiny: false, boss: false, rarete: null, etape: 1 };
const ctx = { tempsJeuMs: 0, dateLocale: '2026-11-23' };

it('lit un suivi absent ou partiel et fournit des valeurs vides indépendantes', () => {
  expect(lireSuivi({})).toEqual(suiviVide());
  expect(lireSuivi({ suivi: { captures: 3, records: { dpsMax: 2 } } as ReturnType<typeof suiviVide> }))
    .toMatchObject({ captures: 3, records: { dpsMax: 2, degatsClicMax: 0 }, equipes: [null, null, null] });
  const s = suiviVide();
  s.equipes[0] = ['a'];
  expect(suiviVide().equipes).toEqual([null, null, null]);
});

it('compte rencontres, chromatiques, série et boss sans modifier l’état reçu', () => {
  const vide = suiviVide();
  let s = noterCombat(vide, capture(), ctx);
  s = noterCombat(s, victoire, ctx);
  expect(s.rencontres['25']).toEqual({ vus: 2, captures: 1, depuisShiny: 2 });
  s = noterCombat(s, capture(true), ctx);
  expect(s.rencontres['25']).toEqual({ vus: 3, captures: 2, depuisShiny: 0 });
  s = noterCombat(s, capture(false, true), ctx);
  expect(s.rencontres['25']?.vus).toBe(3);
  s = noterCombat(s, { ...victoire, boss: true }, ctx);
  s = noterCombat(s, { type: 'boss-vaincu', zoneId: 'x' }, { ...ctx, tempsBossMs: 200 });
  s = noterCombat(s, { type: 'boss-vaincu', zoneId: 'x' }, { ...ctx, tempsBossMs: 300 });
  expect(s).toMatchObject({ captures: 3, capturesShiny: 1, bossVaincus: 2, serieVictoires: 5,
    records: { tempsBossMinMs: 200, serieVictoiresMax: 5 } });
  s = noterCombat(s, { type: 'boss-echoue', zoneId: 'x' }, ctx);
  expect(s.serieVictoires).toBe(0);
  expect(s.records.serieVictoiresMax).toBe(5);
  expect(vide).toEqual(suiviVide());
});

it('ouvre deux fenêtres de captures et garde le meilleur total', () => {
  let s = noterCombat(suiviVide(), capture(), ctx);
  s = noterCombat(s, capture(), { ...ctx, tempsJeuMs: 3_599_999 });
  expect(s.records.capturesHeureMax).toBe(2);
  s = noterCombat(s, capture(), { ...ctx, tempsJeuMs: 3_600_000 });
  expect(s.fenetreCaptures).toEqual({ debutMs: 3_600_000, n: 1 });
  expect(s.records.capturesHeureMax).toBe(2);
});

it('cumule l’or et garde les sept jours les plus récents', () => {
  let s = suiviVide();
  for (let jour = 9; jour >= 1; jour--) s = noterCombat(s, victoire, { ...ctx, dateLocale: `2026-11-0${jour}`, or: 5 });
  s = noterCombat(s, victoire, { ...ctx, dateLocale: '2026-11-09', or: 2 });
  expect(Object.keys(s.argentJours)).toEqual(Array.from({ length: 7 }, (_, i) => `2026-11-0${i + 3}`));
  expect(s.argentJours['2026-11-09']).toBe(7);
});

it('suit le gain net, les pertes et les séries du casino', () => {
  const vide = suiviVide();
  let s = noterPartieCasino(vide, 'machine', { mise: 10, gain: 30 });
  s = noterPartieCasino(s, 'machine', { mise: 10, gain: 20 });
  s = noterPartieCasino(s, 'machine', { mise: 10, gain: 10 });
  s = noterPartieCasino(s, 'machine', { mise: 10, gain: 0 });
  expect(s.jetons).toEqual({ gagnes: 30, perdus: 10 });
  expect(s.casino.machine).toEqual({ parties: 4, meilleurGain: 20, meilleureSerie: 2, serieActuelle: 0 });
  expect(vide).toEqual(suiviVide());
});

it('borne les équipes, copie le Hall et conserve les cinquante dernières victoires', () => {
  const vide = suiviVide();
  let s = enregistrerEquipe(vide, 1, ['a', 'a', 'b', 'c', 'd', 'e', 'f', 'g']);
  expect(s.equipes).toEqual([null, ['a', 'b', 'c', 'd', 'e', 'f'], null]);
  expect(enregistrerEquipe(s, 1, null).equipes).toEqual([null, null, null]);
  for (let n = 0; n < 51; n++) s = enregistrerVictoireLigue(s, { date: '2026-11-23T00:00:00.000Z', tempsJeuMs: n,
    equipe: [{ numero: 25, niveau: 5, shiny: false }] });
  expect(s.hall).toHaveLength(50);
  expect(s.hall[0]?.tempsJeuMs).toBe(50);
  expect(s.hall[49]?.tempsJeuMs).toBe(1);
  expect(vide).toEqual(suiviVide());
});

it('note les compteurs et records sans réduire un record ni accepter une dépense négative', () => {
  let s = noterEclosions(noterEvolution(suiviVide()), 3);
  s = noterDepense(noterDepense(s, 'centre', 10), 'centre', -5);
  s = noterDps(noterDps(s, 12.36), 1);
  s = noterCadence(noterMannequin(noterRecordClic(s, 20), 45), 5);
  expect(s).toMatchObject({ evolutions: 1, oeufsEclos: 3, depenses: { centre: 10 },
    records: { dpsMax: 12.4, degatsClicMax: 20, mannequinDpsMax: 45, cadenceMax: 5 } });
  expect(definirTitre(definirTitre(s, 'a'.repeat(50)), undefined).titre).toBeUndefined();
  expect(definirTitre(s, 'a'.repeat(50)).titre).toHaveLength(40);
});

it('répare un suivi abîmé sans refuser la région', () => {
  const region = { ...regionInitiale('kanto', kanto.depart), suivi: { ...suiviVide(), captures: -5,
    oeufsEclos: 1e20, inconnue: 1, rencontres: { '25': { vus: -1 }, '0': {}, abc: {}, '9999': {} },
    casino: { inconnu: {}, roulette: { parties: -1 } }, depenses: { boutique: -1, inconnu: 3 },
    equipes: [['a', 'b', 'c', 'd', 'e', 'f', 'g', 'a', 'a:b'], [], null, ['extra']],
    argentJours: Object.fromEntries([...Array.from({ length: 9 }, (_, i) => [`2026-11-0${i + 1}`, -1]), ['hier', 4]]),
    titre: 'a'.repeat(41) } };
  expect(() => validerDonneesRegion(region)).not.toThrow();
  expect(region.suivi).toMatchObject({ captures: 0, oeufsEclos: Number.MAX_SAFE_INTEGER,
    rencontres: { '25': { vus: 0, captures: 0, depuisShiny: 0 } }, depenses: { boutique: 0 } });
  expect(Object.keys(region.suivi.rencontres)).toEqual(['25']);
  expect(Object.keys(region.suivi.casino)).toEqual(['roulette']);
  expect(Object.keys(region.suivi.argentJours)).toHaveLength(7);
  expect(region.suivi.equipes).toEqual([['a', 'b', 'c', 'd', 'e', 'f'], null, null]);
  expect(region.suivi).not.toHaveProperty('inconnue');
  expect(region.suivi).not.toHaveProperty('titre');
});
