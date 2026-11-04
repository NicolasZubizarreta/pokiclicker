import { expect, it } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { creerGestionnaire, creerStockageMemoire } from '../core/sauvegarde';
import { ouvrirPartie } from './persistance';

function ouvrir(stockage = creerStockageMemoire()) {
  const options = { stockage, horloge: creerHorlogeSimulee(), genererId: () => 'test' };
  return { stockage, p: ouvrirPartie(options, { equipe: [], drapeaux: [] }), g: creerGestionnaire(options) };
}
const temps = (g: ReturnType<typeof ouvrir>['g']) => g.chargerPartie('test')!.donnees.statistiques.tempsJeuMs;

it('garde le temps de jeu avec chaque vraie écriture et le reprend à la réouverture', () => {
  const premiere = ouvrir();
  expect(temps(premiere.g)).toBeUndefined();
  premiere.p.enregistrer({ ...premiere.p.region, argent: premiere.p.region.argent + 1 }, [], 5_432.9);
  expect(temps(premiere.g)).toBe(5_432);
  const seconde = ouvrir(premiere.stockage);
  seconde.p.enregistrer({ ...seconde.p.region, argent: seconde.p.region.argent + 1 }, [], 2_000);
  expect(temps(seconde.g)).toBe(7_432);
});

it("n'écrit rien quand seul le temps a changé", () => {
  const { p, g } = ouvrir();
  const region = { ...p.region, argent: p.region.argent + 1 };
  p.enregistrer(region, [], 1_000);
  const revision = g.chargerPartie('test')!.revision;
  p.enregistrer(region, [], 9_000);
  expect(g.chargerPartie('test')!.revision).toBe(revision);
  expect(temps(g)).toBe(1_000);
});
