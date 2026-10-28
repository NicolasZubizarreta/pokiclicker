import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { reglages } from '../core/reglages';
import { classesRarete } from './raretes';

const css = readFileSync('design/tokens.css', 'utf8');

function jetons(debut: string): Record<string, string> {
  const depart = css.indexOf(debut);
  const bloc = css.slice(depart, css.indexOf('}', depart));
  return Object.fromEntries([...bloc.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6})/gi)].map(m => [m[1]!, m[2]!]));
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

const contraste = (a: string, b: string) => {
  const [clair, fonce] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (clair! + 0.05) / (fonce! + 0.05);
};

it('donne une table de classes à chaque rareté du jeu, avec cinq couples distincts pour les cinq raretés', () => {
  expect(Object.keys(classesRarete).sort()).toEqual(Object.keys(reglages.objetsActifs.raretes).sort());
  const cinq = ['commun', 'peu-commun', 'rare', 'tres-rare', 'legendaire'] as const;
  expect(new Set(cinq.map(cle => classesRarete[cle])).size).toBe(5);
});

it.each([['clair', ':root {'], ['sombre', ':root[data-theme="dark"]']])(
  'respecte un contraste texte/fond d’au moins 4,5 en thème %s avec des jetons existants', (_, debut) => {
    const theme = jetons(debut);
    for (const classes of new Set(Object.values(classesRarete))) {
      const [fond, texte] = [/\bbg-([a-z0-9-]+)/, /\btext-([a-z0-9-]+)/].map(motif => classes.match(motif)![1]!);
      expect(theme[fond!], `jeton ${fond}`).toBeDefined();
      expect(theme[texte!], `jeton ${texte}`).toBeDefined();
      expect(contraste(theme[fond!]!, theme[texte!]!), classes).toBeGreaterThanOrEqual(4.5);
    }
  });
