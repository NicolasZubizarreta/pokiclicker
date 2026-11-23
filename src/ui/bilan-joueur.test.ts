import { expect, it } from 'vitest';
import { suiviVide } from '../core/suivi';
import { bilanJoueur } from './bilan-joueur';

it('compte les espèces du Pokédex et privilégie la collection chromatique', () => {
  const partie = { suivi: { ...suiviVide(), capturesShiny: 5 }, tempsJeuMs: 60_000,
    pokedex: [1, 1, 2], badges: { obtenus: 2, total: 8 } };
  expect(bilanJoueur(partie).map(l => l.valeur)).toEqual(['1 min', '2 sur 151', '5', '2 sur 8']);
  expect(bilanJoueur({ ...partie, especesShiny: [] })[2]?.valeur).toBe('0');
});
