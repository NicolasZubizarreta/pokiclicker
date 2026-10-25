import { execFileSync } from 'node:child_process';
import { expect, it } from 'vitest';
import evolutions from '../data/evolutions.json';
import fixture from './fixtures/v1-evolutions.json';
import { evolutionParPierre, peutEvoluer, stade } from '../src/core/evolution';

it('reproduit les stades, possibilités et 755 combinaisons de pierres V1', () => {
  for (const espece of fixture.especes) {
    expect(stade(espece.numero)).toBe(espece.stade);
    expect(peutEvoluer(espece.numero)).toBe(espece.peutEvoluer);
    for (const [pierre, cible] of Object.entries(espece.pierres)) {
      expect(evolutionParPierre(espece.numero, pierre)).toBe(cible?.id ?? null);
    }
  }
});

it('conserve les 56 évolutions par niveau de la V1', () => {
  expect(evolutions.niveau.length).toBe(56);
  expect(Object.keys(fixture.EVOLUTIONS).length).toBe(56);
  for (const ligne of evolutions.niveau) {
    const original = fixture.EVOLUTIONS[String(ligne.de) as keyof typeof fixture.EVOLUTIONS];
    expect(ligne.vers).toBe(original.id);
    expect(ligne.niveau).toBe(original.lvl);
  }
});

it('conserve les 16 branches par pierre des 14 espèces V1', () => {
  expect(evolutions.pierre.length).toBe(16);
  expect(new Set(evolutions.pierre.map(ligne => ligne.de)).size).toBe(14);
  const originales = Object.entries(fixture.STONE_EVOLUTIONS).flatMap(([de, branches]) =>
    (Array.isArray(branches) ? branches : [branches]).map(branche => ({ de: Number(de), ...branche })));
  expect(originales.length).toBe(16);
  for (const [index, ligne] of evolutions.pierre.entries()) {
    expect(ligne.de).toBe(originales[index]?.de);
    expect(ligne.vers).toBe(originales[index]?.id);
    expect(ligne.pierre).toBe(originales[index]?.stone);
  }
});

it('vérifie les noms, inventaires et empreinte de toutes les données extraites', () => {
  expect(fixture.especes.length).toBe(151);
  for (const [index, espece] of fixture.especes.entries()) {
    expect(espece.numero).toBe(index + 1);
    expect(Object.keys(espece.pierres).length).toBe(5);
  }
  expect(execFileSync(process.execPath, ['scripts/extraire-evolutions-v1.mjs', '--verifier'], { encoding: 'utf8' }).trim())
    .toBe(`Évolutions V1 vérifiées : ${fixture.empreinte}`);
});
