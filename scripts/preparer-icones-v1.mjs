import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { enregistrerTailleImage } from './manifeste.mjs';

const racine = new URL('../', import.meta.url);

async function preparer() {
  const { objet } = JSON.parse(await readFile(new URL('data/images.json', racine), 'utf8'));
  const chemin = 'img/objets/JetonShiny.png';
  await mkdir(new URL('public/img/objets/', racine), { recursive: true });
  await sharp(fileURLToPath(new URL('legacy/img/kanto/icones/JetonShiny.png', racine)))
    .resize(objet.taille, objet.taille, {
      fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(fileURLToPath(new URL(`public/${chemin}`, racine)));
  await enregistrerTailleImage(chemin, objet.taille, objet.taille);
  console.log('Icônes : Jeton Shiny préparé et enregistré.');
}

preparer().catch((erreur) => {
  console.error(erreur);
  process.exitCode = 1;
});
