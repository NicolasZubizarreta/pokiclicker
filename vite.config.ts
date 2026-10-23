import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node',
    // Les tests d'ESLint et d'encodage d'images (sharp) dépassent 5 s quand les tests tournent en parallèle.
    testTimeout: 30000,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'tests/**/*.test.ts'],
  },
});
