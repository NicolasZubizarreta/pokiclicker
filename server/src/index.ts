import { serve } from '@hono/node-server';
import { Pool } from 'pg';
import { readConfig } from './config.js';
import { createApp } from './app.js';
import { avecEssais } from './mail.js';
import { journal, messageNettoye } from './journal.js';

process.on('unhandledRejection', error => {
  journal('rejet-non-gere', { niveau: 'erreur', message: messageNettoye(error) });
});
const config = readConfig();
for (const message of config.avertissements) journal('configuration-avertissement', { message });
const pool = new Pool({ connectionString: config.databaseURL });
pool.on('error', error => { journal('pool-erreur', { niveau: 'erreur', message: messageNettoye(error) }); });
try {
  let essai = 0;
  await avecEssais(async () => {
    essai++;
    try { await pool.query('select 1'); }
    catch (error) {
      journal('demarrage-base-echec', { niveau: 'erreur', essai, message: messageNettoye(error) });
      throw error;
    }
  }, Array.from({ length: 9 }, (_, i) => (i + 1) * 1000));
} catch {
  try { await pool.end(); }
  finally { process.exit(1); }
}
const { app } = createApp(config, pool);
const server = serve({ fetch: app.fetch, port: config.port });
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => { server.close(() => { void pool.end(); }); });
}
