import { defineConfig } from '@playwright/test';

// Build local intercepté par centre.spec.ts : aucun serveur.
process.env.CENTRE_SANS_SERVEUR = '1';
export default defineConfig({
  testDir: '.', testMatch: 'centre.spec.ts',
  use: { baseURL: 'http://localhost', serviceWorkers: 'block' },
  projects: [
    { name: 'mobile', use: { viewport: { width: 390, height: 844 } } },
    { name: 'bureau', use: { viewport: { width: 1440, height: 900 } } },
  ],
});
