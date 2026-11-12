import { defineConfig, devices } from '@playwright/test';

// Le projet « iphone » tourne sur WebKit (le moteur de Safari iOS) : `npx playwright install webkit` (outil de dev seulement).
const sansWebkit = ['**/pwa.spec.ts', '**/hors-connexion.spec.ts', '**/compte.spec.ts', '**/fenetres-iphone.spec.ts'];

export default defineConfig({
  testDir: './tests-e2e',
  workers: 1,
  timeout: 120_000,
  retries: 0,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4173', browserName: 'chromium', trace: 'retain-on-failure', serviceWorkers: 'block' },
  projects: [
    { name: 'mobile', testIgnore: sansWebkit, use: { storageState: 'tests-e2e/etat-equipe-de-depart.json', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: 'pc', testIgnore: sansWebkit, use: { storageState: 'tests-e2e/etat-equipe-de-depart.json', viewport: { width: 1440, height: 900 } } },
    { name: 'pwa', testMatch: '**/pwa.spec.ts', use: { storageState: 'tests-e2e/etat-equipe-de-depart.json', serviceWorkers: 'allow', viewport: { width: 390, height: 844 } } },
    { name: 'iphone', testMatch: ['**/fenetres-iphone.spec.ts', '**/pension-visibilite.spec.ts'], use: { ...devices['iPhone 15'], browserName: 'webkit', storageState: 'tests-e2e/etat-equipe-de-depart.json' } },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
