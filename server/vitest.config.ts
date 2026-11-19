import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['tests/**/*.test.ts'], testTimeout: 30000, hookTimeout: 120000, fileParallelism: false,
  coverage: { provider: 'v8', include: ['src/**/*.ts'], reporter: ['text-summary', 'text'] } } });
