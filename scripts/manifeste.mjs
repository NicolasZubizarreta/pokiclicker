import { readFile, writeFile } from 'node:fs/promises';

/** @param {string} chemin @param {number} largeur @param {number} hauteur */
export async function enregistrerTailleImage(chemin, largeur, hauteur) {
  const manifeste = new URL('../public/img/tailles.json', import.meta.url);
  const tailles = JSON.parse(await readFile(manifeste, 'utf8'));
  tailles[chemin] = { largeur, hauteur };
  await writeFile(manifeste, `${JSON.stringify(tailles, null, 2)}\n`);
}

/**
 * @param {{ jeu: { nom: string, nomCourt: string, description: string }, jetons: { fond: string } }} options
 * @returns {Partial<import('vite-plugin-pwa').ManifestOptions>}
 */
export function construireManifeste({ jeu, jetons }) {
  return {
    name: jeu.nom, short_name: jeu.nomCourt, description: jeu.description,
    lang: 'fr', start_url: '/', scope: '/', display: 'standalone', orientation: 'portrait',
    background_color: jetons.fond, theme_color: jetons.fond,
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
