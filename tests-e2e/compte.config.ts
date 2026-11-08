import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.', testMatch: ['compte.spec.ts', 'etats-pc-compte.spec.ts'], workers: 1, timeout: 30_000, retries: 0, reporter: 'list',
  use: { baseURL: 'http://localhost:4175', browserName: 'chromium', serviceWorkers: 'block', trace: 'retain-on-failure' },
  projects: [
    { name: 'telephone', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: 'bureau', use: { viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: 'npx vite build --outDir dist-compte --emptyOutDir && npx vite preview --outDir dist-compte --port 4175 --strictPort',
    cwd: '..', env: { VITE_API_URL: 'http://api.test' }, url: 'http://localhost:4175',
    reuseExistingServer: false, timeout: 180_000,
  },
});
