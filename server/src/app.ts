import { betterAuth } from 'better-auth';
import { bearer } from 'better-auth/plugins/bearer';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { bodyLimit } from 'hono/body-limit';
import nodemailer from 'nodemailer';
import type { Pool } from 'pg';
import type { Config } from './config.js';

export type ResetMail = { to: string; url: string };
export type Mailer = (mail: ResetMail) => Promise<void>;

export function createApp(config: Config, pool: Pool, mailer?: Mailer) {
  const transport = config.smtpURL ? nodemailer.createTransport(config.smtpURL) : config.smtpHost
    ? nodemailer.createTransport({ host: config.smtpHost, port: config.smtpPort, secure: config.smtpPort === 465,
      auth: { user: config.smtpUser, pass: config.smtpPass } }) : undefined;
  const send: Mailer = mailer ?? (async ({ to, url }) => {
    if (!transport) {
      if (config.production) throw new Error('SMTP indisponible.');
      console.info(`Lien de réinitialisation (développement) : ${url}`);
      return;
    }
    try {
      await transport.sendMail({ from: config.mailFrom, to, subject: 'Réinitialisation de votre mot de passe',
        text: `Pour choisir un nouveau mot de passe, ouvrez ce lien :\n${url}\n\nCe lien est valable une heure et une seule fois. Si vous n’avez rien demandé, ignorez cet e-mail.` });
    } catch (error) {
      console.error('Envoi SMTP échoué : ' + (error instanceof Error ? error.message : 'erreur inconnue'));
      throw new Error('Impossible d’envoyer le message de réinitialisation.');
    }
  });
  const auth = betterAuth({
    database: pool, secret: config.secret, baseURL: config.baseURL,
    trustedOrigins: config.origins, logger: { level: 'warn' },
    // Derrière Traefik : lire l'adresse du client de droite à gauche en sautant les proxys de confiance.
    advanced: { ipAddress: { trustedProxies: config.trustedProxies },
      // Ne pas attendre l'envoi de l'e-mail : le temps de réponse ne doit pas révéler si le compte existe.
      backgroundTasks: { handler: promise => { promise.catch(() => undefined); } } },
    emailAndPassword: {
      enabled: true, minPasswordLength: 10, requireEmailVerification: false,
      resetPasswordTokenExpiresIn: 3600, revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => send({ to: user.email, url }),
    },
    plugins: [bearer()],
    rateLimit: { enabled: true, storage: 'database', customRules: Object.fromEntries(
      ['/sign-in/email', '/sign-up/email', '/request-password-reset'].map(path =>
        [path, { window: config.rateWindow, max: config.rateMax }]),
    ) },
  });
  const app = new Hono();
  app.use('*', async (c, next) => {
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('Referrer-Policy', 'no-referrer');
    c.header('X-Frame-Options', 'DENY');
    if (config.production) c.header('Strict-Transport-Security', 'max-age=31536000');
    if (c.req.path.startsWith('/api/auth/')) c.header('Cache-Control', 'no-store');
    await next();
  });
  app.use('*', cors({ origin: origin => config.origins.includes(origin) ? origin : undefined,
    allowHeaders: ['Authorization', 'Content-Type'], exposeHeaders: ['set-auth-token'],
    allowMethods: ['GET', 'POST', 'OPTIONS'] }));
  app.use('*', bodyLimit({ maxSize: 100 * 1024, onError: c => c.json({ message: 'Requête trop volumineuse.' }, 413) }));
  app.onError((error, c) => {
    console.error(error instanceof Error ? error.message : 'erreur');
    return c.json({ message: 'Erreur interne du serveur.' }, 500);
  });
  app.get('/health', async c => {
    try { await pool.query('select 1'); return c.json({ ok: true }); }
    catch { return c.json({ ok: false }, 503); }
  });
  app.all('/api/auth/*', async c => {
    const response = await auth.handler(c.req.raw);
    if (response.headers.get('content-type')?.includes('application/json') &&
      (response.status >= 400 || c.req.path.endsWith('/request-password-reset'))) {
      const body = await response.json() as { code?: string; message?: string };
      body.message = response.ok ? 'Si ce compte existe, un lien de réinitialisation a été envoyé.'
        : response.status === 429 ? 'Trop de tentatives. Réessayez plus tard.'
        : body.code === 'INVALID_EMAIL_OR_PASSWORD' ? 'E-mail ou mot de passe incorrect.'
        : 'La demande d’authentification a été refusée.';
      return new Response(JSON.stringify(body), { status: response.status, headers: response.headers });
    }
    return response;
  });
  return { app, auth };
}
