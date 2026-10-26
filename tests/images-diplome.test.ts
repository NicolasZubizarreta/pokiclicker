import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
import { expect, it } from 'vitest';

const lire = (chemin: string) => readFile(new URL(`../${chemin}`, import.meta.url));

it('livre les deux images du diplôme depuis la V1 et les déclare au manifeste', async () => {
  const source = await lire('legacy/img/kanto/icones/Diplôme.png');
  expect(await sharp(source).metadata()).toMatchObject({ width: 1280, height: 698 });
  const { objet, decor } = JSON.parse((await lire('data/images.json')).toString());
  const icone = await lire('public/img/objets/Diplome.png');
  expect(icone).toEqual(await sharp(source).resize(objet.taille, objet.taille, {
    fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 },
  }).png().toBuffer());
  const diplome = await lire('public/img/fin/diplome.webp');
  expect(await sharp(diplome).metadata()).toMatchObject({ format: 'webp', width: 1280, height: 698 });
  expect(diplome).toEqual(await sharp(source).webp({ quality: decor.qualiteWebp }).toBuffer());
  const tailles = JSON.parse((await lire('public/img/tailles.json')).toString());
  expect(tailles['img/objets/Diplome.png']).toEqual({ largeur: objet.taille, hauteur: objet.taille });
  expect(tailles['img/fin/diplome.webp']).toEqual({ largeur: 1280, hauteur: 698 });
  const objets = JSON.parse((await lire('data/objets.json')).toString()) as { id: string; image: string | null }[];
  expect(objets.find(({ id }) => id === 'diploma')?.image).toBe('img/objets/Diplome.png');
});

it('exclut le diplôme grand format du précache', async () => {
  const config = (await lire('vite.config.ts')).toString();
  expect(config.match(/globIgnores:\s*\[([^\]]*)\]/)?.[1]).toContain("'**/img/fin/**'");
});
