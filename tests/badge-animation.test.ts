import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { reglages } from '../src/core/reglages';

const css = readFileSync('src/styles/index.css', 'utf8');
const v1 = readFileSync('legacy/css/styles.css', 'utf8').split(/\r?\n/).slice(190, 198).join('\n');
const sauvegardeV1 = readFileSync('legacy/js/game/save.js', 'utf8').split(/\r?\n/).slice(568, 581).join('\n');
const bloc = (source: string) => source.match(/@keyframes badge-slam\s*\{([\s\S]*?)\n\s*\}/)?.[1] ?? '';
const etapes = (source: string) => Array.from(source.matchAll(/(\d+)%\s*\{([^}]+)\}/g), ([, pourcentage, declarations = '']) => ({
  pourcentage: Number(pourcentage),
  transform: declarations.match(/transform:\s*([^;]+)/)?.[1]?.trim(),
  opacity: declarations.match(/opacity:\s*([^;]+)/)?.[1]?.trim(),
}));

it('reprend les pourcentages, transform et opacity de badge-slam V1', () => {
  const reference = etapes(bloc(v1));
  expect(reference).toHaveLength(4);
  expect(etapes(bloc(css))).toEqual(reference);
});

it('reprend la durée et la courbe V1 avec des jetons dans :root', () => {
  const animation = v1.match(/animation: badge-slam ([\d.]+)s (cubic-bezier\([^)]+\)) forwards/);
  expect(animation).not.toBeNull();
  expect(css).toMatch(new RegExp(`:root\\s*\\{[^}]*--duree-badge:\\s*${animation![1]}s\\s*;`));
  const courbe = css.match(/:root\s*\{[^}]*--ease-badge:\s*([^;]+);/)?.[1];
  expect(courbe).toBe(animation![2]);
  expect(css).toMatch(/@utility badge-slam\s*\{\s*animation:\s*badge-slam var\(--duree-badge\) var\(--ease-badge\) forwards;/);
  expect(reglages.badges.claqueMs).toBe(Number(animation![1]) * 1000);
});

it('cale ouverture et délai de claque sur les deux temporisations V1', () => {
  const delais = Array.from(sauvegardeV1.matchAll(/\},\s*(\d+)\);/g), ([, valeur]) => Number(valeur));
  expect(delais).toEqual([800, 1200]);
  expect(reglages.badges.claqueDelaiMs).toBe(delais[0]);
  expect(reglages.badges.ouvertureMs).toBe(delais[1]);
});

it('déclare hors des couches les fonds et le liseré avec un anneau sans flou', () => {
  for (const nom of ['badge-obtenu', 'badge-vide']) {
    const position = css.indexOf(`.${nom} {`);
    expect(position).toBeGreaterThan(-1);
    const avant = css.slice(0, position);
    expect((avant.match(/\{/g) ?? []).length).toBe((avant.match(/\}/g) ?? []).length);
  }
  const obtenu = css.match(/\.badge-obtenu\s*\{([^}]+)\}/)?.[1] ?? '';
  expect(obtenu).toMatch(/background:\s*var\(--alerte-fond\);/);
  expect(obtenu).toMatch(/border:\s*calc\(var\(--spacing\) \/ 2\) solid var\(--alerte-base\);/);
  expect(obtenu).toMatch(/box-shadow:\s*0 0 0 var\(--spacing\) var\(--alerte-base\);/);
  expect(css).toMatch(/\.badge-vide\s*\{\s*background:\s*var\(--surface-2\);/);
  expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*\*, \*::before, \*::after\s*\{[^}]*animation: none !important;/);
});
