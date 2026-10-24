import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import jeu from '../data/jeu.json';
import { lireJetons } from '../scripts/lire-jetons.mjs';
import { construireManifeste } from '../scripts/manifeste.mjs';

it('construit un manifeste français avec le fond sombre et les trois icônes', () => {
  const manifeste = construireManifeste({ jeu, jetons: lireJetons() });
  // Lecture indépendante de la fonction utilisée par la construction.
  const css = readFileSync('design/tokens.css', 'utf8');
  const sombre = css.split(':root[data-theme="dark"]')[1]!.split('}')[0]!;
  const fond = /--fond:\s*(\S+)\s*;/.exec(sombre)![1];
  expect(manifeste).toMatchObject({ name: jeu.nom, short_name: jeu.nomCourt,
    description: jeu.description, lang: 'fr', display: 'standalone', orientation: 'portrait',
    start_url: '/', scope: '/', background_color: fond, theme_color: fond });
  expect(manifeste.icons).toEqual(expect.arrayContaining([
    expect.objectContaining({ sizes: '192x192', purpose: 'any' }),
    expect.objectContaining({ sizes: '512x512', purpose: 'any' }),
    expect.objectContaining({ sizes: '512x512', purpose: 'maskable' }),
  ]));
});

it('ne recopie aucune couleur hexadécimale dans la configuration ni les scripts PWA', () => {
  for (const fichier of ['vite.config.ts', 'index.html', 'scripts/lire-jetons.mjs',
    'scripts/manifeste.mjs', 'scripts/generer-icones.mjs']) {
    expect(readFileSync(fichier, 'utf8'), fichier).not.toMatch(/#[\da-f]{3,8}\b/i);
  }
});
