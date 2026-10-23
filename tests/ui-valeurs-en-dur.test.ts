import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

const racine = fileURLToPath(new URL('../', import.meta.url));

it('ne contient aucune valeur de design en dur dans les composants et styles', () => {
  const fichiers = ['src/ui', 'src/styles'].flatMap((dossier) =>
    readdirSync(`${racine}/${dossier}`, { recursive: true, withFileTypes: true })
      .filter((entree) => entree.isFile() && /\.(tsx?|css)$/.test(entree.name) && !/\.test\.tsx?$/.test(entree.name))
      .map((entree) => `${entree.parentPath}/${entree.name}`));
  const interdits = [
    /#(?:[\da-f]{8}|[\da-f]{6}|[\da-f]{3})\b/i,
    /\b(?:rgb|hsl|oklch)\s*\(/i,
    /style\s*=\s*\{\s*\{/,
    /border-radius\s*:[^;{}]*\d(?:\.\d+)?px/i,
  ];
  const erreurs: string[] = [];
  for (const fichier of fichiers) {
    readFileSync(fichier, 'utf8').split(/\r?\n/).forEach((ligne, index) => {
      const arbitraires = ligne.match(/\[[^\]]*\d(?:px|rem|em|vh|vw)[^\]]*\]/g) ?? [];
      if (interdits.some((motif) => motif.test(ligne)) || arbitraires.some((valeur) => !valeur.includes('env('))) {
        erreurs.push(`${fichier}:${index + 1} : ${ligne.trim()}`);
      }
    });
  }
  expect(erreurs, erreurs.join('\n')).toEqual([]);
});
