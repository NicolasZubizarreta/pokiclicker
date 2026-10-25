import { readdir, readFile } from 'node:fs/promises';
import sharp from 'sharp';
import { expect, test } from 'vitest';

const ids = ['roche', 'cascade', 'foudre', 'prisme', 'ame', 'marais', 'volcan', 'terre'];

test('les huit badges sont des PNG de 96 px enregistrés dans tailles.json', async () => {
  const dossier = new URL('../public/img/badges/', import.meta.url);
  const tailles = JSON.parse(await readFile(new URL('../public/img/tailles.json', import.meta.url), 'utf8'));
  expect((await readdir(dossier)).sort()).toEqual(ids.map((id) => `${id}.png`).sort());
  for (const id of ids) {
    const image = await sharp(await readFile(new URL(`${id}.png`, dossier))).metadata();
    expect(image.format).toBe('png');
    expect([image.width, image.height]).toEqual([96, 96]);
    expect(tailles[`img/badges/${id}.png`]).toEqual({ largeur: 96, hauteur: 96 });
  }
});
