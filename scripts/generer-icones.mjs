import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { lireJetons } from './lire-jetons.mjs';

// Icônes provisoires : les vraies icônes viendront en phase 5.
/** @param {string} [dossier] */
export async function genererIcones(dossier = fileURLToPath(new URL('../public/icons', import.meta.url))) {
  const { fond, action, texte, accent } = lireJetons();
  // Le motif entier tient dans le cercle central de sécurité (diamètre 80 %).
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <rect width="512" height="512" fill="${fond}"/>
    <circle cx="256" cy="256" r="174" fill="${texte}"/>
    <path d="M82 256a174 174 0 0 1 348 0Z" fill="${action}"/>
    <circle cx="256" cy="256" r="174" fill="none" stroke="${accent}" stroke-width="20"/>
    <path d="M82 256h348" stroke="${fond}" stroke-width="28"/>
    <circle cx="256" cy="256" r="52" fill="${texte}" stroke="${fond}" stroke-width="24"/>
  </svg>`);
  await mkdir(dossier, { recursive: true });
  for (const [nom, taille] of /** @type {[string, number][]} */ ([
    ['icon-192.png', 192], ['icon-512.png', 512], ['icon-maskable-512.png', 512],
    ['apple-touch-icon.png', 180], ['favicon.png', 32],
  ])) {
    await sharp(svg).resize(taille, taille).removeAlpha().png().toFile(resolve(dossier, nom));
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await genererIcones(process.argv[2]);
}
