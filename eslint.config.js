import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: ['dist/**', 'legacy/**', 'node_modules/**', 'design/**', 'docs/**'],
  },
  tseslint.configs.recommended,
  {
    files: ['src/ui/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    files: ['eslint.config.js', 'vite.config.ts', 'playwright.config.ts', 'scripts/**/*.{js,mjs,ts}', 'tests/**/*.ts', 'tests-e2e/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['src/core/**'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: ['react', 'react-dom', 'zustand'].map((name) => ({
          name,
          message: 'Le cœur du jeu doit rester pur : pas de React ici.',
        })),
        patterns: [{
          group: ['react/*', 'react-dom/*', 'zustand/*'],
          message: 'Le cœur du jeu doit rester pur : pas de React ici.',
        }],
      }],
      'no-restricted-globals': ['error',
        ...['window', 'document', 'localStorage', 'sessionStorage', 'navigator', 'fetch', 'XMLHttpRequest'].map((name) => ({
          name,
          message: 'Le cœur du jeu doit rester pur : aucun accès au navigateur ici.',
        })),
      ],
    },
  },
);
