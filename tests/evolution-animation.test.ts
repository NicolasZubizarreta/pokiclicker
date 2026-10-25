import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

const css = readFileSync('src/styles/index.css', 'utf8');
const v1 = readFileSync('legacy/css/styles.css', 'utf8').split(/\r?\n/).slice(32, 55).join('\n');
const renduV1 = readFileSync('legacy/js/ui/render.js', 'utf8').split(/\r?\n/).slice(66, 77).join('\n');
const bloc = (source: string, nom: string) => source.match(new RegExp(`@keyframes ${nom}\\s*\\{([\\s\\S]*?)\\n\\s*\\}`))?.[1] ?? '';
const etapes = (source: string) => Array.from(source.matchAll(/(\d+)%\s*\{([^}]+)\}/g), ([, pourcentage, declarations = '']) => ({
  pourcentage: Number(pourcentage),
  transform: declarations.match(/transform:\s*([^;]+)/)?.[1]?.trim(),
  filter: declarations.match(/filter:\s*([^;]+)/)?.[1]?.trim(),
}));

it('reprend chaque pourcentage, transform et filter V1, pendant 3 s linear forwards via un jeton', () => {
  const reference = etapes(bloc(v1, 'evolution-flash'));
  expect(reference).toHaveLength(20);
  expect(etapes(bloc(css, 'evolution-flash'))).toEqual(reference);
  expect(v1).toMatch(/animation: evolution-flash 3s linear forwards/);
  expect(css).toMatch(/:root\s*\{[^}]*--duree-evolution:\s*3s\s*;/);
  expect(css).toMatch(/@utility evolution-flash\s*\{\s*animation:\s*evolution-flash var\(--duree-evolution\) linear forwards;/);
});

it('alterne sur 20 segments de 150 ms dans le sens du temps restant V1 et finit sur le nouveau', () => {
  expect(renduV1).toMatch(/const timeLeft = evolvingPokemon.endTime - Date\.now\(\)/);
  expect(renduV1).toMatch(/Math\.floor\(timeLeft\s*\/\s*150\)\s*%\s*2\s*===\s*0/);
  expect(renduV1).toMatch(/displayImg = getSprite\(evolvingPokemon.oldId, p.isShiny\)/);
  const alternance = Array.from(bloc(css, 'evolution-alternance').matchAll(/(\d+)%\s*\{\s*opacity:\s*var\(--evolution-(pair|impair)\);\s*\}/g));
  expect(alternance).toHaveLength(21);
  expect(css).toMatch(/@utility evolution-alternance\s*\{\s*animation:\s*evolution-alternance var\(--duree-evolution\) step-end forwards;/);
  expect(css).toMatch(/\.evolution-ancien\s*\{\s*--evolution-pair:\s*0;\s*--evolution-impair:\s*1;/);
  expect(css).toMatch(/\.evolution-nouveau\s*\{\s*--evolution-pair:\s*1;\s*--evolution-impair:\s*0;/);
  for (let segment = 0; segment < 20; segment++) {
    const restant = 3000 - (segment * 150 + 75);
    const ancienVisibleV1 = Math.floor(restant / 150) % 2 === 0;
    expect(Number(alternance[segment]?.[1])).toBe(segment * 5);
    expect(alternance[segment]?.[2] === 'impair').toBe(ancienVisibleV1);
    expect(!ancienVisibleV1).toBe(segment % 2 === 0);
  }
  expect(alternance[20]?.slice(1)).toEqual(['100', 'pair']);
});
