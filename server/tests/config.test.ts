import { expect, test } from 'vitest';
import { readConfig } from '../src/config.js';

const env = { NODE_ENV: 'production', DATABASE_URL: 'postgres://localhost/test',
  BETTER_AUTH_SECRET: 'Aj2k4L6m8N0pQrStUvWxYz13579BDFHJLNPRTVXZ2468aceg',
  BETTER_AUTH_URL: 'https://api.example.test', CORS_ORIGINS: 'https://jeu.example.test',
  SMTP_URL: 'smtps://smtp.example.test', MAIL_FROM: 'comptes@example.test', TRUSTED_PROXIES: 'none' };

test('proxys absents : avertissement ; none explicite : aucun', () => {
  expect(readConfig({ ...env, TRUSTED_PROXIES: '' }).avertissements).toContainEqual(expect.stringContaining('TRUSTED_PROXIES'));
  expect(readConfig(env).avertissements).toEqual([]);
  expect(readConfig(env).trustedProxies).toEqual([]);
});

test('secrets exemples refusés sans divulgation', () => {
  for (const secret of [undefined, '', 'court']) {
    expect(() => readConfig({ ...env, BETTER_AUTH_SECRET: secret })).toThrow(/BETTER_AUTH_SECRET/);
  }
  for (const mot of ['factice', 'EXEMPLE', 'example', 'ChangeMe', 'secret-local']) {
    const secret = 'A'.repeat(48) + mot;
    expect(() => readConfig({ ...env, BETTER_AUTH_SECRET: secret })).toThrow(/BETTER_AUTH_SECRET/);
    try { readConfig({ ...env, BETTER_AUTH_SECRET: secret }); }
    catch (error) { expect(String(error)).not.toContain(secret); }
  }
  expect(readConfig(env).secret).toBe(env.BETTER_AUTH_SECRET);
});

test('bases publiques : TLS explicite, disable avertit ; mêmes règles de migration', () => {
  for (const key of ['DATABASE_URL', 'DATABASE_MIGRATION_URL']) {
    expect(() => readConfig({ ...env, [key]: 'postgres://db.example.net/test' })).toThrow(/sslmode/);
    for (const param of ['sslmode=require', 'sslmode=verify-full', 'ssl=true']) {
      expect(() => readConfig({ ...env, [key]: `postgres://db.example.net/test?${param}` })).not.toThrow();
    }
    expect(readConfig({ ...env, [key]: 'postgres://db.example.net/test?sslmode=disable' }).avertissements)
      .toContainEqual(expect.stringContaining('TLS'));
  }
});

test('bases privées et rôle propriétaire optionnel', () => {
  for (const host of ['postgres', 'localhost', '10.0.0.1', '172.16.0.1', '172.31.0.1', '192.168.1.1', '127.0.0.1', 'db.internal', 'db.local']) {
    expect(() => readConfig({ ...env, DATABASE_URL: `postgres://${host}/test` })).not.toThrow();
  }
  expect(() => readConfig({ ...env, DATABASE_URL: 'postgres://172.32.0.1/test' })).toThrow(/sslmode/);
  expect(readConfig(env).migrationURL).toBe(readConfig(env).databaseURL);
  expect(readConfig({ ...env, DATABASE_MIGRATION_URL: 'postgres://owner@localhost/test' }).migrationURL).toContain('owner@');
});

test('variables numériques vides : valeurs par défaut, bornes conservées', () => {
  const config = readConfig({ ...env, PORT: '', SMTP_PORT: '', AUTH_RATE_MAX: '', AUTH_RATE_WINDOW: '' });
  expect([config.port, config.smtpPort, config.rateMax, config.rateWindow]).toEqual([3000, 587, 5, 60]);
  expect(readConfig({ ...env, SMTP_URL: '', SMTP_HOST: 'smtp.local', SMTP_USER: 'user', SMTP_PASS: 'pass', SMTP_PORT: '' }).smtpPort).toBe(587);
  expect(() => readConfig({ ...env, PORT: '0' })).toThrow(/PORT/);
});
