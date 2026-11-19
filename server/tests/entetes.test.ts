import { afterEach, expect, test, vi } from 'vitest';
import type { Pool } from 'pg';
import { createApp } from '../src/app.js';
import { readConfig } from '../src/config.js';

vi.mock('better-auth', () => ({ betterAuth: (options: unknown) => ({ options }) }));
const env = { DATABASE_URL: 'postgres://localhost/test',
  BETTER_AUTH_SECRET: 'Aj2k4L6m8N0pQrStUvWxYz13579BDFHJLNPRTVXZ2468aceg',
  BETTER_AUTH_URL: 'https://api.example.test', CORS_ORIGINS: 'https://jeu.example.test',
  SMTP_URL: 'smtps://smtp.example.test', MAIL_FROM: 'comptes@example.test', TRUSTED_PROXIES: 'none' };

afterEach(() => { vi.restoreAllMocks(); });

test.each(['production', 'test'])('en-têtes de santé en %s', async mode => {
  vi.spyOn(console, 'info').mockImplementation(() => {});
  const pool = { query: vi.fn().mockResolvedValue({ rows: [] }) } as unknown as Pool;
  const { app } = createApp(readConfig({ ...env, NODE_ENV: mode }), pool);
  const response = await app.request('/health');
  expect(response.status).toBe(200);
  expect(response.headers.get('strict-transport-security')).toBe(mode === 'production'
    ? 'max-age=31536000; includeSubDomains' : null);
  expect(response.headers.get('content-security-policy')).toBe("default-src 'none'; frame-ancestors 'none'");
  expect(response.headers.get('x-request-id')).toBeTruthy();
});
