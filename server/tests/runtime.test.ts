import { afterEach, expect, test, vi } from 'vitest';
import type { Pool } from 'pg';
import nodemailer from 'nodemailer';
import { createApp } from '../src/app.js';
import { readConfig } from '../src/config.js';
import { avecEssais, creerEnvoi, creerTransport } from '../src/mail.js';
import { journal } from '../src/journal.js';

const { handler } = vi.hoisted(() => ({ handler: vi.fn() }));
vi.mock('better-auth', () => ({ betterAuth: (options: unknown) => ({ handler, options }) }));
const env = { NODE_ENV: 'test', DATABASE_URL: 'postgres://localhost/test',
  BETTER_AUTH_SECRET: 'Aj2k4L6m8N0pQrStUvWxYz13579BDFHJLNPRTVXZ2468aceg',
  BETTER_AUTH_URL: 'https://api.example.test', CORS_ORIGINS: 'https://jeu.example.test',
  SMTP_URL: 'smtps://smtp.example.test', MAIL_FROM: 'comptes@example.test', TRUSTED_PROXIES: 'none' };
const pool = { query: vi.fn().mockResolvedValue({ rows: [] }) } as unknown as Pool;
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

test('journal JSON horodaté et niveau erreur', () => {
  const info = vi.spyOn(console, 'info').mockImplementation(() => {});
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  journal('essai', { rid: 'abc' });
  expect(JSON.parse(info.mock.calls[0]![0])).toMatchObject({ evt: 'essai', rid: 'abc', t: expect.any(String) });
  journal('echec', { niveau: 'erreur' });
  expect(error).toHaveBeenCalledOnce();
});

test('en-têtes sur santé, refus et erreurs ; HSTS seulement en production', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'info').mockImplementation(() => {});
  for (const mode of ['production', 'test']) {
    const { app } = createApp(readConfig({ ...env, NODE_ENV: mode }), pool);
    handler.mockImplementation(() => { throw new Error('Erreur contrôlée.'); });
    for (const path of ['/health', '/introuvable', '/api/auth/get-session']) {
      const response = await app.request(path);
      expect(response.headers.get('content-security-policy')).toBe("default-src 'none'; frame-ancestors 'none'");
      expect(response.headers.get('cross-origin-resource-policy')).toBe('same-site');
      expect(response.headers.get('permissions-policy')).toBe('camera=(), microphone=(), geolocation=()');
      expect(response.headers.get('cross-origin-opener-policy')).toBe('same-origin');
      expect(response.headers.get('strict-transport-security')).toBe(mode === 'production' ? 'max-age=31536000; includeSubDomains' : null);
    }
  }
});

test('refus et actions auth : corrélation sans corps ni query string', async () => {
  const info = vi.spyOn(console, 'info').mockImplementation(() => {});
  const { app } = createApp(readConfig(env), pool);
  for (const [path, status, action] of [
    ['sign-in/email', 401, 'connexion-echec'], ['sign-up/email', 200, 'inscription'],
    ['request-password-reset', 200, 'demande-reinitialisation'], ['reset-password', 200, 'reinitialisation'],
    ['delete-user', 200, 'suppression-compte'],
  ] as const) {
    handler.mockResolvedValue(new Response('{}', { status, headers: { 'content-type': 'application/json', 'content-length': '2', 'content-encoding': 'gzip' } }));
    const response = await app.request(`/api/auth/${path}?token=confidentiel`, { method: 'POST', body: '{}' });
    const rid = response.headers.get('x-request-id');
    expect(rid).toMatch(/^[a-f0-9-]{36}$/);
    const lignes = info.mock.calls.map(([line]) => JSON.parse(line));
    expect(lignes).toContainEqual(expect.objectContaining({ evt: 'auth', action, statut: status, rid }));
    if (status === 401) expect(lignes).toContainEqual({ evt: 'http-refus', t: expect.any(String), rid, methode: 'POST', chemin: `/api/auth/${path}`, statut: status });
    if (status >= 400 || path === 'request-password-reset') {
      expect(response.headers.has('content-length')).toBe(false);
      expect(response.headers.has('content-encoding')).toBe(false);
    }
  }
  for (const status of [403, 429]) {
    handler.mockResolvedValue(new Response('{}', { status }));
    await app.request('/api/auth/reset-password/prive?token=confidentiel');
    expect(JSON.parse(info.mock.calls.at(-1)![0])).toMatchObject({ evt: 'http-refus', statut: status, chemin: '/api/auth/reset-password/:token' });
  }
  expect(JSON.stringify(info.mock.calls)).not.toMatch(/confidentiel|prive/);
});

test('erreur HTTP et tâche de fond : message nettoyé, tâche non bloquante', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  const { app, auth } = createApp(readConfig(env), pool);
  handler.mockRejectedValue(new Error('Échec pour personne@example.test'));
  const response = await app.request('/api/auth/get-session?token=prive');
  expect(response.status).toBe(500);
  expect(JSON.parse(error.mock.calls[0]![0])).toMatchObject({ evt: 'http-erreur', rid: response.headers.get('x-request-id'), methode: 'GET', chemin: '/api/auth/get-session', message: 'Échec pour [adresse]' });
  const handlerFond = auth.options.advanced!.backgroundTasks!.handler;
  expect(handlerFond(new Promise(() => {}))).toBeUndefined();
  handlerFond(Promise.reject(new Error('SMTP personne@example.test')));
  await Promise.resolve();
  expect(JSON.parse(error.mock.calls.at(-1)![0])).toMatchObject({ evt: 'tache-fond-echec', message: 'SMTP [adresse]' });
});

test('SMTP production : STARTTLS ou TLS direct, certificat validé', () => {
  const config = readConfig({ ...env, NODE_ENV: 'production' });
  for (const port of [587, 465]) {
    const options = creerTransport({ ...config, smtpURL: undefined, smtpHost: 'smtp.local', smtpPort: port })!.options as { requireTLS: boolean; secure: boolean; tls: { rejectUnauthorized: boolean } };
    expect(options.requireTLS).toBe(port !== 465);
    expect(options.secure).toBe(port === 465);
    expect(options.tls.rejectUnauthorized).toBe(true);
  }
  for (const url of ['smtp://smtp.local:587', 'smtps://smtp.local:465', 'smtp://smtp.local:465']) {
    const options = creerTransport({ ...config, smtpURL: url })!.options as { requireTLS: boolean; secure: boolean; tls: { rejectUnauthorized: boolean } };
    expect(options.requireTLS).toBe(url.endsWith(':587'));
    expect(options.secure).toBe(url.endsWith(':465'));
    expect(options.tls.rejectUnauthorized).toBe(true);
  }
});

test('essais : reprise puis succès, et abandon après trois tentatives', async () => {
  const fn = vi.fn().mockRejectedValueOnce(new Error('indisponible')).mockResolvedValue('ok');
  expect(await avecEssais(fn, [0, 0])).toBe('ok');
  expect(fn).toHaveBeenCalledTimes(2);
  const echec = vi.fn().mockRejectedValue(new Error('indisponible'));
  await expect(avecEssais(echec, [0, 0])).rejects.toThrow('indisponible');
  expect(echec).toHaveBeenCalledTimes(3);
});

test('session : 30 jours glissants, renouvelée à l’usage', () => {
  const { auth } = createApp(readConfig(env), pool);
  expect(auth.options.session).toEqual({ expiresIn: 30 * 24 * 3600, updateAge: 24 * 3600 });
  expect(auth.options.emailAndPassword).toMatchObject({ revokeSessionsOnPasswordReset: true });
});

test('SMTP : trois envois puis journal nettoyé ; injection appelée une seule fois', async () => {
  vi.useFakeTimers();
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  const sendMail = vi.fn().mockRejectedValue(new Error('Refus personne@example.test'));
  vi.spyOn(nodemailer, 'createTransport').mockReturnValue({ sendMail } as unknown as ReturnType<typeof nodemailer.createTransport>);
  const resultat = expect(creerEnvoi(readConfig(env))({ to: 'personne@example.test', url: 'https://jeu.example.test/reset' })).rejects.toThrow('Impossible');
  await vi.runAllTimersAsync();
  await resultat;
  expect(sendMail).toHaveBeenCalledTimes(3);
  expect(JSON.parse(error.mock.calls[0]![0])).toMatchObject({ evt: 'smtp-echec', message: 'Refus [adresse]' });
  const mailer = vi.fn().mockRejectedValue(new Error('Injection'));
  const client = { query: vi.fn(async (sql: string) => ({ rows: sql.includes('count(*)') ? [{ count: '0' }] : [] })), release: vi.fn() };
  const { auth } = createApp(readConfig(env), { ...pool, query: pool.query, connect: async () => client } as unknown as Pool, mailer);
  await expect(auth.options.emailAndPassword!.sendResetPassword!({ user: { email: 'personne@example.test' } as never, url: 'https://jeu.example.test/reset', token: 'prive' })).rejects.toThrow('Injection');
  expect(mailer).toHaveBeenCalledOnce();
});
