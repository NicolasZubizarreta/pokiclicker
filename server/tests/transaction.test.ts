import { expect, test, vi } from 'vitest';
import type { Pool, PoolClient } from 'pg';
import { annulerTransaction, transaction } from '../src/transaction.js';

function connexion() {
  const query = vi.fn().mockResolvedValue({ rows: [] });
  const release = vi.fn();
  const db = { query, release } as unknown as PoolClient;
  const pool = { connect: vi.fn().mockResolvedValue(db) } as unknown as Pool;
  return { query, release, db, pool };
}

test('transaction validée puis client libéré', async () => {
  const { pool, db, query, release } = connexion();
  const fn = vi.fn(async client => {
    expect(client).toBe(db);
    await client.query('SELECT 1');
    return 42;
  });
  expect(await transaction(pool, fn)).toBe(42);
  expect(query.mock.calls).toEqual([['BEGIN'], ['SELECT 1'], ['COMMIT']]);
  expect(release).toHaveBeenCalledExactlyOnceWith(undefined);
});

test('refus métier : annulation des écritures et résultat conservé', async () => {
  const { pool, query, release } = connexion();
  const refus = { statut: 409 };
  expect(await transaction(pool, async db => {
    await db.query('SELECT 1');
    return annulerTransaction(refus);
  })).toBe(refus);
  expect(query.mock.calls).toEqual([['BEGIN'], ['SELECT 1'], ['ROLLBACK']]);
  expect(release).toHaveBeenCalledExactlyOnceWith(undefined);
});

test.each([false, true])('erreur propagée, échec de ROLLBACK : %s', async echecRollback => {
  const { pool, query, release } = connexion();
  const erreur = new Error('Écriture impossible.');
  const erreurRollback = new Error('Connexion perdue.');
  if (echecRollback) query.mockImplementation(async sql => {
    if (sql === 'ROLLBACK') throw erreurRollback;
    return { rows: [] };
  });
  await expect(transaction(pool, async () => { throw erreur; })).rejects.toBe(erreur);
  expect(query.mock.calls).toEqual([['BEGIN'], ['ROLLBACK']]);
  expect(release).toHaveBeenCalledExactlyOnceWith(echecRollback ? erreurRollback : erreur);
});
