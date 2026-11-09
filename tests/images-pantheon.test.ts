import { access, readFile } from 'node:fs/promises';
import sharp from 'sharp';
import { expect, it } from 'vitest';
import miseEnPage from '../data/pantheon-scene.json';

const lire = (chemin: string) => readFile(new URL(`../${chemin}`, import.meta.url));

it('livre le Panthéon en décor 16:9 avec ses dimensions au manifeste', async () => {
  const { decor } = JSON.parse((await lire('data/images.json')).toString());
  expect(miseEnPage.image).toBe('decors/pantheon.webp');
  expect(await sharp(await lire(`public/img/${miseEnPage.image}`)).metadata())
    .toMatchObject({ format: 'webp', width: decor.largeur, height: decor.hauteur });
  const tailles = JSON.parse((await lire('public/img/tailles.json')).toString());
  expect(tailles['img/decors/pantheon.webp']).toEqual({ largeur: decor.largeur, hauteur: decor.hauteur });
  expect(miseEnPage.ratio).toEqual(decor.ratio);
});

it('ne garde plus l\'ancienne scène carrée du Panthéon', async () => {
  await expect(access(new URL('../public/img/scenes/pantheon.webp', import.meta.url))).rejects.toThrow();
  const tailles = JSON.parse((await lire('public/img/tailles.json')).toString());
  expect(tailles['img/scenes/pantheon.webp']).toBeUndefined();
});

it('exclut le décor du Panthéon du précache', async () => {
  const config = await readFile(new URL('../vite.config.ts', import.meta.url), 'utf8');
  expect(config.match(/globIgnores:\s*\[([^\]]*)\]/)?.[1]).toContain("'**/img/decors/!(route-1).webp'");
});
