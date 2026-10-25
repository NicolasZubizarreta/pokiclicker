import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('Maquettes du Panthéon', () => {
  for (const page of ['a-fidele', 'b-honneur', 'c-chen']) {
    it(`${page} est accessible depuis la galerie et charge la simulation locale`, () => {
      const html = readFileSync(`design/variantes/pantheon/${page}.html`, 'utf8')
      expect(html).toContain('lang="fr"')
      expect(html).toContain('commun.js')
      expect(html).toContain('commun.css')
      expect(readFileSync('design/variantes/index.html', 'utf8')).toContain(`pantheon/${page}.html`)
    })
  }
})
