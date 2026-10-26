import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { enregistrerTailleImage } from './manifeste.mjs';

const racine = new URL('../', import.meta.url);

async function preparer() {
  const { objet, decor } = JSON.parse(await readFile(new URL('data/images.json', racine), 'utf8'));
  await mkdir(new URL('public/img/objets/', racine), { recursive: true });
  for (const [source, fichier] of [['JetonShiny.png', 'JetonShiny.png'], ['Diplôme.png', 'Diplome.png']]) {
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
  console.log('Icônes : Jeton Shiny et diplôme préparés et enregistrés.');
}

preparer().catch((erreur) => {
  console.error(erreur);
  process.exitCode = 1;
});
