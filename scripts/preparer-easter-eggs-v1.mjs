import { copyFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { enregistrerTailleImage } from './manifeste.mjs';

const racine = new URL('../', import.meta.url);

async function preparer() {
  await mkdir(new URL('public/img/easter-eggs/', racine), { recursive: true });
  for (const stade of [1, 2, 3]) {
    const chemin = `img/easter-eggs/daran-stade-${stade}.webp`;
    await sharp(fileURLToPath(new URL(`legacy/img/kanto/EasterEgg/DaranStade${stade}.png`, racine)))
      .resize(288, 288, {
        fit: 'contain', position: 'bottom', background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({ quality: 80 })
      .toFile(fileURLToPath(new URL(`public/${chemin}`, racine)));
    await enregistrerTailleImage(chemin, 288, 288);
  }
  await copyFile(new URL('legacy/img/kanto/EasterEgg/Daran.mp4', racine),
    new URL('public/img/easter-eggs/daran.mp4', racine));
  console.log('Easter eggs : trois images de Daran préparées et vidéo copiée.');
}

preparer().catch((erreur) => {
  console.error(erreur);
  process.exitCode = 1;
});
