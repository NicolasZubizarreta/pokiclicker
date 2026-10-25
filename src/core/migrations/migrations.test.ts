import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import v0 from './__fixtures__/partie-v0.json';
import v1 from './__fixtures__/partie-v1.json';
import v2 from './__fixtures__/partie-v2.json';
import regionV1 from './__fixtures__/region-v1.json';
import regionV2 from './__fixtures__/region-v2.json';
import compteV1 from './__fixtures__/compte-v1.json';
import compteV2 from './__fixtures__/compte-v2.json';
import { migrer, migrerV1versV2, migrerV2versV3, migrationsParDefaut } from './index';
import { VERSION_ACTUELLE } from '../sauvegarde-types';
import { regionInitiale } from '../sauvegarde';
import type { Enveloppe } from '../sauvegarde-types';
import { validerEnveloppe, validerPokemonPossede } from '../sauvegarde-validation';
import { reglages } from '../reglages';

describe('marche 2 → 3', () => {
  it.each(['equipe', 'pc', 'pension.parents', 'pension.oeufs', 'pcGlobal'] as const)(
    'corrige les sexes fixes dans %s et conserve le sexe aléatoire sans mutation', liste => {
      const pokemons = [
        { ...v2.donnees.pcGlobal[0], uid: 'voltorbe', numero: 100, sexe: 'male' },
        { ...v2.donnees.pcGlobal[0], uid: 'nidoran-f', numero: 29, sexe: 'male' },
        { ...v2.donnees.pcGlobal[0], uid: 'nidoran-m', numero: 32, sexe: 'femelle' },
        { ...v2.donnees.pcGlobal[0], uid: 'pikachu', numero: 25, sexe: 'femelle' },
      ].map(p => ({ ...p, oeuf: { pasRestants: 1, pasMax: 2 } }));
      const cle = liste === 'pension.parents' ? 'parents' : 'oeufs';
      const source = liste === 'pcGlobal'
        ? { ...v2, donnees: { ...v2.donnees, pcGlobal: pokemons } }
        : { ...regionV2, donnees: { ...regionV2.donnees,
          ...(liste.startsWith('pension.')
            ? { pension: { ...regionV2.donnees.pension, [cle]: pokemons } }
            : { [liste]: pokemons }) } };
      const avant = structuredClone(source);
      const resultat = migrer(source as Enveloppe<unknown>);
      const donnees = resultat.donnees as Record<string, unknown>;
      const obtenu = (liste.startsWith('pension.')
        ? (donnees.pension as Record<string, unknown>)[cle]
        : donnees[liste]) as typeof pokemons;
      expect(resultat.version).toBe(3);
      expect(obtenu).toEqual(pokemons.map((p, i) => ({ ...p,
        sexe: ['sansSexe', 'femelle', 'male', 'femelle'][i] })));
      obtenu.forEach(p => expect(() => validerPokemonPossede(p)).not.toThrow());
      expect(source).toEqual(avant);
      expect(migrer(resultat)).toEqual(resultat);
    },
  );
  it('enchaîne la correction après la migration v1', () => {
    const source = { ...regionV1, donnees: { ...regionInitiale('kanto', 'kanto.route-1'),
      equipe: [{ uid: 'b', numero: 100, niveau: 1, xp: 0, shiny: false,
        bonheur: 0, pierreEternelle: false, calcium: 0 }] } };
    expect(validerEnveloppe(source, 'region')).toMatchObject({ version: 3,
      donnees: { equipe: [{ numero: 100, sexe: 'sansSexe' }] } });
  });
});

describe('validation du sexe et du surnom', () => {
  const pokemon = { ...v2.donnees.pcGlobal[0], numero: 25, sexe: 'male' };
  it('déclare les réglages d’équipe', () => {
    expect(reglages.equipe).toEqual({ taille: 6, surnomMax: 12 });
  });
  it.each([
    [100, 'male'], [100, 'femelle'], [29, 'male'], [29, 'sansSexe'],
    [32, 'femelle'], [32, 'sansSexe'], [25, 'sansSexe'],
  ])('refuse le sexe %s / %s incompatible avec l’espèce', (numero, sexe) => {
    expect(() => validerPokemonPossede({ ...pokemon, numero, sexe })).toThrow(/sexe/i);
  });
  it.each([[100, 'sansSexe'], [29, 'femelle'], [32, 'male'], [25, 'male'], [25, 'femelle']])(
    'accepte le sexe %s / %s compatible', (numero, sexe) => {
      expect(() => validerPokemonPossede({ ...pokemon, numero, sexe })).not.toThrow();
    },
  );
  it.each(['', '   ', 'abcdefghijklm', '😀'.repeat(7)])('refuse le surnom invalide %j', surnom => {
    expect(() => validerPokemonPossede({ ...pokemon, surnom })).toThrow(/surnom/i);
  });
  it.each(['a', 'abcdefghijkl', '  abcdefghijkl  ', '😀'.repeat(6)])('accepte le surnom %j', surnom => {
    expect(() => validerPokemonPossede({ ...pokemon, surnom })).not.toThrow();
  });
  it('accepte l’absence de surnom', () => {
    expect(() => validerPokemonPossede(pokemon)).not.toThrow();
  });
});

export function migrerV0versV1(donnees: unknown) {
  const { nomPartie, ...reste } = donnees as Record<string, unknown>;
  return { ...reste, nom: nomPartie };
}
const ancienne = v0 as Enveloppe<unknown>;
describe('migrations de sauvegarde', () => {
  it('transforme la fixture fictive sans perdre les autres champs ni modifier la source', () => {
    const avant = structuredClone(v0);
    expect(migrer(ancienne, { ...migrationsParDefaut, 0: migrerV0versV1 })).toEqual({ ...v2, version: 3 });
    expect(v0).toEqual(avant);
    const donnees = { ...v0.donnees, futur: { valeur: 42 } };
    expect(migrer({ ...ancienne, donnees }, { ...migrationsParDefaut, 0: migrerV0versV1 }).donnees)
      .toEqual({ ...v2.donnees, futur: { valeur: 42 } });
  });
  it('signale exactement une marche manquante', () => {
    expect(() => migrer(ancienne)).toThrowError(new Error('Migration manquante : de la version 0 à la version 1.'));
  });
  it('déclare la version 3 et laisse intacte une sauvegarde actuelle', () => {
    expect(VERSION_ACTUELLE).toBe(3);
    expect(migrationsParDefaut).toEqual({ 1: migrerV1versV2, 2: migrerV2versV3 });
    const actuelle = { ...v2, version: 3 } as Enveloppe<unknown>;
    expect(migrer(actuelle)).toEqual(actuelle);
  });
  it('ne mute pas les données même si une migration travaille sur son argument', () => {
    const avant = structuredClone(v0);
    migrer(ancienne, { ...migrationsParDefaut, 0: donnees => {
      (donnees as Record<string, unknown>).nomPartie = 'Modifié';
      return donnees;
    } });
    expect(v0).toEqual(avant);
  });
  it.each([-1, 0.5, NaN])('refuse la version invalide %s', version => {
    expect(() => migrer({ ...ancienne, version })).toThrow('Version invalide');
  });
  it('refuse exactement une version future', () => {
    expect(() => migrer({ ...ancienne, version: 4 })).toThrowError(
      new Error("Cette sauvegarde vient d'une version plus récente du jeu."));
  });
});

// Vérifie chaque clé et valeur d'origine, y compris dans les Pokémon enrichis.
function verifierConservation(source: unknown, resultat: unknown) {
  if (source !== null && typeof source === 'object') {
    for (const [cle, valeur] of Object.entries(source)) {
      expect(Object.hasOwn(resultat as object, cle)).toBe(true);
      verifierConservation(valeur, (resultat as Record<string, unknown>)[cle]);
    }
    if (Array.isArray(source)) expect(resultat).toHaveLength(source.length);
  } else expect(resultat).toEqual(source);
}

describe('marche 1 → 2', () => {
  it.each([
    ['partie', v1, v2], ['region', regionV1, regionV2], ['compte', compteV1, compteV2],
  ] as const)('migre exactement la fixture %s sans perte ni mutation et de façon reproductible', (niveau, source, attendu) => {
    const avant = structuredClone(source);
    const resultat = migrer(source as Enveloppe<unknown>);
    expect(resultat).toEqual({ ...attendu, version: 3 });
    const fichier = readFileSync(new URL(`./__fixtures__/${niveau}-v2.json`, import.meta.url), 'utf8');
    const intermediaire = { ...source, version: 2, donnees: migrerV1versV2(source.donnees, niveau) };
    expect(`${JSON.stringify(intermediaire, null, 2)}\n`).toBe(fichier.replace(/\r\n/g, '\n'));
    expect(migrer(source as Enveloppe<unknown>)).toEqual(resultat);
    expect(migrer(resultat)).toEqual(resultat);
    expect(migrerV1versV2(source.donnees, niveau)).toEqual(attendu.donnees);
    expect(source).toEqual(avant);
    verifierConservation(source.donnees, resultat.donnees);
  });
  it('ajoute exactement les valeurs de régionInitiale et conserve les champs inconnus', () => {
    const initiale = regionInitiale('kanto', 'kanto.route-1');
    const resultat = migrer(regionV1 as Enveloppe<unknown>).donnees as Record<string, unknown>;
    for (const [cle, valeur] of Object.entries(initiale)) {
      if (!Object.hasOwn(regionV1.donnees, cle)) expect(resultat[cle]).toEqual(valeur);
    }
    for (const niveau of ['partie', 'region'] as const) {
      const source = niveau === 'partie' ? v1 : regionV1;
      const donnees = { ...source.donnees, inconnu: { liste: [1, 'conservé'] } };
      verifierConservation(donnees, migrer({ ...source, niveau, donnees }).donnees);
    }
  });
  it('calcule le sexe depuis l’uid, indépendamment du niveau, du hasard et de l’horloge', () => {
    const hasard = vi.spyOn(Math, 'random').mockImplementation(() => { throw new Error('Hasard interdit'); });
    const horloge = vi.spyOn(Date, 'now').mockImplementation(() => { throw new Error('Horloge interdit'); });
    try {
      for (const [uid, sexe] of [['b', 'male'], ['a', 'femelle'], ['😀', 'femelle']]) {
        const pokemon = { ...v1.donnees.pcGlobal[0], uid, futur: 42 };
        const partie = migrerV1versV2({ ...v1.donnees, pcGlobal: [pokemon] }, 'partie') as typeof v2.donnees;
        const region = migrerV1versV2({ ...regionV1.donnees, equipe: [pokemon] }, 'region') as typeof regionV2.donnees;
        expect(partie.pcGlobal[0]).toEqual({ ...pokemon, sexe, favori: false });
        expect(region.equipe[0]).toEqual(partie.pcGlobal[0]);
      }
    } finally { hasard.mockRestore(); horloge.mockRestore(); }
  });
  it('passe le niveau à la migration et signale une marche absente', () => {
    const marche = vi.fn(migrerV1versV2);
    migrer(v1 as Enveloppe<unknown>, { ...migrationsParDefaut, 1: marche });
    expect(marche).toHaveBeenCalledWith(v1.donnees, 'partie');
    expect(() => migrer(v1 as Enveloppe<unknown>, {})).toThrowError(new Error('Migration manquante : de la version 1 à la version 2.'));
  });
  it('isole les valeurs ajoutées et préserve les champs présents même s’ils recouvrent les défauts', () => {
    const source = { ...regionV1.donnees, jetons: 17, pension: { futur: ['conservé'] } };
    const avant = structuredClone(source);
    const resultat = migrerV1versV2(source, 'region') as typeof regionV2.donnees;
    verifierConservation(source, resultat);
    resultat.chronos.finRepousse = 99;
    resultat.arretAuto.rare = false;
    resultat.pc.length = 1;
    expect(source).toEqual(avant);
    expect(migrer(regionV1 as Enveloppe<unknown>)).toEqual({ ...regionV2, version: 3 });
    expect(migrerV1versV2(compteV1.donnees, 'compte')).toBe(compteV1.donnees);
  });
});

describe('migration 1 → 2 : données mal formées', () => {
  it("laisse la validation refuser une équipe qui n'est pas une liste, sans exception brute", () => {
    const region = { version: 1, niveau: 'region' as const, id: 'kanto', revision: 1,
      ecritLe: '2026-10-24T10:00:00.000Z', donnees: { regionId: 'kanto', equipe: 'oups' } };
    expect(() => migrer(region as Enveloppe<unknown>)).not.toThrow();
    expect(migrer(region as Enveloppe<unknown>).donnees).toMatchObject({ equipe: 'oups', pc: [] });
  });
});
