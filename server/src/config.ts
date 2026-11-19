import { randomBytes } from 'node:crypto';

export function readConfig(env: NodeJS.ProcessEnv = process.env) {
  const fail = (message: string): never => { throw new Error(message); };
  const mode = env.NODE_ENV ?? 'development';
  if (!['development', 'test', 'production'].includes(mode)) fail('NODE_ENV invalide.');
  const production = mode === 'production';
  const avertissements: string[] = [];
  const secret = env.BETTER_AUTH_SECRET || (production ? '' : randomBytes(32).toString('hex'));
  if (secret.length < 32) fail('BETTER_AUTH_SECRET obligatoire : au moins 32 caractères.');
  if (production && /factice|exemple|example|changeme|secret-local/i.test(secret)) {
    fail('BETTER_AUTH_SECRET doit être un secret généré, sans valeur d’exemple.');
  }
  const url = (value: string | undefined, name: string, protocols: string[]) => {
    try {
      const parsed = new URL(value ?? '');
      if (!protocols.includes(parsed.protocol)) throw new Error();
      return parsed;
    } catch { return fail(`${name} invalide ou absent.`); }
  };
  const database = (value: string | undefined, name: string) => {
    const parsed = url(value, name, ['postgres:', 'postgresql:']);
    const host = parsed.hostname;
    const prive = host === 'localhost' || /\.(internal|local)$/.test(host) ||
      /^(10|127)\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) || /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(host);
    if (production && host.includes('.') && !prive && !parsed.searchParams.has('sslmode') && !parsed.searchParams.has('ssl')) {
      fail(`${name} doit préciser sslmode (require ou verify-full) hors réseau privé`);
    }
    if (production && parsed.searchParams.get('sslmode') === 'disable') avertissements.push(`${name} : TLS explicitement désactivé.`);
    return parsed.href;
  };
  const databaseURL = database(env.DATABASE_URL, 'DATABASE_URL');
  const migrationURL = env.DATABASE_MIGRATION_URL ? database(env.DATABASE_MIGRATION_URL, 'DATABASE_MIGRATION_URL') : databaseURL;
  const baseURL = url(env.BETTER_AUTH_URL, 'BETTER_AUTH_URL', ['http:', 'https:']);
  if (production && baseURL.protocol !== 'https:') fail('BETTER_AUTH_URL doit utiliser HTTPS en production.');
  const origins = (env.CORS_ORIGINS ?? '').split(',').map(s => s.trim()).filter(Boolean);
  if (!origins.length) fail('CORS_ORIGINS obligatoire.');
  for (const origin of origins) {
    if (url(origin, 'CORS_ORIGINS', ['http:', 'https:']).origin !== origin) fail('CORS_ORIGINS doit contenir des origines sans chemin.');
  }
  const integer = (value: string | undefined, fallback: number, name: string) => {
    const number = Number(value === '' ? fallback : value ?? fallback);
    if (!Number.isInteger(number) || number < 1 || number > 65535) fail(`${name} invalide.`);
    return number;
  };
  const smtpURL = env.SMTP_URL ? url(env.SMTP_URL, 'SMTP_URL', ['smtp:', 'smtps:']).href : undefined;
  const smtpHost = env.SMTP_HOST;
  if (production && !smtpURL && !smtpHost) fail('SMTP obligatoire en production.');
  if ((smtpURL || smtpHost) && !env.MAIL_FROM) fail('MAIL_FROM obligatoire avec SMTP.');
  if (smtpHost && (!env.SMTP_USER || !env.SMTP_PASS)) fail('SMTP_HOST nécessite SMTP_USER et SMTP_PASS.');
  const proxys = (env.TRUSTED_PROXIES ?? '').trim();
  const trustedProxies = proxys === 'none' ? [] : proxys.split(',').map(s => s.trim()).filter(Boolean);
  if (production && !trustedProxies.length && proxys !== 'none') avertissements.push('TRUSTED_PROXIES vide : vérifier la configuration du proxy, ou choisir none explicitement.');
  return {
    production, secret, databaseURL, migrationURL, avertissements, baseURL: baseURL.href, origins,
    port: integer(env.PORT, 3000, 'PORT'), smtpURL, smtpHost,
    smtpPort: integer(env.SMTP_PORT, 587, 'SMTP_PORT'),
    smtpUser: env.SMTP_USER, smtpPass: env.SMTP_PASS, mailFrom: env.MAIL_FROM,
    trustedProxies,
    rateMax: integer(env.AUTH_RATE_MAX, 5, 'AUTH_RATE_MAX'),
    rateWindow: integer(env.AUTH_RATE_WINDOW, 60, 'AUTH_RATE_WINDOW'),
  };
}
export type Config = ReturnType<typeof readConfig>;
