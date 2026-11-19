import { betterAuth } from 'better-auth';
import { bearer } from 'better-auth/plugins/bearer';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { bodyLimit } from 'hono/body-limit';
import { createHmac, randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import type { Config } from './config.js';
import { routesSauvegarde } from './sauvegarde.js';
import { routesCompte } from './compte.js';
import { creerEnvoi, type Mailer } from './mail.js';
import { journal, messageNettoye } from './journal.js';

export type { ResetMail, Mailer } from './mail.js';

export function createApp(config: Config, pool: Pool, mailer?: Mailer) {
  const send: Mailer = mailer ?? creerEnvoi(config);
  const auth = betterAuth({
    database: pool, secret: config.secret, baseURL: config.baseURL,
    trustedOrigins: config.origins, logger: { level: 'warn' },
    // Derrière Traefik : lire l'adresse du client de droite à gauche en sautant les proxys de confiance.
    advanced: { ipAddress: { trustedProxies: config.trustedProxies },
      // Ne pas attendre l'envoi de l'e-mail : le temps de réponse ne doit pas révéler si le compte existe.
      backgroundTasks: { handler: promise => { void promise.catch(error => {
        journal('tache-fond-echec', { niveau: 'erreur', message: messageNettoye(error) });
      }); } } },
    emailAndPassword: {
      enabled: true, minPasswordLength: 10, requireEmailVerification: false,
      resetPasswordTokenExpiresIn: 3600, revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        const empreinte = createHmac('sha256', config.secret).update(user.email.toLowerCase()).digest('hex');
        const db = await pool.connect();
        let autorise = false;
        try {
          await db.query('BEGIN');
          // Sérialiser le comptage et la réservation, y compris entre instances.
          await db.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [empreinte]);
          await db.query("DELETE FROM envois_reinitialisation WHERE envoye_le < now() - interval '24 hours'");
          const { rows } = await db.query("SELECT count(*) FROM envois_reinitialisation WHERE email_hash = $1 AND envoye_le > now() - interval '1 hour'", [empreinte]);
          autorise = Number(rows[0].count) < 3;
          if (autorise) await db.query('INSERT INTO envois_reinitialisation(email_hash) VALUES ($1)', [empreinte]);
          await db.query('COMMIT');
        } catch (error) {
          await db.query('ROLLBACK');
          throw error;
        } finally { db.release(); }
        if (!autorise) { journal('reinit-limite'); return; }
        await send({ to: user.email, url });
      },
    },
    user: { deleteUser: { enabled: true } },
    plugins: [bearer({ requireSignature: true })],
    rateLimit: { enabled: true, storage: 'database', customRules: Object.fromEntries(
      ['/sign-in/email', '/sign-up/email', '/request-password-reset'].map(path =>
        [path, { window: config.rateWindow, max: config.rateMax }]),
    ) },
  });
  const cheminJournal = (path: string) => path.replace(/^(\/api\/auth\/reset-password)\/[^/]+$/, '$1/:token');
  const app = new Hono<{ Variables: { rid: string } }>();
  app.use('*', async (c, next) => {
    const rid = randomUUID();
    c.set('rid', rid);
    c.header('X-Request-Id', rid);
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('Referrer-Policy', 'no-referrer');
    c.header('X-Frame-Options', 'DENY');
    c.header('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    c.header('Cross-Origin-Resource-Policy', 'same-site');
    c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    c.header('Cross-Origin-Opener-Policy', 'same-origin');
    if (config.production) c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    if (c.req.path.startsWith('/api/auth/') || c.req.path.startsWith('/api/sauvegarde') || c.req.path.startsWith('/api/compte')) c.header('Cache-Control', 'no-store');
    await next();
    const chemin = cheminJournal(c.req.path);
    const statut = c.res.status;
    if (c.req.path.startsWith('/api/') && [401, 403, 429].includes(statut)) {
      journal('http-refus', { rid, methode: c.req.method, chemin, statut });
    }
    const actions: Record<string, string> = {
      '/api/auth/sign-in/email': 'connexion-echec', '/api/auth/sign-up/email': 'inscription',
      '/api/auth/request-password-reset': 'demande-reinitialisation',
      '/api/auth/reset-password': 'reinitialisation', '/api/auth/delete-user': 'suppression-compte',
    };
    const action = actions[c.req.path];
    if (c.req.method === 'POST' && action && (action === 'connexion-echec' ? statut >= 400
      : action === 'demande-reinitialisation' || (statut >= 200 && statut < 300))) {
      journal('auth', { action, statut, rid });
    }
  });
  app.use('*', cors({ origin: origin => config.origins.includes(origin) ? origin : undefined,
    allowHeaders: ['Authorization', 'Content-Type'], exposeHeaders: ['set-auth-token', 'X-Request-Id'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] }));
  const limite = bodyLimit({ maxSize: 100 * 1024, onError: c => c.json({ message: 'Requête trop volumineuse.' }, 413) });
  // Ces routes portent une partie entière et ont leur propre limite (3 Mo) dans sauvegarde.ts.
  app.use('*', (c, next) => (c.req.method === 'PUT' && c.req.path === '/api/sauvegarde') ||
    (c.req.method === 'POST' && (c.req.path === '/api/sauvegarde/versions' || /^\/api\/sauvegarde\/parties\/[^/]+\/archives$/.test(c.req.path))) ? next() : limite(c, next));
  app.onError((error, c) => {
    journal('http-erreur', { niveau: 'erreur', rid: c.get('rid'), methode: c.req.method,
      chemin: cheminJournal(c.req.path), message: messageNettoye(error) });
    return c.json({ message: 'Erreur interne du serveur.' }, 500);
  });
  app.get('/health', async c => {
    try { await pool.query('select 1'); return c.json({ ok: true }); }
    catch { return c.json({ ok: false }, 503); }
  });
  app.all('/api/auth/*', async c => {
    const chemin = c.req.path.slice('/api/auth'.length);
    const permis = c.req.method === 'POST'
      ? ['/sign-up/email', '/sign-in/email', '/sign-out', '/request-password-reset', '/reset-password', '/delete-user'].includes(chemin)
      : c.req.method === 'GET' && (['/get-session', '/error'].includes(chemin) || /^\/reset-password\/[^/]+$/.test(chemin));
    if (!permis) return c.json({ message: 'Introuvable.' }, 404);
    let requete = c.req.raw;
    if (c.req.method === 'POST' && chemin === '/sign-up/email' &&
        /^application\/json(?:\s*;|$)/i.test(c.req.header('content-type') ?? '')) {
      let corps;
      try { corps = await requete.clone().json(); }
      catch { return c.json({ message: 'JSON invalide.' }, 400); }
      if (corps && typeof corps === 'object' && !Array.isArray(corps)) {
        if (typeof corps.name === 'string') corps.name = corps.name.slice(0, 50);
        if (typeof corps.image === 'string' && corps.image.length > 2048) delete corps.image;
        const headers = new Headers(requete.headers);
        headers.delete('content-length');
        requete = new Request(requete, { headers, body: JSON.stringify(corps) });
      }
    }
    const response = await auth.handler(requete);
    if (response.headers.get('content-type')?.includes('application/json') &&
      (response.status >= 400 || c.req.path.endsWith('/request-password-reset'))) {
      const body = await response.json() as { code?: string; message?: string };
      body.message = response.ok ? 'Si ce compte existe, un lien de réinitialisation a été envoyé.'
        : response.status === 429 ? 'Trop de tentatives. Réessayez plus tard.'
        : body.code === 'INVALID_EMAIL_OR_PASSWORD' ? 'E-mail ou mot de passe incorrect.'
        : 'La demande d’authentification a été refusée.';
      const headers = new Headers(response.headers);
      headers.delete('content-length');
      headers.delete('content-encoding');
      return new Response(JSON.stringify(body), { status: response.status, headers });
    }
    return response;
  });
  app.route('/api/sauvegarde', routesSauvegarde(pool, auth));
  app.route('/api/compte', routesCompte(pool, auth));
  return { app, auth };
}
