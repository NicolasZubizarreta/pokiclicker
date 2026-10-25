import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'centre.spec.ts',
  outputDir: '../../captures/u-resultats',
  reporter: 'list',
  use: { browserName: 'chromium' },
});
