import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ query: vi.fn(), release: vi.fn(), end: vi.fn(),
  runMigrations: vi.fn(), migrerSauvegarde: vi.fn() }));
vi.mock('pg', () => ({ Pool: class {
  async connect() { return { query: mocks.query, release: mocks.release }; }
  end = mocks.end;
} }));
vi.mock('better-auth/db/migration', () => ({ getMigrations: async () => ({ runMigrations: mocks.runMigrations }) }));
vi.mock('../src/schema.js', () => ({ migrerSauvegarde: mocks.migrerSauvegarde }));
vi.mock('../src/app.js', () => ({ createApp: () => ({ auth: { options: {} } }) }));

let exitCode: typeof process.exitCode;
beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  exitCode = process.exitCode;
  process.exitCode = undefined;
  for (const cle of ['DATABASE_MIGRATION_URL', 'SMTP_HOST', 'SMTP_USER', 'SMTP_PASS',
    'PORT', 'SMTP_PORT', 'AUTH_RATE_MAX', 'AUTH_RATE_WINDOW']) vi.stubEnv(cle, undefined);
  for (const [cle, valeur] of Object.entries({ NODE_ENV: 'test', DATABASE_URL: 'postgres://localhost/test',
    BETTER_AUTH_SECRET: 'Aj2k4L6m8N0pQrStUvWxYz13579BDFHJLNPRTVXZ2468aceg',
    BETTER_AUTH_URL: 'https://api.example.test', CORS_ORIGINS: 'https://jeu.example.test',
    SMTP_URL: 'smtps://smtp.example.test', MAIL_FROM: 'comptes@example.test', TRUSTED_PROXIES: 'none' })) {
    vi.stubEnv(cle, valeur);
  }
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  process.exitCode = exitCode;
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

test('migration : verrou, migrations dans l’ordre et fermeture', async () => {
  await import('../src/migrate.js');
  expect(mocks.query.mock.calls).toEqual([
    ['select pg_advisory_lock(7241)'], ['select pg_advisory_unlock(7241)'],
  ]);
  expect(mocks.runMigrations).toHaveBeenCalledOnce();
  expect(mocks.migrerSauvegarde).toHaveBeenCalledOnce();
  expect(mocks.query.mock.invocationCallOrder[0]).toBeLessThan(mocks.runMigrations.mock.invocationCallOrder[0]!);
  expect(mocks.runMigrations.mock.invocationCallOrder[0]).toBeLessThan(mocks.migrerSauvegarde.mock.invocationCallOrder[0]!);
  expect(mocks.migrerSauvegarde.mock.invocationCallOrder[0]).toBeLessThan(mocks.query.mock.invocationCallOrder[1]!);
  expect(mocks.release).toHaveBeenCalledOnce();
  expect(mocks.end).toHaveBeenCalledOnce();
  expect(process.exitCode).toBeUndefined();
});

test('migration échouée : verrou libéré et fermeture', async () => {
  mocks.runMigrations.mockRejectedValueOnce(new Error('Migration impossible.'));
  await import('../src/migrate.js');
  expect(mocks.query.mock.calls).toEqual([
    ['select pg_advisory_lock(7241)'], ['select pg_advisory_unlock(7241)'],
  ]);
  expect(mocks.runMigrations).toHaveBeenCalledOnce();
  expect(mocks.migrerSauvegarde).not.toHaveBeenCalled();
  expect(mocks.release).toHaveBeenCalledOnce();
  expect(mocks.end).toHaveBeenCalledOnce();
  expect(process.exitCode).toBe(1);
});
