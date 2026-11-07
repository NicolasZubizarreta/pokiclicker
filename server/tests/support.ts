import { afterAll, beforeAll } from 'vitest';
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
import { migrerSauvegarde } from '../src/schema.js';

export function support() {

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
  const client = await pool.connect();
  try { await migrerSauvegarde(client); } finally { client.release(); }
});

afterAll(async () => {
  if (pool) {
    try { await pool.query(`DROP SCHEMA "${schema}" CASCADE`); } finally { await pool.end(); }
  }
  if (embedded) await embedded.stop();
  if (directory) await rm(directory, { recursive: true, force: true });
});

const appareilParDefaut = '00000000-0000-4000-8000-00000000a001';
function request(path: string, body?: object, token?: string, client = `192.0.2.${++ip}`, method = body ? 'POST' : 'GET') {
  // Depuis le lot 8 le PUT d'une partie exige un appareil : les tests en fournissent un sauf s'ils portent la clé `appareilId` (même undefined).
  if (body && method === 'PUT' && path === '/api/sauvegarde' && ('partie' in body || 'regions' in body) && !('appareilId' in body)) {
    body = { ...body, appareilId: appareilParDefaut };
  }
  return runtime.app.request(`http://localhost:3000${path}`, {
    method, headers: { origin, 'content-type': 'application/json',
      'x-forwarded-for': client, ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
}
async function signup(pass = password) {
  const email = `${randomUUID()}@example.test`;
  const response = await request('/api/auth/sign-up/email', { name: 'Joueur', email, password: pass });
  return { email, response, token: response.headers.get('set-auth-token')! };
}

return { get pool() { return pool; }, get runtime() { return runtime; }, mails, origin, password, request, signup };
}
