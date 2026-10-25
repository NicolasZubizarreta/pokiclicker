import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests-e2e',
  workers: 1,
  timeout: 120_000,
  retries: 0,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4173', browserName: 'chromium', trace: 'retain-on-failure', serviceWorkers: 'block' },
  projects: [
    { name: 'mobile', testIgnore: '**/pwa.spec.ts', use: { storageState: 'tests-e2e/etat-equipe-de-depart.json', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: 'pc', testIgnore: '**/pwa.spec.ts', use: { storageState: 'tests-e2e/etat-equipe-de-depart.json', viewport: { width: 1440, height: 900 } } },
    { name: 'pwa', testMatch: '**/pwa.spec.ts', use: { storageState: 'tests-e2e/etat-equipe-de-depart.json', serviceWorkers: 'allow', viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
