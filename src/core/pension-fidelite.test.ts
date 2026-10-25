import { describe, expect, it, vi } from 'vitest';
import fixture from '../../tests/fixtures/v1-pension.json';
import { formeDeBase } from './evolution';
import { chancePonte, pondre, tirerOeuf } from './pension';
import { regionInitiale, validerPokemonPossede } from './sauvegarde';
import type { PokemonPossede } from './sauvegarde-types';
import { sexeEspece } from './sexe';

const cheminGraine = new URL('../../scripts/lib/graine.mjs', import.meta.url).href;
const { graine } = await import(/* @vite-ignore */ cheminGraine) as {
  graine: (valeur: number) => () => number;
};
const parent = (numero: number, sexe: PokemonPossede['sexe']): PokemonPossede => ({
  uid: `parent-${numero}-${sexe}`, numero, sexe, niveau: 1, xp: 0, bonheur: 0,
  shiny: false, favori: false, calcium: 0, pierreEternelle: false,
});
const convertir = (parents: ({ id: number; gender: string } | null)[]) => parents
  .filter(p => p !== null)
  .map(p => parent(p.id, p.gender === 'genderless' ? 'sansSexe' : p.gender === 'female' ? 'femelle' : 'male'));

describe('fidélité de la ponte V1', () => {
  it('retrouve les 151 formes de base', () => {
    expect(Array.from({ length: 151 }, (_, i) => formeDeBase(i + 1))).toEqual(fixture.formesDeBase);
  });

  it('retrouve la matrice 151 × 151', () => {
    const matrice = Array.from({ length: 151 }, (_, i) =>
      Array.from({ length: 151 }, (_, j) => Math.round(chancePonte([
        parent(i + 1, 'femelle'), parent(j + 1, 'male'),
      ]) * 100)).join(''));
    expect(matrice).toEqual(fixture.compatibilite);
  });

  it.each(fixture.cas)('$nom : compatibilité spéciale', ({ parents, chance }) => {
    expect(chancePonte(convertir(parents))).toBe(chance);
  });

  it.each(fixture.ponte.paires)('$nom : mêmes œufs, appels et tirages V1', (paire) => {
    const alea = vi.fn(graine(fixture.ponte.graine));
    const parents = convertir(paire.parents);
    const oeufs = [];
    for (let appel = 1; appel <= paire.appels; appel++) {
      const oeuf = tirerOeuf(parents, alea);
      if (oeuf) oeufs.push({ appel, ...oeuf });
    }
    expect(oeufs).toEqual(paire.oeufs);
    expect(alea).toHaveBeenCalledTimes(paire.tirages);
  });

  it.each(fixture.ponte.paires)('$nom : matérialisation et tirages de sexe séparés', (paire) => {
    let region = regionInitiale('kanto', 'kanto.bourg-palette');
    region.bossVaincus = ['kanto.tour-pokemon'];
    region.pension = { parents: convertir(paire.parents), oeufs: [], emplacementsOeuf: paire.slots };
    const suivant = graine(fixture.ponte.graine);
    // Chaque naissance : les tirages V1 précèdent l'éventuel tirage du sexe.
    const nombreTirages = new Map(paire.oeufs.map(o => [o.appel, paire.nom === 'metamorphs' ? 3 : 2]));
    const genererId = vi.fn(() => `oeuf-${region.pension.oeufs.length}`);
    let tiragesV1 = 0;
    let tiragesSexe = 0;
    const oeufs = [];
    for (let appel = 1; appel <= paire.appels; appel++) {
      let tirages = 0;
      const alea = () => {
        tirages++;
        if (tirages > (nombreTirages.get(appel) ?? 1)) { tiragesSexe++; return 0.5; }
        tiragesV1++;
        return suivant();
      };
      const apres = pondre(region, alea, genererId);
      if (apres.pension.oeufs.length > region.pension.oeufs.length) {
        const oeuf = apres.pension.oeufs.at(-1)!;
        expect(() => validerPokemonPossede(oeuf)).not.toThrow();
        oeufs.push({ appel, numero: oeuf.numero, shiny: oeuf.shiny });
      }
      region = apres;
    }
    expect(oeufs).toEqual(paire.oeufs);
    expect(tiragesV1).toBe(paire.tirages);
    expect(tiragesSexe).toBe(paire.oeufs.filter(o => sexeEspece(o.numero) === 'aleatoire').length);
    expect(genererId).toHaveBeenCalledTimes(paire.oeufs.length);
  });

  it.each([fixture.ponte.plein, fixture.ponte.verrouille])('$nom : aucun œuf ni tirage', (cas) => {
    const region = regionInitiale('kanto', 'kanto.bourg-palette');
    region.pension.parents = convertir(cas.parents);
    region.pension.emplacementsOeuf = cas.slots;
    if (cas.nom === 'plein') {
      region.bossVaincus = ['kanto.tour-pokemon'];
      region.pension.oeufs = Array.from({ length: cas.slots }, () => parent(25, 'femelle'));
    }
    const alea = vi.fn(() => 0);
    const genererId = vi.fn(() => 'oeuf');
    for (let appel = 0; appel < cas.appels; appel++) expect(pondre(region, alea, genererId)).toBe(region);
    expect(alea).toHaveBeenCalledTimes(cas.tirages);
    expect(genererId).not.toHaveBeenCalled();
    expect(cas.oeufs).toEqual([]);
  });
});
