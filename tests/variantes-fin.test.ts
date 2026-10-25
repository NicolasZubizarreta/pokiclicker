import { readFileSync, existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Maquettes de fin : six entrées autonomes', () => {
  for (const [serie, pages] of Object.entries({ diplome: ['a-fenetre', 'b-kanto', 'c-impression'], credits: ['a-noir', 'b-labo', 'c-pages'] })) {
    for (const page of pages) it(`${serie}/${page} est navigable hors serveur`, () => {
      const fichier = `design/variantes/${serie}/${page}.html`;
      expect(existsSync(fichier)).toBe(true);
      const html = readFileSync(fichier, 'utf8');
      expect(html).toContain('lang="fr"');
      expect(html).toContain('name="viewport"');
      expect(html).toContain('src="commun.js" defer');
      expect(html).not.toMatch(/https?:\/\//);
    });
    it(`${serie} est accessible depuis l’index`, () => {
      expect(readFileSync('design/variantes/index.html', 'utf8')).toContain(`${serie}/${pages[0]}.html`);
    });
  }
});
