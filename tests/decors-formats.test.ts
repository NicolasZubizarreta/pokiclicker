import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
import { expect, it } from 'vitest';

// Ticket O : un seul ratio par type d'image. Les décors sont en 16:9, les scènes interactives en 1:1 (data/images.json).
const racine = new URL('../', import.meta.url);
const lire = async (chemin: string) => JSON.parse(await readFile(new URL(chemin, racine), 'utf8'));

/** Lieux et zones encore sans décor 16:9 (images à fournir, voir docs/projet/decors-a-regenerer.md). Retirer un nom ici quand son décor est livré. */
const SANS_DECOR_16_9: string[] = [];

it('chaque décor livré est un WebP 16:9 aux dimensions annoncées dans tailles.json', async () => {
  const { decor } = await lire('data/images.json');
  const tailles: Record<string, { largeur: number; hauteur: number }> = await lire('public/img/tailles.json');
  const decors = Object.entries(tailles).filter(([chemin]) => chemin.startsWith('img/decors/'));
  expect(decors.length).toBeGreaterThanOrEqual(26);
  for (const [chemin, { largeur, hauteur }] of decors) {
    expect(largeur, chemin).toBe(decor.largeur);
    expect(hauteur, chemin).toBe(decor.hauteur);
    expect(Math.abs(largeur / hauteur - decor.ratio[0] / decor.ratio[1]), chemin).toBeLessThanOrEqual(decor.tolerance);
    expect(await sharp(await readFile(new URL(`public/${chemin}`, racine))).metadata(), chemin).toMatchObject({ width: largeur, height: hauteur });
  }
});

it('chaque scène livrée est carrée', async () => {
  const { scene } = await lire('data/images.json');
  const tailles: Record<string, { largeur: number; hauteur: number }> = await lire('public/img/tailles.json');
  for (const [chemin, { largeur, hauteur }] of Object.entries(tailles).filter(([c]) => c.startsWith('img/scenes/'))) {
    expect(largeur / hauteur, chemin).toBe(scene.ratio[0] / scene.ratio[1]);
  }
});

it('la liste des lieux sans décor 16:9 est exacte', async () => {
  const { zones, lieux } = await lire('data/regions/kanto/zones.json');
  const tailles: Record<string, unknown> = await lire('public/img/tailles.json');
  const manquants = [...zones, ...lieux]
    .map((l: { decor: string }) => l.decor.split('/').at(-1)!)
    .filter(fichier => !(`img/decors/${fichier}` in tailles))
    .map(fichier => fichier.replace(/\.webp$/, ''))
    .sort();
  expect(manquants).toEqual([...SANS_DECOR_16_9].sort());
});
