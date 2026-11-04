import { randomBytes } from 'node:crypto';

export function readConfig(env: NodeJS.ProcessEnv = process.env) {
  const fail = (message: string): never => { throw new Error(message); };
  const mode = env.NODE_ENV ?? 'development';
  if (!['development', 'test', 'production'].includes(mode)) fail('NODE_ENV invalide.');
  const production = mode === 'production';
  const secret = env.BETTER_AUTH_SECRET || (production ? '' : randomBytes(32).toString('hex'));
  if (secret.length < 32) fail('BETTER_AUTH_SECRET obligatoire : au moins 32 caractères.');
  const url = (value: string | undefined, name: string, protocols: string[]) => {
    try {
      const parsed = new URL(value ?? '');
      if (!protocols.includes(parsed.protocol)) throw new Error();
      return parsed;
    } catch { return fail(`${name} invalide ou absent.`); }
  };
  const databaseURL = url(env.DATABASE_URL, 'DATABASE_URL', ['postgres:', 'postgresql:']).href;
  const baseURL = url(env.BETTER_AUTH_URL, 'BETTER_AUTH_URL', ['http:', 'https:']);
  if (production && baseURL.protocol !== 'https:') fail('BETTER_AUTH_URL doit utiliser HTTPS en production.');
  const origins = (env.CORS_ORIGINS ?? '').split(',').map(s => s.trim()).filter(Boolean);
  if (!origins.length) fail('CORS_ORIGINS obligatoire.');
  for (const origin of origins) {
    if (url(origin, 'CORS_ORIGINS', ['http:', 'https:']).origin !== origin) fail('CORS_ORIGINS doit contenir des origines sans chemin.');
  }
  const integer = (value: string | undefined, fallback: number, name: string) => {
    const number = Number(value ?? fallback);
    if (!Number.isInteger(number) || number < 1 || number > 65535) fail(`${name} invalide.`);
    return number;
  };
  const smtpURL = env.SMTP_URL ? url(env.SMTP_URL, 'SMTP_URL', ['smtp:', 'smtps:']).href : undefined;
  const smtpHost = env.SMTP_HOST;
  if (production && !smtpURL && !smtpHost) fail('SMTP obligatoire en production.');
  if ((smtpURL || smtpHost) && !env.MAIL_FROM) fail('MAIL_FROM obligatoire avec SMTP.');
  if (smtpHost && (!env.SMTP_PORT || !env.SMTP_USER || !env.SMTP_PASS)) fail('SMTP_HOST nécessite SMTP_PORT, SMTP_USER et SMTP_PASS.');
  return {
    production, secret, databaseURL, baseURL: baseURL.href, origins,
    port: integer(env.PORT, 3000, 'PORT'), smtpURL, smtpHost,
    smtpPort: integer(env.SMTP_PORT, 587, 'SMTP_PORT'),
    smtpUser: env.SMTP_USER, smtpPass: env.SMTP_PASS, mailFrom: env.MAIL_FROM,
    trustedProxies: (env.TRUSTED_PROXIES ?? '').split(',').map(s => s.trim()).filter(Boolean),
    rateMax: integer(env.AUTH_RATE_MAX, 5, 'AUTH_RATE_MAX'),
    rateWindow: integer(env.AUTH_RATE_WINDOW, 60, 'AUTH_RATE_WINDOW'),
  };
}
export type Config = ReturnType<typeof readConfig>;
