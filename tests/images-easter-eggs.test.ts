import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
import { expect, it } from 'vitest';

const lire = (chemin: string) => readFile(new URL(`../${chemin}`, import.meta.url));

it.each([1, 2, 3])('livre Daran au stade %i en WebP transparent de 288 × 288 sous 60 Ko', async (stade) => {
  const chemin = `img/easter-eggs/daran-stade-${stade}.webp`;
  const image = await lire(`public/${chemin}`);
  expect(image.length).toBeLessThan(60_000);
  expect(await sharp(image).metadata()).toMatchObject({
    format: 'webp', width: 288, height: 288, hasAlpha: true,
  });
  const source = await lire(`legacy/img/kanto/EasterEgg/DaranStade${stade}.png`);
  expect(image).toEqual(await sharp(source).resize(288, 288, {
    fit: 'contain', position: 'bottom', background: { r: 0, g: 0, b: 0, alpha: 0 },
  }).webp({ quality: 80 }).toBuffer());
  const tailles = JSON.parse((await lire('public/img/tailles.json')).toString());
  expect(tailles[chemin]).toEqual({ largeur: 288, hauteur: 288 });
});

it('copie la vidéo de Daran sans modifier ses octets', async () => {
  const video = await lire('public/img/easter-eggs/daran.mp4');
  expect(video.equals(await lire('legacy/img/kanto/EasterEgg/Daran.mp4'))).toBe(true);
});

it('exclut les médias de Daran du précache et les met en cache à la demande', async () => {
  const config = (await lire('vite.config.ts')).toString();
  expect(config.match(/globIgnores:\s*\[([^\]]*)\]/)?.[1]).toContain("'**/img/easter-eggs/**'");
  const motif = config.match(/urlPattern:[^\n]*=> \/(.+)\/.test\(url.pathname\)/)?.[1];
  expect(motif).toBeDefined();
  for (const fichier of ['daran-stade-1.webp', 'daran.mp4']) {
    expect(new RegExp(motif!).test(`/img/easter-eggs/${fichier}`)).toBe(true);
  }
});
