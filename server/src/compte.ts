import { Hono } from 'hono';
import type { Pool } from 'pg';

type Auth = { api: { getSession: (options: { headers: Headers }) => Promise<{ user: { id: string } } | null> } };
type Ligne = { version: number; revision: number; ecrit_le: Date | string; donnees: unknown };
const enveloppe = (ligne: Ligne, niveau: string, id: string) => ({
  version: ligne.version, revision: ligne.revision, niveau, id,
  ecritLe: new Date(ligne.ecrit_le).toISOString(), donnees: ligne.donnees,
});

export function routesCompte(pool: Pool, auth: Auth) {
  const app = new Hono();
  app.get('/export', async c => {
    c.header('Cache-Control', 'no-store');
    const authorization = c.req.header('authorization');
    if (!authorization || !/^Bearer\s+\S+$/i.test(authorization)) return c.json({ message: 'Connexion requise.' }, 401);
    const session = await auth.api.getSession({ headers: new Headers({ authorization }) });
    if (!session) return c.json({ message: 'Connexion requise.' }, 401);
    // Une seule requête assure un instantané cohérent de toutes les sauvegardes.
    const { rows } = await pool.query(`SELECT
      (SELECT row_to_json(c) FROM donnees_compte c WHERE c.compte_id = $1) AS compte,
      COALESCE((SELECT json_agg(p ORDER BY p.id) FROM (
        SELECT p.*, COALESCE((SELECT json_agg(r ORDER BY r.region_id) FROM regions r
          WHERE r.partie_id = p.id), '[]') AS regions
        FROM parties p WHERE p.compte_id = $1
      ) p), '[]') AS parties`, [session.user.id]);
    const ligne = rows[0];
    return c.json({ exporteLe: new Date().toISOString(),
      compte: ligne.compte ? enveloppe(ligne.compte, 'compte', 'local') : null,
      parties: ligne.parties.map((p: Ligne & { id: string; regions: (Ligne & { region_id: string })[] }) => ({
        partie: enveloppe(p, 'partie', p.id),
        regions: p.regions.map(r => enveloppe(r, 'region', r.region_id)),
      })),
    });
  });
  return app;
}
