import type { Pool } from 'pg';

const migrations = [`
  CREATE TABLE donnees_compte (
    compte_id text PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
    revision integer NOT NULL CHECK (revision >= 1), version integer NOT NULL,
    ecrit_le timestamptz NOT NULL, donnees jsonb NOT NULL
  );
  CREATE TABLE parties (
    id uuid PRIMARY KEY, compte_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    nom text NOT NULL, revision integer NOT NULL CHECK (revision >= 1),
    version integer NOT NULL, ecrit_le timestamptz NOT NULL, donnees jsonb NOT NULL
  );
  CREATE INDEX ON parties(compte_id);
  CREATE TABLE regions (
    partie_id uuid NOT NULL REFERENCES parties(id) ON DELETE CASCADE, region_id text NOT NULL,
    revision integer NOT NULL CHECK (revision >= 1), version integer NOT NULL,
    ecrit_le timestamptz NOT NULL, donnees jsonb NOT NULL, PRIMARY KEY(partie_id, region_id)
  );
  CREATE TABLE versions (
    id bigserial PRIMARY KEY, compte_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    niveau text NOT NULL, objet_id text NOT NULL, revision integer NOT NULL,
    version integer NOT NULL, ecrit_le timestamptz NOT NULL, donnees jsonb NOT NULL,
    remplace_le timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX ON versions(compte_id, niveau, objet_id, revision DESC);
`];

export async function migrerSauvegarde(db: Pick<Pool, 'query'>) {
  await db.query('CREATE TABLE IF NOT EXISTS migrations_sauvegarde(version int PRIMARY KEY, applique_le timestamptz DEFAULT now())');
  for (const [index, sql] of migrations.entries()) {
    await db.query('BEGIN');
    try {
      const appliquee = await db.query('SELECT version FROM migrations_sauvegarde WHERE version = $1', [index + 1]);
      if (!appliquee.rowCount) {
        await db.query(sql);
        await db.query('INSERT INTO migrations_sauvegarde(version) VALUES ($1)', [index + 1]);
      }
      await db.query('COMMIT');
    } catch (error) { await db.query('ROLLBACK'); throw error; }
  }
}
