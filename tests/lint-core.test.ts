import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const cwd = fileURLToPath(new URL('../', import.meta.url));
const eslint = new ESLint({ cwd });
const filePath = 'src/core/exemple.ts';

describe('Pureté du cœur du jeu', () => {
  it('interdit les imports de React', async () => {
    const resultats = await eslint.lintText("import 'react';", { filePath });
    expect(resultats.flatMap((resultat) => resultat.messages)).toEqual(
      expect.arrayContaining([expect.objectContaining({ ruleId: 'no-restricted-imports', severity: 2 })]),
    );
  });

  it('interdit les accès au document', async () => {
    const resultats = await eslint.lintText('document.title = "Jeu";', { filePath });
    expect(resultats.flatMap((resultat) => resultat.messages)).toEqual(
      expect.arrayContaining([expect.objectContaining({ ruleId: 'no-restricted-globals', severity: 2 })]),
    );
  });

  it('accepte du TypeScript pur', async () => {
    const resultats = await eslint.lintText('export const addition = (a: number, b: number): number => a + b;', { filePath });
    expect(resultats).toHaveLength(1);
    expect(resultats.flatMap((resultat) => resultat.messages)).toEqual([]);
  });
});
