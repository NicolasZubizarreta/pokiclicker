import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { VitePWA } from 'vite-plugin-pwa';
import jeu from './data/jeu.json';
import { lireJetons } from './scripts/lire-jetons.mjs';
import { construireManifeste } from './scripts/manifeste.mjs';

const jetons = lireJetons();

export default defineConfig(({ command, mode, isPreview }) => ({
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
      globIgnores: ['**/img/decors/!(route-1).webp', '**/img/scenes/pantheon.webp', '**/img/artworks/**', '**/img/animes/**', '**/img/sprites/dresseur/**', '**/img/easter-eggs/**', '**/img/fin/**'],
      runtimeCaching: [{
        urlPattern: ({ url }: { url: URL }) => /\/img\/(decors|artworks|animes|sprites\/dresseur|easter-eggs|fin)\//.test(url.pathname),
        handler: 'CacheFirst',
        options: { cacheName: 'images-lourdes', cacheableResponse: { statuses: [200] } },
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
