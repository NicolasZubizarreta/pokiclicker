import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Ligatures de la police', () => {
  it('désactive les ligatures sur html', () => {
    const css = readFileSync('src/styles/index.css', 'utf-8');

    expect(css).toMatch(/\bhtml\s*\{[^}]*font-variant-ligatures\s*:\s*none\s*;[^}]*\}/);
  });
});
