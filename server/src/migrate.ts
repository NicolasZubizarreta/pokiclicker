import { getMigrations } from 'better-auth/db/migration';
import { Pool } from 'pg';
import { readConfig } from './config.js';
import { createApp } from './app.js';

const config = readConfig();
const pool = new Pool({ connectionString: config.databaseURL });
try {
  const { auth } = createApp(config, pool);
  // Verrou : deux instances démarrées ensemble ne migrent pas en même temps.
  const client = await pool.connect();
  try {
    await client.query('select pg_advisory_lock(7241)');
    await (await getMigrations(auth.options)).runMigrations();
  } finally {
    await client.query('select pg_advisory_unlock(7241)');
    client.release();
  }
  console.info('Schéma d’authentification à jour.');
} catch (error) {
  console.error('Échec de la migration du schéma d’authentification : ' + (error instanceof Error ? error.message : 'erreur inconnue'));
  process.exitCode = 1;
} finally { await pool.end(); }