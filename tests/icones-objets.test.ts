import { readFile, readdir } from 'node:fs/promises';
import sharp from 'sharp';
import { expect, it } from 'vitest';
import objets from '../data/objets.json';
import images from '../data/images.json';

const racine = new URL('../', import.meta.url);

it('utilise le Jeton Shiny V1 sans déformation sur un fond transparent', async () => {
  const chemin = 'img/objets/JetonShiny.png';
  expect(objets.find(objet => objet.id === 'shinyToken')!.image).toBe(chemin);
  const source = await readFile(new URL('legacy/img/kanto/icones/JetonShiny.png', racine));
  const sortie = await readFile(new URL(`public/${chemin}`, racine));
  const attendu = await sharp(source).resize(images.objet.taille, images.objet.taille, {
    fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 },
  }).raw().toBuffer();
  expect(await sharp(sortie).raw().toBuffer()).toEqual(attendu);
  expect((await sharp(sortie).metadata()).format).toBe('png');
  expect((await sharp(sortie).stats()).isOpaque).toBe(false);
});

it('enregistre toutes les icônes d’objet au même format carré', async () => {
  const dossier = new URL('public/img/objets/', racine);
  const tailles = JSON.parse(await readFile(new URL('public/img/tailles.json', racine), 'utf8'));
  expect(tailles['img/objets/JetonShiny.png']).toEqual({ largeur: images.objet.taille, hauteur: images.objet.taille });
  for (const nom of await readdir(dossier)) {
    const image = await sharp(await readFile(new URL(nom, dossier))).metadata();
    expect([image.width, image.height], nom).toEqual([images.objet.taille, images.objet.taille]);
    expect(tailles[`img/objets/${nom}`], nom).toEqual({ largeur: image.width, hauteur: image.height });
  }
});
