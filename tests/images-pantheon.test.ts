import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
import { expect, it } from 'vitest';

it('livre le Panthéon carré sans recadrage et avec ses dimensions au manifeste', async () => {
  const lire = (chemin: string) => readFile(new URL(`../${chemin}`, import.meta.url));
  const source = await lire('legacy/img/kanto/background/Pantheon.png');
  expect(await sharp(source).metadata()).toMatchObject({ width: 1024, height: 1024 });
  const { scene } = JSON.parse((await lire('data/images.json')).toString());
  const image = await lire('public/img/scenes/pantheon.webp');
  expect(await sharp(image).metadata()).toMatchObject({ format: 'webp', width: 1080, height: 1080 });
  expect(image).toEqual(await sharp(source).resize(scene.largeur, scene.hauteur, { fit: 'fill' })
    .webp({ quality: scene.qualiteWebp }).toBuffer());
  const tailles = JSON.parse((await lire('public/img/tailles.json')).toString());
  expect(tailles['img/scenes/pantheon.webp']).toEqual({ largeur: 1080, hauteur: 1080 });
});

it('exclut le décor du Panthéon du précache', async () => {
  const config = await readFile(new URL('../vite.config.ts', import.meta.url), 'utf8');
  expect(config.match(/globIgnores:\s*\[([^\]]*)\]/)?.[1]).toContain("'**/img/scenes/pantheon.webp'");
});
