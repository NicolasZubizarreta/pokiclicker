import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { enregistrerTailleImage } from './manifeste.mjs';

// Easter egg Bjorn (14/11) : Bjorn1.png, Bjorn2.png, Bjorn3.png de Nicolas, un par stade d'évolution.
// Usage : node scripts/preparer-bjorn.mjs [dossier des PNG] (défaut : Documents/PERSO/RessourcesPokiClicker).
const racine = new URL('../', import.meta.url);
const sources = process.argv[2] ?? fileURLToPath(new URL('../../RessourcesPokiClicker/', import.meta.url));
const TAILLE = 288;
const MARGE = 10;

await mkdir(new URL('public/img/easter-eggs/', racine), { recursive: true });
for (const stade of [1, 2, 3]) {
  const chemin = `img/easter-eggs/bjorn-stade-${stade}.webp`;
  // Le dessin entier tient dans le carré avec une marge de tous les côtés : rien n'est coupé, ni en haut, ni en bas, ni sur les côtés.
  const dessin = await sharp(`${sources}/Bjorn${stade}.png`)
    .resize(TAILLE - 2 * MARGE, TAILLE - 2 * MARGE, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ bottom: MARGE, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  await sharp({ create: { width: TAILLE, height: TAILLE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: dessin, gravity: 'south' }])
    .webp({ quality: 80 })
    .toFile(fileURLToPath(new URL(`public/${chemin}`, racine)));
  await enregistrerTailleImage(chemin, TAILLE, TAILLE);
}
console.log('Easter egg Bjorn : trois images préparées (288 × 288).');
