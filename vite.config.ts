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
