import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { reglages } from '../src/core/reglages';
import { ECLAT, SECOUSSE } from '../src/ui/animations';

const css = readFileSync('src/styles/index.css', 'utf8');
const v1 = readFileSync('legacy/css/styles.css', 'utf8').split(/\r?\n/).slice(0, 31).join('\n');
const etapes = (source: string) => Array.from(source.matchAll(/(\d+)%\s*\{\s*transform:\s*([^;]+);\s*\}/g), ([, pourcentage, transform]) => ({
  offset: Number(pourcentage) / 100,
  transform: transform!.replaceAll('0px', '0'),
}));
const imagesV1 = (nom: string) => etapes(v1.match(new RegExp(`@keyframes ${nom} \\{([^\\n]+)`))?.[1] ?? '');

it('reprend les étapes et les déplacements du flottement V1 avec l’espacement de 4 px', () => {
  const bloc = css.match(/@keyframes flottement\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
  const translation = css.match(/--translation-flottement:\s*([^;]+);/)?.[1];
  expect(translation).toBe('calc(var(--spacing) * -2.5)');
  const images = etapes(bloc.replaceAll('var(--translation-flottement)', '-10px'));
  expect(imagesV1('float')).toHaveLength(3);
  expect(images).toEqual(imagesV1('float'));
  const animation = v1.match(/animation: float ([\d.]+)s (\S+) infinite/)!;
  expect(css).toMatch(new RegExp(`:root\\s*\\{[^}]*--duree-flottement:\\s*${animation[1]}s\\s*;`));
  expect(css).toMatch(new RegExp(`@utility flottement\\s*\\{\\s*animation: flottement var\\(--duree-flottement\\) ${animation[2]} infinite;`));
  expect(reglages.animations.flottementMs).toBe(Number(animation[1]) * 1000);
});

it('reprend les étapes, la durée et la courbe de la secousse V1', () => {
  expect(imagesV1('shake')).toHaveLength(4);
  expect(SECOUSSE.keyframes.map((image) => ({
    offset: image.offset,
    transform: String(image.transform)
      .replaceAll('calc(var(--spacing) * -1.25)', '-5px')
      .replaceAll('calc(var(--spacing) * 1.25)', '5px'),
  }))).toEqual(imagesV1('shake'));
  const animation = v1.match(/animation: shake ([\d.]+)s (\S+);/)!;
  expect(SECOUSSE.options).toEqual({ duration: Number(animation[1]) * 1000, easing: animation[2] });
  expect(SECOUSSE.options.duration).toBe(reglages.animations.secousseMs);
});

it('anime seulement l’opacité de l’éclat pendant la secousse', () => {
  expect(ECLAT.keyframes).toEqual([{ opacity: 0 }, { opacity: 0.5 }, { opacity: 0 }]);
  expect(ECLAT.options).toEqual({ duration: reglages.animations.secousseMs, easing: 'ease-in-out' });
  const eclat = css.match(/\.eclat-touche\s*\{([^}]+)\}/)?.[1] ?? '';
  expect(eclat).toMatch(/filter:\s*brightness\(0\) invert\(1\);/);
  expect(eclat).toMatch(/opacity:\s*0;/);
});

it('dessine quatre ombres dorées sans flou et conserve le mouvement réduit', () => {
  const halo = css.match(/\.halo-shiny\s*\{([^}]+)\}/)?.[1] ?? '';
  const ombres = Array.from(halo.matchAll(/drop-shadow\((calc\(var\(--spacing\) \/ -?4\)|0) (calc\(var\(--spacing\) \/ -?4\)|0) 0 var\(--alerte-base\)\)/g), ([, x, y]) => [x, y]);
  expect(ombres).toEqual([
    ['calc(var(--spacing) / 4)', '0'], ['calc(var(--spacing) / -4)', '0'],
    ['0', 'calc(var(--spacing) / 4)'], ['0', 'calc(var(--spacing) / -4)'],
  ]);
  expect(halo.match(/drop-shadow\(/g)).toHaveLength(4);
  expect(halo).toContain('brightness(1.1)');
  expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*\*, \*::before, \*::after\s*\{\s*transition: none !important;\s*animation: none !important;/);
});
