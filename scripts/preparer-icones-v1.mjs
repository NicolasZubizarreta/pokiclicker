import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { enregistrerTailleImage } from './manifeste.mjs';

const racine = new URL('../', import.meta.url);

async function preparer() {
  const { objet, decor } = JSON.parse(await readFile(new URL('data/images.json', racine), 'utf8'));
  await mkdir(new URL('public/img/objets/', racine), { recursive: true });
  for (const [source, fichier] of [['JetonShiny.png', 'JetonShiny.png'], ['Diplôme.png', 'Diplome.png'], ['PokeRadar.png', 'PokeRadar.png']]) {
    const chemin = `img/objets/${fichier}`;
    await sharp(fileURLToPath(new URL(`legacy/img/kanto/icones/${source}`, racine)))
      .resize(objet.taille, objet.taille, {
        fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(fileURLToPath(new URL(`public/${chemin}`, racine)));
    await enregistrerTailleImage(chemin, objet.taille, objet.taille);
  }
  const chemin = 'img/fin/diplome.webp';
  await mkdir(new URL('public/img/fin/', racine), { recursive: true });
  await sharp(fileURLToPath(new URL('legacy/img/kanto/icones/Diplôme.png', racine)))
    .webp({ quality: decor.qualiteWebp })
    .toFile(fileURLToPath(new URL(`public/${chemin}`, racine)));
  await enregistrerTailleImage(chemin, 1280, 698);
  // Charme Chroma (montré en grand à la fin du Pokédex) et sprites de vol (images flottantes des crédits).
  await sharp(fileURLToPath(new URL('legacy/img/kanto/icones/CharmeChroma.png', racine)))
    .resize(512, 512).webp({ quality: decor.qualiteWebp })
    .toFile(fileURLToPath(new URL('public/img/fin/charme-chroma.webp', racine)));
  await enregistrerTailleImage('img/fin/charme-chroma.webp', 512, 512);
  for (let numero = 1; numero <= 5; numero++) {
    const vol = sharp(fileURLToPath(new URL(`legacy/img/kanto/sprites/SpriteFly${numero}.png`, racine)));
    const { width, height } = await vol.metadata();
    const largeur = Math.round(width / 2);
    const hauteur = Math.round(height / 2);
    await vol.resize(largeur, hauteur).webp({ quality: decor.qualiteWebp })
      .toFile(fileURLToPath(new URL(`public/img/fin/vol-${numero}.webp`, racine)));
    await enregistrerTailleImage(`img/fin/vol-${numero}.webp`, largeur, hauteur);
  }
  console.log('Icônes : Jeton Shiny, diplôme, Charme Chroma et sprites de vol préparés et enregistrés.');
}

preparer().catch((erreur) => {
  console.error(erreur);
  process.exitCode = 1;
});
