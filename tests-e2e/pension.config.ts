import { defineConfig } from '@playwright/test';

// Exécution du lot T6 sans démarrer de serveur : le spec fournit le build au navigateur.
export default defineConfig({
  testDir: '.', testMatch: 'pension.spec.ts', workers: 1,
  use: { baseURL: 'http://localhost:4179', browserName: 'chromium', serviceWorkers: 'block' },
});
