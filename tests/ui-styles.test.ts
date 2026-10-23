import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const racine = fileURLToPath(new URL('../', import.meta.url));
const lire = (fichier: string) => readFileSync(`${racine}/${fichier}`, 'utf8');
const styles = lire('src/styles/index.css');
const regions = lire('design/regions.css');

describe('Jetons et styles de l’interface', () => {
  it('définit un focus visible de trois pixels utilisant le rôle focus', () => {
    expect(styles).toMatch(/:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--focus\);[^}]*outline-offset:\s*2px;/);
  });

  it('charge les sources de jetons et de régions', () => {
    expect(styles).toContain('@import "../../design/tokens.tailwind.css"');
    expect(styles).toContain('@import "../../design/regions.css"');
    expect(regions).toMatch(/\[data-region="johto"\]\s*\{[^}]*--fond:/);
    for (const [region, rayon] of [['kanto', '0'], ['johto', '0.25rem'], ['atlas', '0.75rem']]) {
      const bloc = regions.split(`[data-region="${region}"] {`)[1]?.split('}')[0];
      expect(bloc).toContain(`--rayon: ${rayon};`);
    }
  });

  it('charge uniquement les polices locales attendues et aucune URL externe', () => {
    expect(styles).toContain('@fontsource/pixelify-sans/latin-600.css');
    for (const poids of [400, 600, 700]) {
      expect(styles).toContain(`@fontsource/atkinson-hyperlegible-next/latin-${poids}.css`);
    }
    const fichiers = readdirSync(`${racine}/src`, { recursive: true, withFileTypes: true })
      .filter((entree) => entree.isFile())
      .map((entree) => `${entree.parentPath}/${entree.name}`);
    fichiers.push(`${racine}/index.html`);
    for (const fichier of fichiers) {
      const contenu = readFileSync(fichier, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, (commentaire) => /@license|@licence|copyright|SPDX/i.test(commentaire) ? '' : commentaire)
        .replace(/^\s*\/\/.*(?:@license|@licence|copyright|SPDX).*$/gim, '')
        .replace(/http:\/\/www\.w3\.org\/[\w/-]*/g, '');
      expect(contenu, fichier).not.toMatch(/https?:\/\//i);
    }
  });
});
