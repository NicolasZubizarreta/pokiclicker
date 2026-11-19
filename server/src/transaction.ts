import type { Pool, PoolClient } from 'pg';

class Annulation {
  constructor(readonly resultat: unknown) {}
}

// Les refus métier doivent annuler aussi les écritures déjà effectuées.
export function annulerTransaction(resultat: unknown): never {
  throw new Annulation(resultat);
}

export async function transaction<T>(pool: Pool, fn: (db: PoolClient) => Promise<T>): Promise<T> {
  const db = await pool.connect();
  let echec: Error | undefined;
  try {
    await db.query('BEGIN');
    const resultat = await fn(db);
    await db.query('COMMIT');
    return resultat;
  } catch (error) {
    try { await db.query('ROLLBACK'); }
    catch (rollbackError) {
      echec = rollbackError instanceof Error ? rollbackError : new Error(String(rollbackError));
      if (error instanceof Annulation) throw rollbackError;
    }
    if (error instanceof Annulation) return error.resultat as T;
    echec ??= error instanceof Error ? error : new Error(String(error));
    throw error;
  } finally { db.release(echec); }
}
