import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'fin-maquettes.spec.ts',
  outputDir: '../design/captures/x-resultats',
  use: { browserName: 'chromium', headless: true },
});
