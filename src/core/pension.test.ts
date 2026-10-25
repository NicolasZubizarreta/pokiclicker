import { describe, expect, it, vi } from 'vitest';
import { accesPension, chancePonte, pondre, tirerOeuf } from './pension';
import { kanto } from './regions';
import { reglages } from './reglages';
import { etatMondeDe, regionInitiale, validerPokemonPossede } from './sauvegarde';
import type { PokemonPossede } from './sauvegarde-types';

const parent = (numero: number, sexe: PokemonPossede['sexe']): PokemonPossede => ({
  uid: `parent-${numero}`, numero, sexe, niveau: 50, xp: 12, bonheur: 200,
  shiny: false, favori: true, calcium: 10, pierreEternelle: true,
});
function preparer() {
  const region = regionInitiale('kanto', 'kanto.bourg-palette');
  region.bossVaincus = ['kanto.tour-pokemon'];
  region.pension.parents = [parent(26, 'male'), parent(25, 'femelle')];
  return region;
}

describe('pension', () => {
  it('évalue la condition du lieu et nomme la Tour Pokémon', () => {
    const region = preparer();
    expect(accesPension(kanto, etatMondeDe(region))).toEqual({ ouvert: true });
    region.bossVaincus = ['kanto.route-1'];
    expect(accesPension(kanto, etatMondeDe(region))).toEqual({
      ouvert: false, raison: 'Bats le boss de Tour Pokémon.',
    });
    const lieu = { ...kanto.lieu('pension'), si: { type: 'drapeau' as const, id: 'essai' } };
    expect(accesPension({ ...kanto, lieu: () => lieu }, { ...etatMondeDe(region), drapeaux: ['essai'] }))
      .toEqual({ ouvert: true });
    expect(accesPension({ ...kanto, lieu: () => ({ ...lieu, si: undefined }) }, etatMondeDe(region)))
      .toEqual({ ouvert: true });
  });

  it('crée un œuf valide sans modifier la région ni ses parents', () => {
    const region = preparer();
    const avant = structuredClone(region);
    const valeurs = [0, 0.124, 0.6];
    const alea = vi.fn(() => valeurs.shift()!);
    const genererId = vi.fn(() => 'nouvel-oeuf');
    const apres = pondre(region, alea, genererId);
    expect(region).toEqual(avant);
    expect(apres).not.toBe(region);
    expect(apres.pension.parents).toBe(region.pension.parents);
    expect(apres.pension.oeufs).toEqual([{
      uid: 'nouvel-oeuf', numero: 25, niveau: 1, xp: 0, bonheur: 0, calcium: 0,
      shiny: true, sexe: 'femelle', favori: false, pierreEternelle: false,
      oeuf: { pasRestants: 25, pasMax: 25 },
    }]);
    expect(() => validerPokemonPossede(apres.pension.oeufs[0])).not.toThrow();
    expect(alea).toHaveBeenCalledTimes(3);
    expect(genererId).toHaveBeenCalledTimes(1);
  });

  it('ne tire rien pour une paire incompatible ou incomplète', () => {
    const region = preparer();
    const alea = vi.fn(() => 0);
    const genererId = vi.fn(() => 'oeuf');
    for (const parents of [[], [parent(1, 'femelle')], [parent(1, 'femelle'), parent(4, 'male')]]) {
      region.pension.parents = parents;
      expect(chancePonte(parents)).toBe(0);
      expect(tirerOeuf(parents, alea)).toBeNull();
      expect(pondre(region, alea, genererId)).toBe(region);
    }
    expect(alea).not.toHaveBeenCalled();
    expect(genererId).not.toHaveBeenCalled();
  });

  it('respecte les seuils stricts de ponte et de shiny', () => {
    const parents = preparer().pension.parents;
    const alea = vi.fn(() => reglages.pension.chances.memeEspece);
    expect(tirerOeuf(parents, alea)).toBeNull();
    expect(alea).toHaveBeenCalledTimes(1);
    const valeurs = [0, 0.125];
    expect(tirerOeuf(parents, () => valeurs.shift()!)).toEqual({ numero: 25, shiny: false });
  });

  it.each([0, 1])('choisit la mère quel que soit son emplacement (%i)', (index) => {
    const parents = [parent(1, 'male'), parent(43, 'femelle')];
    if (index === 0) parents.reverse();
    expect(tirerOeuf(parents, () => 0)).toEqual({ numero: 43, shiny: true });
  });

  it.each([0, 1])('Métamorph prend la forme de base de l’autre parent (%i)', (index) => {
    const parents = [parent(132, 'sansSexe'), parent(82, 'sansSexe')];
    if (index === 0) parents.reverse();
    expect(tirerOeuf(parents, () => 0)).toEqual({ numero: 81, shiny: true });
  });

  it.each([0, 150 / 151])('Métamorph ×2 tire une espèce puis sa forme de base (%f)', (valeur) => {
    const valeurs = [0, valeur, 0.125];
    const alea = vi.fn(() => valeurs.shift()!);
    expect(tirerOeuf([parent(132, 'sansSexe'), parent(132, 'sansSexe')], alea))
      .toEqual({ numero: valeur === 0 ? 1 : 151, shiny: false });
    expect(alea).toHaveBeenCalledTimes(3);
  });
});
