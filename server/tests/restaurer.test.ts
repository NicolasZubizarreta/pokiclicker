import { expect, test } from 'vitest';
import { randomUUID } from 'node:crypto';
import { support } from './support.js';

const s = support();
const chemin = '/api/sauvegarde';
const objet = (niveau: string, id: string, donnees: Record<string, unknown>) =>
  ({ version: 1, niveau, id, revision: 1, ecritLe: '2026-11-04T10:00:00.000Z', donnees });
async function preparer() {
  const { token } = await s.signup();
  const id = randomUUID(), appareilId = randomUUID();
  const partie = objet('partie', id, { nom: 'Archive', regionCourante: 'kanto', statistiques: { tempsJeuMs: 123 } });
  const regions = ['kanto', 'johto'].map(r => objet('region', r, { regionId: r, zoneId: 'route-1' }));
  expect((await s.request(chemin, { partieId: id, appareilId, partie: { revisionBase: 0, enveloppe: partie },
    regions: regions.map(enveloppe => ({ revisionBase: 0, enveloppe })) }, token, undefined, 'PUT')).status).toBe(200);
  const archive = await s.request(`${chemin}/parties/${id}/archives`, { partie, regions }, token);
  return { id, token, appareilId, partie, regions, lot: (await archive.json()).lot as string };
}
const restaurer = (id: string, body: object, token?: string) => s.request(`${chemin}/parties/${id}/restaurer`, body, token);
async function etat(id: string) {
  return Promise.all(['SELECT * FROM parties WHERE id=$1', 'SELECT * FROM regions WHERE partie_id=$1 ORDER BY region_id',
    'SELECT * FROM appareil_actif WHERE partie_id=$1', "SELECT * FROM versions WHERE objet_id=$1 OR objet_id LIKE $1 || ':%' ORDER BY id"]
    .map(async sql => (await s.pool.query(sql, [id])).rows));
}

test('restauration complète, nom conservé, historique et prise de main', async () => {
  const t = await preparer();
  for (let i = 0; i < 4; i++) await s.request(`${chemin}/parties/${t.id}/archives`, { partie: t.partie, regions: t.regions }, t.token);
  await s.request(`${chemin}/parties/${t.id}`, { nom: 'Serveur' }, t.token, undefined, 'PATCH');
  await s.pool.query("UPDATE parties SET revision=7, donnees=jsonb_set(donnees,'{statistiques,tempsJeuMs}','999') WHERE id=$1", [t.id]);
  await s.pool.query("UPDATE regions SET revision=9, donnees=jsonb_set(donnees,'{zoneId}','\"route-2\"') WHERE partie_id=$1", [t.id]);
  await s.pool.query("UPDATE regions SET region_id='hoenn' WHERE partie_id=$1 AND region_id='johto'", [t.id]);
  const avant = await etat(t.id);
  const b = randomUUID();
  const response = await restaurer(t.id, { appareilId: b, lot: t.lot }, t.token);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ ok: true, partie: { id: t.id, revision: 8 } });
  const lu = await (await s.request(`${chemin}/parties/${t.id}`, undefined, t.token)).json();
  expect(lu.partie.donnees).toEqual({ ...t.partie.donnees, nom: 'Serveur' });
  expect(lu.regions).toEqual([expect.objectContaining({ id: 'johto', revision: 1, donnees: t.regions[1]!.donnees }),
    expect.objectContaining({ id: 'kanto', revision: 10, donnees: t.regions[0]!.donnees })]);
  const apres = await etat(t.id);
  expect(apres[2]![0].appareil_id).toBe(b);
  const historique = apres[3]!.filter(v => v.origine === 'restauration');
  expect(historique).toHaveLength(3);
  for (const ligne of [...avant[0]!, ...avant[1]!]) expect(historique).toContainEqual(expect.objectContaining({
    revision: ligne.revision, version: ligne.version, ecrit_le: ligne.ecrit_le, donnees: ligne.donnees }));
  const versions = (await (await s.request(`${chemin}/parties/${t.id}/versions`, undefined, t.token)).json()).versions;
  expect(versions).toHaveLength(5);
  expect(versions[0]).toMatchObject({ origine: 'restauration', tempsJeuMs: 999, zoneId: 'route-2' });
  const put = (appareilId: string) => s.request(chemin, { partieId: t.id, appareilId,
    partie: { revisionBase: 8, enveloppe: lu.partie }, regions: lu.regions.map((enveloppe: { revision: number }) =>
      ({ revisionBase: enveloppe.revision, enveloppe })) }, t.token, undefined, 'PUT');
  const refuse = await put(t.appareilId);
  expect(refuse.status).toBe(409);
  expect(await refuse.json()).toMatchObject({ code: 'ailleurs' });
  expect((await put(b)).status).toBe(200);
});

test('validation, session et isolation sans modification', async () => {
  const t = await preparer();
  const body = { appareilId: randomUUID(), lot: t.lot };
  expect((await restaurer(t.id, body)).status).toBe(401);
  for (const invalide of [{ lot: t.lot }, { ...body, lot: 1 }, { ...body, appareilId: false }, { ...body, inconnu: true }, []]) {
    const r = await restaurer(t.id, invalide, t.token);
    expect(r.status).toBe(400);
    expect(await r.json()).toEqual({ message: 'Sauvegarde invalide.' });
  }
  const autre = await s.signup();
  for (const id of [t.id, randomUUID(), 'invalide']) {
    const r = await restaurer(id, body, autre.token);
    expect(r.status).toBe(404);
    expect(await r.json()).toEqual({ message: 'Partie introuvable.' });
  }
  const avant = await etat(t.id);
  for (const mode of ['inconnu', 'autre', 'rotation', 'incomplet']) {
    const lot = randomUUID();
    if (mode !== 'inconnu') await s.pool.query(`INSERT INTO versions(compte_id,niveau,objet_id,revision,version,ecrit_le,donnees,origine,lot)
      SELECT compte_id,niveau,CASE WHEN $3='autre' THEN $4 || CASE WHEN niveau='region' THEN ':kanto' ELSE '' END ELSE objet_id END,
        revision,version,ecrit_le,donnees,CASE WHEN $3='rotation' THEN 'rotation' ELSE 'divergence' END,$2
      FROM versions WHERE lot=$1 AND ($3 <> 'incomplet' OR niveau='partie')`, [t.lot, lot, mode, randomUUID()]);
    const justeAvant = await etat(t.id);
    const r = await restaurer(t.id, { ...body, lot }, t.token);
    expect(r.status).toBe(404);
    expect(await r.json()).toEqual({ message: 'Sauvegarde introuvable.' });
    expect(await etat(t.id)).toEqual(justeAvant);
  }
  expect((await etat(t.id)).slice(0, 3)).toEqual(avant.slice(0, 3));
});
