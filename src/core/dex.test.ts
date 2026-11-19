import { expect, it } from 'vitest';
import { especesShiny, especesEclosesShiny, noterObtention } from './dex';
import { regionInitiale, validerDonneesRegion } from './sauvegarde';
import { choisirStarter, creerStarter } from './starter';
import { utiliserJetonShiny } from './objets-equipe';

it('inscrit le jeton shiny sur un éclos et le refuse sur un œuf', () => {
  const pokemon = { ...creerStarter(4, false, () => 0, () => 's'), marqueEclosion: true };
  const region = { ...regionInitiale('kanto', 'kanto.route-1'), equipe: [pokemon], inventaire: { shinyToken: 1 } };
  const resultat = utiliserJetonShiny(region, 's');
  expect(resultat.ok).toBe(true);
  if (resultat.ok) {
    expect(resultat.region.especesShiny).toEqual([4]);
    expect(resultat.region.especesEclosesShiny).toEqual([4]);
  }
  const oeuf = utiliserJetonShiny({ ...region, equipe: [{ ...pokemon, oeuf: { pasRestants: 1, pasMax: 50 } }] }, 's');
  expect(oeuf.ok).toBe(false);
});

it('inscrit les collections dans leur ordre, sans doublon ni mutation', () => {
  const region = regionInitiale('kanto', 'kanto.route-1');
  expect(especesShiny(region)).toEqual([]);
  expect(especesEclosesShiny(region)).toEqual([]);
  expect(noterObtention(region, 1, {})).toBe(region);
  const shiny = noterObtention(region, 4, { shiny: true });
  expect(shiny.especesShiny).toEqual([4]);
  expect(shiny.especesEcloses).toBeUndefined();
  const eclos = noterObtention(shiny, 1, { shiny: true, eclos: true });
  expect(eclos.especesShiny).toEqual([4, 1]);
  expect(eclos.especesEcloses).toEqual([1]);
  expect(eclos.especesEclosesShiny).toEqual([1]);
  expect(noterObtention(eclos, 1, { shiny: true, eclos: true })).toBe(eclos);
  expect(noterObtention(region, 7, { eclos: true }).especesShiny).toBeUndefined();
  expect(region.especesShiny).toBeUndefined();
});

it('inscrit le starter shiny', () => {
  const region = regionInitiale('kanto', 'kanto.route-1');
  expect(choisirStarter(region, creerStarter(4, true, () => 0, () => 'starter')).especesShiny).toEqual([4]);
});

it.each(['especesShiny', 'especesEclosesShiny'])('valide %s', champ => {
  const region = regionInitiale('kanto', 'kanto.route-1');
  expect(() => validerDonneesRegion({ ...region, [champ]: [1, 151] })).not.toThrow();
  for (const liste of [[1, 1], [152], [0], [1.5]]) {
    expect(() => validerDonneesRegion({ ...region, [champ]: liste })).toThrow();
  }
});
