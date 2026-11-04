import { afterAll, beforeAll, expect, test } from 'vitest';
import EmbeddedPostgres from 'embedded-postgres';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { Pool } from 'pg';
import { getMigrations } from 'better-auth/db/migration';
import { createApp, type ResetMail } from '../src/app.js';
import { readConfig } from '../src/config.js';

let embedded: EmbeddedPostgres | undefined;
let directory: string | undefined;
let pool: Pool;
let runtime: ReturnType<typeof createApp>;
const mails: ResetMail[] = [];
const origin = 'http://localhost:5173';
const schema = `test_${randomUUID().replaceAll('-', '')}`;
const password = 'MotDePasse123!';
let ip = 0;

beforeAll(async () => {
  let connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    const socket = createServer();
    await new Promise<void>(resolve => socket.listen(0, '127.0.0.1', resolve));
    const address = socket.address();
    if (!address || typeof address === 'string') throw new Error('Port local indisponible.');
    const port = address.port;
    await new Promise<void>((resolve, reject) => socket.close(error => error ? reject(error) : resolve()));
    directory = await mkdtemp(join(tmpdir(), 'pokiclicker-postgres-'));
    embedded = new EmbeddedPostgres({ databaseDir: directory, port, user: 'postgres',
      password: 'test-local-factice', persistent: false, onLog: () => {}, onError: () => {} });
    if (process.platform === 'win32') {
      // taskkill peut rester bloqué dans le bac à sable ; arrêt natif et gracieux.
      const { pg_ctl } = await import('@embedded-postgres/windows-x64');
      const clusterDirectory = directory;
      let stopped = false;
      embedded.stop = async () => {
        if (stopped) return;
        await promisify(execFile)(pg_ctl, ['-D', clusterDirectory, '-m', 'fast', '-w', '-t', '15', 'stop'], { windowsHide: true });
        stopped = true;
      };
    }
    await embedded.initialise();
    await embedded.start();
    connectionString = `postgresql://postgres:test-local-factice@localhost:${port}/postgres`;
  }
  const admin = new Pool({ connectionString });
  try { await admin.query(`CREATE SCHEMA "${schema}"`); } finally { await admin.end(); }
  pool = new Pool({ connectionString, options: `-c search_path=${schema}` });
  const config = readConfig({ NODE_ENV: 'test', DATABASE_URL: connectionString,
    BETTER_AUTH_SECRET: 'test-seulement-secret-long-et-factice-123456',
    BETTER_AUTH_URL: 'http://localhost:3000', CORS_ORIGINS: origin });
  runtime = createApp(config, pool, async mail => { mails.push(mail); });
  await (await getMigrations(runtime.auth.options)).runMigrations();
});

afterAll(async () => {
  if (pool) {
    try { await pool.query(`DROP SCHEMA "${schema}" CASCADE`); } finally { await pool.end(); }
  }
  if (embedded) await embedded.stop();
  if (directory) await rm(directory, { recursive: true, force: true });
});

function request(path: string, body?: object, token?: string, client = `192.0.2.${++ip}`) {
  return runtime.app.request(`http://localhost:3000${path}`, {
    method: body ? 'POST' : 'GET', headers: { origin, 'content-type': 'application/json',
      'x-forwarded-for': client, ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
}
async function signup(pass = password) {
  const email = `${randomUUID()}@example.test`;
  const response = await request('/api/auth/sign-up/email', { name: 'Joueur', email, password: pass });
  return { email, response, token: response.headers.get('set-auth-token')! };
}
async function reset(email: string) {
  const response = await request('/api/auth/request-password-reset', { email, redirectTo: `${origin}/reset` });
  expect(response.status).toBe(200);
  const mail = mails.at(-1)!;
  expect(mail.to).toBe(email);
  return new URL(mail.url).pathname.split('/').at(-1)!;
}

test('1. santé avec la base et en-têtes de sécurité', async () => {
  const response = await request('/health');
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ ok: true });
  expect(response.headers.get('x-content-type-options')).toBe('nosniff');
  expect(response.headers.get('referrer-policy')).toBe('no-referrer');
});
test('2. inscription puis session bearer', async () => {
  const { response, token } = await signup();
  expect(response.status).toBe(200);
  expect(token).toBeTruthy();
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(response.headers.get('access-control-expose-headers')).toContain('set-auth-token');
  const session = await request('/api/auth/get-session', undefined, token);
  expect(session.status).toBe(200);
  expect(await session.json()).toHaveProperty('user');
});
test('3. neuf caractères refusés, dix acceptés', async () => {
  expect((await signup('123456789')).response.status).toBe(400);
  expect((await signup('1234567890')).response.status).toBe(200);
});
test('4. doublon refusé et connexion sans divulgation de compte', async () => {
  const { email } = await signup();
  expect((await request('/api/auth/sign-up/email', { name: 'Joueur', email, password })).ok).toBe(false);
  const wrong = await request('/api/auth/sign-in/email', { email, password: 'incorrect123' });
  const unknown = await request('/api/auth/sign-in/email', { email: 'absent@example.test', password: 'incorrect123' });
  expect(wrong.status).toBe(401);
  expect(unknown.status).toBe(wrong.status);
  expect(await unknown.json()).toEqual(await wrong.json());
});
test('5. déconnexion invalide le jeton', async () => {
  const { token } = await signup();
  expect((await request('/api/auth/sign-out', {}, token)).status).toBe(200);
  expect(await (await request('/api/auth/get-session', undefined, token)).json()).toBeNull();
});
test('6. réinitialisation, usage unique et expiration', async () => {
  const { email } = await signup();
  const token = await reset(email);
  const body = { token, newPassword: 'NouveauMotDePasse123!' };
  expect((await request('/api/auth/reset-password', body)).status).toBe(200);
  expect((await request('/api/auth/reset-password', body)).ok).toBe(false);
  expect((await request('/api/auth/sign-in/email', { email, password })).status).toBe(401);
  expect((await request('/api/auth/sign-in/email', { email, password: body.newPassword })).status).toBe(200);
  await reset(email);
  await pool.query('UPDATE verification SET "expiresAt" = NOW() - INTERVAL \'1 hour\'');
  const expired = new URL(mails.at(-1)!.url).pathname.split('/').at(-1)!;
  expect((await request('/api/auth/reset-password', { token: expired, newPassword: password })).ok).toBe(false);
});
test('6b. le lien reçu par e-mail redirige vers le jeu avec le jeton', async () => {
  const { email } = await signup();
  const resetToken = await reset(email);
  const link = new URL(mails.at(-1)!.url);
  const response = await request(link.pathname + link.search);
  expect(response.status).toBe(302);
  const location = new URL(response.headers.get('location')!);
  expect(location.origin).toBe(origin);
  expect(location.searchParams.get('token')).toBe(resetToken);
  const invalid = await request(`/api/auth/reset-password/invalide?callbackURL=${encodeURIComponent(origin)}`);
  expect(invalid.status).toBe(302);
  expect(new URL(invalid.headers.get('location')!).searchParams.get('error')).toBe('INVALID_TOKEN');
});
test('7. réinitialisation invalide toutes les sessions existantes', async () => {
  const { email, token } = await signup();
  const second = (await request('/api/auth/sign-in/email', { email, password })).headers.get('set-auth-token')!;
  const resetToken = await reset(email);
  expect((await request('/api/auth/reset-password', { token: resetToken, newPassword: 'EncoreUnMotDePasse123!' })).status).toBe(200);
  for (const session of [token, second]) {
    expect(await (await request('/api/auth/get-session', undefined, session)).json()).toBeNull();
  }
});
test('8. sixième tentative bloquée, compteur en base', async () => {
  for (let attempt = 0; attempt < 5; attempt++) {
    expect((await request('/api/auth/sign-in/email', { email: 'absent@example.test', password }, undefined, '198.51.100.1')).status).toBe(401);
  }
  expect((await request('/api/auth/sign-in/email', { email: 'absent@example.test', password }, undefined, '198.51.100.1')).status).toBe(429);
  expect(Number((await pool.query('SELECT count(*) FROM "rateLimit"')).rows[0].count)).toBeGreaterThan(0);
});
test('8b. derrière un proxy de confiance, la limite porte sur le vrai client', async () => {
  const config = readConfig({ NODE_ENV: 'test', DATABASE_URL: 'postgres://localhost/test',
    BETTER_AUTH_SECRET: 'test-seulement-secret-long-et-factice-123456',
    BETTER_AUTH_URL: 'http://localhost:3000', CORS_ORIGINS: origin, TRUSTED_PROXIES: '10.0.0.0/8' });
  const proxied = createApp(config, pool, async () => {});
  const attempt = (client: string) => proxied.app.request('http://localhost:3000/api/auth/sign-in/email', {
    method: 'POST', headers: { origin, 'content-type': 'application/json', 'x-forwarded-for': client },
    body: JSON.stringify({ email: 'absent@example.test', password }) });
  for (let i = 0; i < 5; i++) expect((await attempt('203.0.113.5, 10.0.0.2')).status).toBe(401);
  expect((await attempt('203.0.113.5, 10.0.0.2')).status).toBe(429);
  expect((await attempt('203.0.113.6, 10.0.0.2')).status).toBe(401);
});
test('9. CORS limité aux origines autorisées', async () => {
  expect((await request('/health')).headers.get('access-control-allow-origin')).toBe(origin);
  const response = await runtime.app.request('/health', { headers: { origin: 'https://interdit.example' } });
  expect(response.headers.get('access-control-allow-origin')).toBeNull();
  const preflight = await runtime.app.request('/api/auth/sign-in/email', { method: 'OPTIONS', headers: {
    origin, 'access-control-request-method': 'POST', 'access-control-request-headers': 'Authorization,Content-Type',
  } });
  expect(preflight.headers.get('access-control-allow-headers')).toContain('Authorization');
});
test('10. production : secret et SMTP obligatoires', () => {
  for (const secret of [undefined, 'court']) {
    expect(() => readConfig({ NODE_ENV: 'production', BETTER_AUTH_SECRET: secret })).toThrow(/BETTER_AUTH_SECRET/);
  }
  expect(() => readConfig({ NODE_ENV: 'production', BETTER_AUTH_SECRET: 'x'.repeat(32),
    DATABASE_URL: 'postgres://localhost/test', BETTER_AUTH_URL: 'https://api.example.test', CORS_ORIGINS: origin })).toThrow(/SMTP/);
});
