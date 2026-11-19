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

test('archive de quatre Mo, suppression protégée et lots masqués', async () => {
  const t = await preparer();
  const regions = Array.from({ length: 5 }, (_, i) => objet('region', `r${i}`, { regionId: `r${i}`, texte: 'x'.repeat(800_000) }));
  expect((await poster(t.id, { partie: t.body.partie, regions }, t.token)).status).toBe(200);
  expect((await s.request(`${chemin}/parties/${t.id}`, { revisionBase: 0 }, t.token, undefined, 'DELETE')).status).toBe(409);
  expect((await s.request(`${chemin}/parties/${t.id}`, undefined, t.token)).status).toBe(200);
  expect((await s.request(`${chemin}/parties/${t.id}`, undefined, t.token, undefined, 'DELETE')).status).toBe(200);
  const lignes = (await s.pool.query("SELECT * FROM versions WHERE objet_id=$1 AND origine='suppression'", [t.id])).rows;
  expect(lignes).toHaveLength(1);
  expect(lignes[0].lot).toEqual(expect.any(String));
  await s.request(chemin, { partieId: t.id, partie: { revisionBase: 0, enveloppe: t.body.partie } }, t.token, undefined, 'PUT');
  expect((await (await lire(t.id, t.token)).json()).versions.every((v: { origine: string }) => v.origine !== 'suppression')).toBe(true);
});

test('borne temporelle, validation avant SQL et en-têtes obligatoires', async () => {
  const t = await preparer();
  const futur = { ...t.body.partie, ecritLe: '9999-12-31T23:59:59Z' };
  expect((await s.request(chemin, { partieId: t.id, partie: { revisionBase: 1, enveloppe: futur } }, t.token, undefined, 'PUT')).status).toBe(200);
  const parties = (await (await s.request(`${chemin}/parties`, undefined, t.token)).json()).parties;
  expect(Date.parse(parties.find((p: { id: string }) => p.id === t.id).ecritLe)).toBeLessThanOrEqual(Date.now() + 300_000);
  const regions = Array.from({ length: 25 }, (_, i) => ({ revisionBase: 0, enveloppe: objet('region', `r${i}`, { regionId: `r${i}` }) }));
  const { routesSauvegarde } = await import('../src/sauvegarde.js');
  const app = routesSauvegarde({ connect: () => { throw new Error('SQL interdit'); } } as unknown as typeof s.pool,
    { api: { getSession: async ({ headers }) => { expect(headers.has('cookie')).toBe(false); return { user: { id: 'test' } }; } } });
  expect((await app.request('/', { method: 'PUT', headers: { authorization: 'Bearer test', 'content-type': 'application/json' },
    body: JSON.stringify({ partieId: t.id, regions }) })).status).toBe(413);
  expect((await app.request('/parties', { headers: { cookie: 'session=valide' } })).status).toBe(401);
  expect((await app.request('/', { method: 'PUT', headers: { authorization: 'Bearer test', 'content-type': 'text/plain' }, body: '{}' })).status).toBe(415);
});

test('migration additive et idempotente', async () => {
  const t = await preparer();
  const db = await s.pool.connect();
  try { await migrerSauvegarde(db); await migrerSauvegarde(db); } finally { db.release(); }
  const sql = `INSERT INTO versions(compte_id,niveau,objet_id,revision,version,ecrit_le,donnees)
    SELECT compte_id,'partie',id,1,1,now(),'{}' FROM parties WHERE id=$1 RETURNING origine`;
  expect((await s.pool.query(sql, [t.id])).rows[0].origine).toBe('rotation');
  await expect(s.pool.query("UPDATE versions SET origine='invalide' WHERE objet_id=$1", [t.id])).rejects.toThrow();
});

test('migration depuis N-1, adoption des checksums et détection des modifications', async () => {
  const db = await s.pool.connect();
  const schema = `migration_${randomUUID().replaceAll('-', '')}`;
  const id = randomUUID();
  const precedent = (await db.query('SHOW search_path')).rows[0].search_path;
  try {
    await db.query(`CREATE SCHEMA "${schema}"`);
    await db.query(`SET search_path TO "${schema}"`);
    await db.query('CREATE TABLE "user"(id text PRIMARY KEY)');
    await db.query("INSERT INTO \"user\" VALUES ('compte')");
    await migrerSauvegarde(db, { jusqua: 3 });
    await db.query("INSERT INTO parties VALUES ($1,'compte','Nom',1,1,now(),'{}')", [id]);
    await db.query("INSERT INTO regions VALUES ($1,'kanto',1,1,now(),'{}')", [id]);
    await db.query(`INSERT INTO versions(compte_id,niveau,objet_id,revision,version,ecrit_le,donnees)
      VALUES ('compte','partie',$1,1,1,now(),'{}')`, [id]);
    const avant = await Promise.all(['parties', 'regions', 'versions'].map(async table => (await db.query(`SELECT * FROM ${table}`)).rows));
    await db.query('UPDATE migrations_sauvegarde SET checksum=NULL');
    await migrerSauvegarde(db);
    await migrerSauvegarde(db);
    const apres = await Promise.all(['parties', 'regions', 'versions'].map(async table => (await db.query(`SELECT * FROM ${table}`)).rows));
    expect(apres).toEqual(avant);
    expect(apres[2]![0].origine).toBe('rotation');
    expect((await db.query('SELECT * FROM regions_supprimees')).rows).toEqual([]);
    expect((await db.query('SELECT * FROM envois_reinitialisation')).rows).toEqual([]);
    await db.query("UPDATE versions SET origine='suppression'");
    expect((await db.query('SELECT checksum FROM migrations_sauvegarde')).rows.every(r => /^[a-f0-9]{64}$/.test(r.checksum))).toBe(true);
    await db.query("UPDATE migrations_sauvegarde SET checksum='modifié' WHERE version=1");
    await expect(migrerSauvegarde(db)).rejects.toThrow('Checksum différent');
  } finally {
    await db.query('SELECT set_config(\'search_path\', $1, false)', [precedent]);
    await db.query(`DROP SCHEMA "${schema}" CASCADE`);
    db.release();
  }
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
  expect((await s.pool.query("SELECT * FROM versions WHERE origine='rotation' AND (objet_id=$1 OR objet_id LIKE $1 || ':%')", [t.id])).rows).toHaveLength(0);
  expect((await s.pool.query("SELECT * FROM versions WHERE origine='suppression' AND (objet_id=$1 OR objet_id LIKE $1 || ':%')", [t.id])).rows).toHaveLength(2);
  expect((await (await lire(autreId, t.token)).json()).versions).toHaveLength(1);
});

test('archives : une partie de plus de 100 Ko passe, et le préflight CORS autorise PATCH et DELETE', async () => {
  const t = await preparer();
  const gros = { ...t.body, partie: { ...t.body.partie, donnees: { ...t.body.partie.donnees, remplissage: 'é'.repeat(150_000) } } };
  expect((await poster(t.id, gros, t.token)).status).toBe(200);
  for (const methode of ['PATCH', 'DELETE']) {
    const reponse = await s.runtime.app.request(`http://localhost:3000${chemin}/parties/${t.id}`, { method: 'OPTIONS', headers: {
      origin: s.origin, 'access-control-request-method': methode, 'access-control-request-headers': 'Authorization,Content-Type' } });
    expect(reponse.headers.get('access-control-allow-methods')).toContain(methode);
  }
});

test('archives : plus de 20 régions refusées (413), révision hors plage refusée (400), rien d\'écrit', async () => {
  const t = await preparer();
  const region = (i: number) => objet('region', `r${i}`, { regionId: `r${i}`, zoneId: 'z' });
  expect((await poster(t.id, { ...t.body, regions: Array.from({ length: 21 }, (_, i) => region(i)) }, t.token)).status).toBe(413);
  const enorme = { ...t.body, partie: { ...t.body.partie, revision: 3_000_000_000 } };
  expect((await poster(t.id, enorme, t.token)).status).toBe(400);
  expect((await s.pool.query('SELECT * FROM versions WHERE objet_id LIKE $1', [`${t.id}%`])).rows).toHaveLength(0);
});
