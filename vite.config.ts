import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VitePWA } from 'vite-plugin-pwa';
import jeu from './data/jeu.json';
import { lireJetons } from './scripts/lire-jetons.mjs';
import { construireManifeste } from './scripts/manifeste.mjs';

const jetons = lireJetons();

// Les images lourdes entrent dans un cache « d'abord le cache » : son nom suit leur contenu, sinon un décor remplacé
// garde le même nom de fichier et l'ancien reste affiché pour toujours chez les joueurs qui l'ont déjà vu.
const DOSSIERS_LOURDS = ['decors', 'artworks', 'animes', 'sprites/dresseur', 'sprites/pokemon-shiny', 'easter-eggs', 'fin'];
function fichiers(dossier: string): string[] {
  if (!existsSync(dossier)) return [];
  return readdirSync(dossier, { withFileTypes: true }).flatMap(e => e.isDirectory() ? fichiers(join(dossier, e.name)) : [join(dossier, e.name)]).sort();
}
const empreinte = createHash('sha1');
for (const dossier of DOSSIERS_LOURDS) for (const fichier of fichiers(join('public/img', dossier))) empreinte.update(fichier).update(readFileSync(fichier));
const CACHE_IMAGES = `images-lourdes-${empreinte.digest('hex').slice(0, 10)}`;

export default defineConfig(({ command, mode, isPreview }) => ({
  define: { __CACHE_IMAGES__: JSON.stringify(CACHE_IMAGES) },
  resolve: {
    alias: mode === 'test' || (command === 'serve' && !isPreview)
      ? [{ find: 'virtual:pwa-register/react', replacement: fileURLToPath(new URL('./src/pwa/registre-double.ts', import.meta.url)) }]
      : [],
  },
  plugins: [react(), tailwindcss(), {
    name: 'metadonnees-jeu',
    transformIndexHtml: html => ({ html: html.replace('%NOM_JEU%', jeu.nom), tags: [
      { tag: 'meta', attrs: { name: 'theme-color', content: jetons.fond } },
      { tag: 'meta', attrs: { name: 'description', content: jeu.description } },
      { tag: 'meta', attrs: { name: 'apple-mobile-web-app-title', content: jeu.nomCourt } },
    ] }),
  }, VitePWA({
    registerType: 'prompt', strategies: 'generateSW',
    manifestFilename: 'manifest.webmanifest',
    manifest: construireManifeste({ jeu, jetons }),
    workbox: {
      globPatterns: ['**/*.{js,css,html,webp,png,woff,woff2,json,webmanifest}'],
      // Les décors (≈ 170 ko pièce), artworks et animations lourds ne sont pas préchargés à l'installation :
      // ils entrent dans le cache à leur première vue. Seul le décor de départ (Route 1) est préchargé.
      globIgnores: ['**/img/decors/!(route-1).webp', '**/img/artworks/**', '**/img/animes/**', '**/img/sprites/dresseur/**', '**/img/sprites/pokemon-shiny/**', '**/img/easter-eggs/**', '**/img/fin/**'],
      runtimeCaching: [{
        urlPattern: ({ url }: { url: URL }) => /\/img\/(decors|artworks|animes|sprites\/dresseur|sprites\/pokemon-shiny|easter-eggs|fin)\//.test(url.pathname),
        handler: 'CacheFirst',
        // « no-cache » : le service worker revalide auprès du serveur au lieu de relire le cache HTTP du navigateur.
        options: { cacheName: CACHE_IMAGES, cacheableResponse: { statuses: [200] }, fetchOptions: { cache: 'no-cache' } },
      }],
      navigateFallback: 'index.html', cleanupOutdatedCaches: true,
    },
    devOptions: { enabled: false },
  })],
  test: {
    environment: 'node',
    // Les tests d'ESLint et d'encodage d'images (sharp) dépassent 5 s quand les tests tournent en parallèle.
    testTimeout: 30000,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'tests/**/*.test.ts'],
  },
}));
