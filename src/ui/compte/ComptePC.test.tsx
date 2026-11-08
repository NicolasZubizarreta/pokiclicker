import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
const css = readFileSync(new URL('./ComptePC.css', import.meta.url), 'utf8');

it('conserve les grilles validées et borne les fenêtres sur PC', () => {
  expect(css).toContain('@media (min-width: 1024px)');
  expect(css).toContain('grid-template-columns: repeat(auto-fill, minmax(24rem, 1fr))');
  expect(css).toContain('grid-template-columns: minmax(0, 1.15fr) minmax(24rem, 30rem)');
  expect(css).toContain('max-height: calc(100dvh - 4rem)');
});

it('réserve plus de place au-dessus des écrans ailleurs que la hauteur maximale de l’avis', () => {
  expect(css).toContain('body:has(.avis-divergence) .compte-pc.zc-ecran { padding-top: calc(var(--spacing) * 32)');
  expect(css).toContain('body:has(.compte-pc.zc-ecran) .avis-divergence { max-height: calc(var(--spacing) * 28); overflow-y: auto');
});
