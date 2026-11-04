import { serve } from '@hono/node-server';
import { Pool } from 'pg';
import { readConfig } from './config.js';
import { createApp } from './app.js';

const config = readConfig();
const pool = new Pool({ connectionString: config.databaseURL });
await pool.query('select 1');
const { app } = createApp(config, pool);
const server = serve({ fetch: app.fetch, port: config.port });
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => { server.close(() => { void pool.end(); }); });
}
