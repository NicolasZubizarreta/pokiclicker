import { describe, expect, it } from 'vitest';
import { regionInitiale, validerDonneesRegion } from '../../core/sauvegarde';
import type { PokemonPossede } from '../../core/sauvegarde-types';
import { reglages } from '../../core/reglages';
import { DRAPEAU_DARAN, VALEUR_ANNIVERSAIRE, nettoyerRegionDaran } from './nettoyage';

describe('nettoyage anniversaire de Daran', () => {
  it('nettoie tous les emplacements une seule fois sans modifier l’entrée ni les possessions conservées', () => {
    const absurde = 9007199254740991;
    const pokemon: PokemonPossede = {
      uid: 'daran-equipe', numero: 1, niveau: absurde, xp: 42,
      shiny: true, bonheur: absurde, pierreEternelle: true, calcium: absurde,
      surnom: 'Daran', sexe: 'male', favori: true, marqueEclosion: true,
    };
    const normal: PokemonPossede = {
      ...pokemon, uid: 'daran-normal', niveau: 50, xp: 12, calcium: 3, bonheur: 100,
    };
    const region = {
      ...regionInitiale('kanto', 'kanto.route-1'),
      argent: absurde, jetons: absurde,
      inventaire: { pokeball: absurde, calcium: absurde, 'pierre-stase': absurde, vide: 0 },
      ameliorations: ['chaussures-sport', 'multi-exp', 'bicyclette', 'restes', 'ct'],
      objetsCles: ['carte'], badges: ['roche'], drapeaux: ['existant'],
      especesShiny: [1], especesEcloses: [1],
      equipe: [pokemon, normal], pc: [{ ...pokemon, uid: 'daran-pc' }],
      pension: {
        parents: [{ ...pokemon, uid: 'daran-parent' }],
        oeufs: [{ ...pokemon, uid: 'daran-oeuf', oeuf: { pasRestants: 10, pasMax: 20 } }],
        emplacementsOeuf: 1,
      },
    };
    const avant = structuredClone(region);
    const resultat = nettoyerRegionDaran(region);
    expect(resultat).not.toBeNull();
    if (!resultat) throw new Error('Nettoyage attendu');
    const { region: nettoyee, resume } = resultat;
    expect(resume).toEqual({
      argent: absurde, jetons: absurde, objetsRamenes: 4,
      pokemonNiveauRamene: 4, pokemonCalciumRamene: 4, pokemonBonheurRamene: 4,
    });
    expect(nettoyee.argent).toBe(VALEUR_ANNIVERSAIRE);
    expect(nettoyee.jetons).toBe(VALEUR_ANNIVERSAIRE);
    expect(nettoyee.inventaire).toEqual({ pokeball: 22, calcium: 22, 'pierre-stase': 22, vide: 22 });
    const tous = [nettoyee.equipe[0], ...nettoyee.pc, ...nettoyee.pension.parents, ...nettoyee.pension.oeufs];
    for (const p of tous) {
      const original = [...region.equipe, ...region.pc, ...region.pension.parents, ...region.pension.oeufs].find(source => source.uid === p.uid)!;
      expect(p).toEqual({ ...original, niveau: reglages.recompenses.niveauMax, xp: 0,
        calcium: reglages.degats.calciumMax, bonheur: reglages.recompenses.bonheur.max });
    }
    expect(nettoyee.equipe[1]).toBe(normal);
    for (const cle of Object.keys(region) as (keyof typeof region)[]) {
      if (['argent', 'jetons', 'inventaire', 'equipe', 'pc', 'pension', 'drapeaux'].includes(cle)) continue;
      expect(nettoyee[cle]).toBe(region[cle]);
    }
    expect(nettoyee.drapeaux).toEqual(['existant', DRAPEAU_DARAN]);
    expect(region).toEqual(avant);
    expect(nettoyerRegionDaran(nettoyee)).toBeNull();
    expect(() => validerDonneesRegion(nettoyee)).not.toThrow();
  });

  it('ne compte aucun Pokémon pour une région déjà à 22', () => {
    const region = regionInitiale('kanto', 'kanto.route-1');
    region.argent = 22;
    region.jetons = 22;
    region.inventaire = { pokeball: 22 };
    expect(nettoyerRegionDaran(region)?.resume).toEqual({ argent: 22, jetons: 22,
      objetsRamenes: 1, pokemonNiveauRamene: 0, pokemonCalciumRamene: 0, pokemonBonheurRamene: 0 });
  });
});
