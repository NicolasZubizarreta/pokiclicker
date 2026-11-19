import { expect, it } from 'vitest';
import { estDoublonCapture, capturerDoublon, doublonsEclos, retirerDeLEquipe } from './relache-auto';
import { reglages } from './reglages';
import { calculerOr } from './recompenses';
import type { DonneesRegion, PokemonPossede } from './sauvegarde-types';

const pokemon = (uid: string): PokemonPossede => ({ uid, numero: 1, niveau: 1, xp: 0, shiny: false,
  bonheur: 0, pierreEternelle: false, calcium: 0, sexe: 'male', favori: false });
const region = { ...structuredClone(reglages.depart.region), regionId: 'kanto', zoneId: 'kanto.route-1',
  equipe: [pokemon('a'), pokemon('b')], argent: 10 } as DonneesRegion;
it('garde le dernier actif même si un œuf reste dans l’équipe', () => {
  const entree = { ...region, equipe: [pokemon('a'), { ...pokemon('oeuf'), oeuf: { pasRestants: 2, pasMax: 2 } }] };
  expect(retirerDeLEquipe(entree, ['a']).equipe).toEqual(entree.equipe);
});
it('reconnaît une capture déjà au Pokédex non shiny', () => expect(estDoublonCapture([1], 1, false)).toBe(true));
it('garde une capture nouvelle', () => expect(estDoublonCapture([], 1, false)).toBe(false));
it('garde une capture shiny', () => expect(estDoublonCapture([1], 1, true)).toBe(false));
it('verse seulement l’or de capture avec les bonus sans objet à rendre', () => {
  const prise = { numero: 1, niveau: 5, shiny: false, boss: false, rarete: 'commun' as const };
  const avant = structuredClone(region);
  expect(capturerDoublon(region, prise, [])).toEqual({ ...region,
    argent: region.argent + calculerOr(prise, []) * reglages.recompenses.or.capture });
  expect(region).toEqual(avant);
  expect(region.equipe.every(p => !('objet' in p))).toBe(true);
});
it('retire les mêmes uid sans toucher aux autres données', () => {
  expect(retirerDeLEquipe(region, ['a'])).toEqual({ ...region, equipe: [region.equipe[1]] });
  expect(region.equipe).toHaveLength(2);
});
it('ne retire jamais le dernier membre de l’équipe', () => {
  expect(retirerDeLEquipe(region, ['a', 'b']).equipe).toEqual([region.equipe[1]]);
});
it('relâche une éclosion déjà dans le dex œuf', () => expect(doublonsEclos([1], [{ uid: 'a', numero: 1, shiny: false }])).toEqual(['a']));
it('garde une espèce nouvelle au dex œuf', () => expect(doublonsEclos([], [{ uid: 'a', numero: 1, shiny: false }])).toEqual([]));
it('garde le premier œuf nouveau et relâche le second de même espèce', () => expect(doublonsEclos([], [
  { uid: 'a', numero: 1, shiny: false }, { uid: 'b', numero: 1, shiny: false },
])).toEqual(['b']));
it('garde le shiny et compte son espèce pour les éclosions suivantes', () => expect(doublonsEclos([], [
  { uid: 'a', numero: 1, shiny: true }, { uid: 'b', numero: 1, shiny: false },
])).toEqual(['b']));
it('garde un éclos shiny déjà connu', () => expect(doublonsEclos([1], [{ uid: 'a', numero: 1, shiny: true }])).toEqual([]));
