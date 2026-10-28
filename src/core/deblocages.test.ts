import { expect, it } from 'vitest';
import { deblocages, deblocagesAtteints, nouveauxDeblocages } from './deblocages';
import { kanto } from './regions';
import { regionInitiale, validerDonneesRegion } from './sauvegarde';

const depart = () => regionInitiale('kanto', 'kanto.route-1');
const avecBoss = (...zones: string[]) => ({ ...depart(), bossVaincus: zones });

it('décrit chaque fonction avec un texte français et un déclencheur connu du monde', () => {
  expect(deblocages.map(d => d.id)).toEqual(['sac', 'pc', 'pension', 'centre-commercial', 'casino',
    'poke-radar', 'fauchage', 'auto-clic']);
  for (const deblocage of deblocages) {
    expect(deblocage.texte).toMatch(/débloqué/);
    const declencheur = deblocage.declencheur;
    if ('zone' in declencheur) expect(() => kanto.zone(declencheur.zone)).not.toThrow();
    if ('lieu' in declencheur) expect(() => kanto.lieu(declencheur.lieu)).not.toThrow();
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
