import { defineConfig } from '@playwright/test';

// Build à part, avec une adresse d'API fictive (http://api.test) interceptée par hors-connexion.spec.ts : aucun serveur réel.
export default defineConfig({
  testDir: '.', testMatch: 'hors-connexion.spec.ts',
  workers: 1,
  timeout: 120_000,
  retries: 0,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4174', browserName: 'chromium', serviceWorkers: 'allow' },
  projects: [
    { name: 'mobile', use: { viewport: { width: 390, height: 844 } } },
    { name: 'bureau', use: { viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: 'npx vite build --outDir dist-hc --emptyOutDir && npx vite preview --outDir dist-hc --port 4174 --strictPort',
    cwd: '..',
    env: { VITE_API_URL: 'http://api.test' },
    url: 'http://localhost:4174',
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
