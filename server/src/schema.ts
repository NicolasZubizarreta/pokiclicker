import type { Pool } from 'pg';
import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

export async function migrerSauvegarde(db: Pick<Pool, 'query'>, options: { jusqua?: number } = {}) {
  const dossier = new URL('../migrations/', import.meta.url);
  const fichiers = (await readdir(dossier)).filter(f => /^\d{4}-.+\.sql$/.test(f)).sort();
  await db.query('CREATE TABLE IF NOT EXISTS migrations_sauvegarde(version int PRIMARY KEY, applique_le timestamptz DEFAULT now())');
  await db.query('ALTER TABLE migrations_sauvegarde ADD COLUMN IF NOT EXISTS checksum text');
  for (const fichier of fichiers) {
    const version = Number(fichier.slice(0, 4));
    if (options.jusqua !== undefined && version > options.jusqua) continue;
    const sql = await readFile(new URL(fichier, dossier), 'utf8');
    // fins de ligne normalisées : même somme sous Windows et Linux
    const checksum = createHash('sha256').update(sql.replaceAll('\r\n', '\n')).digest('hex');
    await db.query('BEGIN');
    try {
      const appliquee = await db.query('SELECT checksum FROM migrations_sauvegarde WHERE version=$1', [version]);
      if (!appliquee.rowCount) {
        await db.query(sql);
        await db.query('INSERT INTO migrations_sauvegarde(version,checksum) VALUES ($1,$2)', [version, checksum]);
      } else if (appliquee.rows[0].checksum === null) {
        await db.query('UPDATE migrations_sauvegarde SET checksum=$2 WHERE version=$1', [version, checksum]);
      } else if (appliquee.rows[0].checksum !== checksum) {
        throw new Error(`Checksum différent pour la migration ${fichier}.`);
      }
      await db.query('COMMIT');
    } catch (error) { await db.query('ROLLBACK'); throw error; }
  }
}
