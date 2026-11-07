import { expect, test } from 'vitest';
import { randomUUID } from 'node:crypto';
import { support } from './support.js';
import { migrerSauvegarde } from '../src/schema.js';

const s = support();
const chemin = '/api/sauvegarde';
const date = '2026-11-04T10:00:00.000Z';
const objet = (niveau: string, id: string, donnees: Record<string, unknown>) =>
  ({ version: 1, niveau, id, revision: 1, ecritLe: date, donnees });
function corps(id: string = randomUUID()) {
  return { partie: objet('partie', id, { nom: 'Archive', regionCourante: 'kanto', statistiques: { tempsJeuMs: 123 } }),
    regions: [objet('region', 'kanto', { regionId: 'kanto', zoneId: 'route-1', equipe: [{ niveau: 4 }, { niveau: 7 }] })] };
}
async function preparer() {
  const { token } = await s.signup();
  const id = randomUUID();
  const body = corps(id);
  expect((await s.request(chemin, { partieId: id, partie: { revisionBase: 0, enveloppe: body.partie },
    regions: body.regions.map(enveloppe => ({ revisionBase: 0, enveloppe })) }, token, undefined, 'PUT')).status).toBe(200);
  return { id, body, token };
}
const poster = (id: string, body: object, token?: string) => s.request(`${chemin}/parties/${id}/archives`, body, token);
const lire = (id: string, token?: string) => s.request(`${chemin}/parties/${id}/versions`, undefined, token);

test('migration additive et idempotente', async () => {
  const t = await preparer();
  const db = await s.pool.connect();
  try { await migrerSauvegarde(db); await migrerSauvegarde(db); } finally { db.release(); }
  const sql = `INSERT INTO versions(compte_id,niveau,objet_id,revision,version,ecrit_le,donnees)
    SELECT compte_id,'partie',id,1,1,now(),'{}' FROM parties WHERE id=$1 RETURNING origine`;
  expect((await s.pool.query(sql, [t.id])).rows[0].origine).toBe('rotation');
  await expect(s.pool.query("UPDATE versions SET origine='invalide' WHERE objet_id=$1", [t.id])).rejects.toThrow();
});

test('archives : validation, session et isolation', async () => {
  const t = await preparer();
  expect((await poster(t.id, t.body)).status).toBe(401);
  for (const body of [{ ...t.body, inconnu: true }, { ...t.body, regions: [] },
    { ...t.body, regions: [...t.body.regions, ...t.body.regions] },
    { ...t.body, regions: [{ ...t.body.regions[0], inconnu: true }] }]) {
    expect((await poster(t.id, body, t.token)).status).toBe(400);
  }
  expect((await s.pool.query('SELECT * FROM versions WHERE objet_id=$1', [t.id])).rows).toHaveLength(0);
  const autre = await s.signup();
  for (const id of [t.id, randomUUID(), 'invalide']) {
    expect((await poster(id, corps(id), autre.token)).status).toBe(404);
    expect((await lire(id, autre.token)).status).toBe(404);
  }
});

test('lots conservés, résumés, rotations et suppression isolée', async () => {
  const t = await preparer();
  const lots: string[] = [];
  for (let i = 0; i < 7; i++) {
    const response = await poster(t.id, t.body, t.token);
    expect(response.status).toBe(200);
    const { lot } = await response.json();
    lots.unshift(lot);
    const rows = (await s.pool.query('SELECT origine FROM versions WHERE lot=$1', [lot])).rows;
    expect(rows).toEqual([{ origine: 'divergence' }, { origine: 'divergence' }]);
  }
  const versions = (await (await lire(t.id, t.token)).json()).versions;
  expect(versions.map((v: { lot: string }) => v.lot)).toEqual(lots.slice(0, 5));
  expect(versions[0]).toEqual({ lot: lots[0], origine: 'divergence', remplaceLe: expect.any(String),
    ecritLe: date, tempsJeuMs: 123, regionCourante: 'kanto', zoneId: 'route-1', niveauEquipe: 6 });
  for (let revision = 1; revision <= 7; revision++) {
    expect((await s.request(chemin, { partieId: t.id, partie: { revisionBase: revision, enveloppe: t.body.partie } },
      t.token, undefined, 'PUT')).status).toBe(200);
  }
  await s.pool.query(`INSERT INTO versions(compte_id,niveau,objet_id,revision,version,ecrit_le,donnees)
    SELECT compte_id,'partie',gen_random_uuid()::text,1,1,now(),'{}' FROM parties,generate_series(1,205) WHERE id=$1`, [t.id]);
  expect((await s.request(`${chemin}/versions`, { niveau: 'partie', objetId: t.id, enveloppe: t.body.partie }, t.token)).status).toBe(200);
  expect((await s.pool.query('SELECT * FROM versions WHERE lot IS NOT NULL AND (objet_id=$1 OR objet_id LIKE $1 || \':%\')', [t.id])).rows).toHaveLength(10);
  await s.pool.query("DELETE FROM versions WHERE lot=$1 AND niveau='region'", [lots[0]]);
  expect((await (await lire(t.id, t.token)).json()).versions).toHaveLength(4);
  const autreId = randomUUID();
  const autre = corps(autreId);
  await s.request(chemin, { partieId: autreId, partie: { revisionBase: 0, enveloppe: autre.partie } }, t.token, undefined, 'PUT');
  await poster(autreId, autre, t.token);
  expect((await s.request(`${chemin}/parties/${t.id}`, undefined, t.token, undefined, 'DELETE')).status).toBe(200);
  expect((await s.pool.query('SELECT * FROM versions WHERE objet_id=$1 OR objet_id LIKE $1 || \':%\'', [t.id])).rows).toHaveLength(0);
  expect((await (await lire(autreId, t.token)).json()).versions).toHaveLength(1);
});
