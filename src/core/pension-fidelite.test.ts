import { describe, expect, it, vi } from 'vitest';
import fixture from '../../tests/fixtures/v1-pension.json';
import { formeDeBase } from './evolution';
import { chancePonte, pondre, tirerOeuf } from './pension';
import { regionInitiale, validerPokemonPossede } from './sauvegarde';
import type { PokemonPossede } from './sauvegarde-types';
import { sexeEspece } from './sexe';
import { acheterEmplacementOeuf, deposerParent, prendreOeuf, prixEmplacementOeuf, retirerParent } from './pension';
import { appliquerVictoire } from './recompenses';

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

describe('fidélité des mouvements et éclosions V1', () => {
  it.each(fixture.emplacements)('emplacements $avant, argent $argent', (cas) => {
    const region = regionInitiale('kanto', 'kanto.bourg-palette');
    region.argent = cas.argent;
    region.pension.emplacementsOeuf = cas.avant;
    const avant = structuredClone(region);
    expect(prixEmplacementOeuf(region)).toBe(cas.avant === 5 ? null : cas.avant * 5000);
    const resultat = acheterEmplacementOeuf(region);
    expect(resultat.ok).toBe(cas.apres > cas.avant);
    if (resultat.ok) {
      expect(resultat.region.pension.emplacementsOeuf).toBe(cas.apres);
      expect(region.argent - resultat.region.argent).toBe(cas.cout);
    }
    expect(region).toEqual(avant);
  });

  it.each(fixture.retraitOeuf)('retrait œuf, équipe $tailleEquipe', (cas) => {
    const region = regionInitiale('kanto', 'kanto.bourg-palette');
    region.equipe = Array.from({ length: cas.tailleEquipe }, (_, i) => ({ ...parent(1, 'male'), uid: `p-${i}` }));
    const oeuf = { ...parent(cas.oeuf.id, 'male'), uid: 'oeuf', shiny: cas.oeuf.isShiny,
      oeuf: { pasRestants: cas.oeuf.maxSteps - cas.oeuf.hatchSteps, pasMax: cas.oeuf.maxSteps } };
    region.pension.oeufs = [oeuf];
    const avant = structuredClone(region);
    const resultat = prendreOeuf(region, oeuf.uid);
    expect(resultat).toMatchObject({ ok: true, destination: cas.destination, numero: cas.appelsPokedex[0] });
    if (!resultat.ok) throw new Error(resultat.raison);
    expect(resultat.region[resultat.destination].at(-1)).toEqual(oeuf);
    expect(resultat.region.pension.oeufs).toEqual(cas.oeufsRestants);
    expect(region).toEqual(avant);
  });

  it.each(fixture.parents.retraits)('retrait parent, équipe $tailleEquipe', (cas) => {
    const region = regionInitiale('kanto', 'kanto.bourg-palette');
    region.equipe = Array.from({ length: cas.tailleEquipe }, (_, i) => ({ ...parent(1, 'male'), uid: `p-${i}` }));
    const pokemon = parent(25, 'femelle');
    region.pc = [pokemon];
    const depot = deposerParent(region, pokemon.uid);
    expect(depot.ok).toBe(true);
    if (!depot.ok) throw new Error(depot.raison);
    expect(depot.region.pc).toEqual(fixture.parents.depuisPC.pc);
    const avant = structuredClone(depot.region);
    const resultat = retirerParent(depot.region, pokemon.uid);
    expect(resultat).toMatchObject({ ok: true, destination: cas.destination, numero: 25 });
    if (!resultat.ok) throw new Error(resultat.raison);
    expect(resultat.region[resultat.destination].at(-1)).toEqual(pokemon);
    expect(resultat.region.pension.parents).toEqual([]);
    expect(depot.region).toEqual(avant);
  });

  it('retrouve les 25 étapes de bonheur et éclosion, PC immobile', () => {
    let region = regionInitiale('kanto', 'kanto.bourg-palette');
    const oeuf = { ...parent(25, 'femelle'), shiny: true, oeuf: { pasRestants: 25, pasMax: 25 } };
    region.equipe = [oeuf];
    region.pc = [{ ...oeuf, uid: 'pc' }];
    for (const etape of fixture.eclosion.etapes) {
      const avant = structuredClone(region);
      const resultat = appliquerVictoire(region, { numero: 1, niveau: 1, shiny: false, boss: false, rarete: null });
      expect(region).toEqual(avant);
      region = resultat.region;
      for (const [pokemon, reference] of [[region.equipe[0]!, etape.equipe], [region.pc[0]!, etape.pc]] as const) {
        expect(pokemon).toMatchObject({ numero: reference.id, niveau: reference.level, xp: reference.xp,
          bonheur: reference.happiness, shiny: reference.isShiny });
        expect(pokemon.oeuf !== undefined).toBe(reference.isEgg);
        if (reference.isEgg) expect(pokemon.oeuf?.pasRestants).toBe(reference.maxSteps - reference.hatchSteps);
      }
      expect(resultat.eclosions.map(p => p.numero)).toEqual(etape.victoire === 25 ? fixture.eclosion.appelsPokedex : []);
    }
  });
});

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
