import { expect, test } from 'vitest';
import { randomUUID } from 'node:crypto';
import { support } from './support.js';
import { migrerSauvegarde } from '../src/schema.js';

const contexte = support();
const { request, signup, origin } = contexte;
const chemin = '/api/sauvegarde';
const date = '2026-11-04T10:00:00.000Z';
function objet(niveau: string, id: string, revisionBase = 0, donnees: Record<string, unknown> = {}) {
  return { revisionBase, enveloppe: { version: 1, niveau, id, revision: 987, ecritLe: date, donnees } };
}
function corps(id = randomUUID()) {
  return { partieId: id, compte: objet('compte', 'local', 0, { theme: 'nuit' }),
    partie: objet('partie', id, 0, { nom: 'Ma partie', regionCourante: 'kanto' }),
    regions: [objet('region', 'kanto', 0, { regionId: 'kanto', zoneId: 'route-1', etape: 2 })] };
}
const put = (body: object, token?: string) => request(chemin, body, token, undefined, 'PUT');
const archiver = (niveau: string, objetId: string, enveloppe: object, token?: string) =>
  request(`${chemin}/versions`, { niveau, objetId, enveloppe }, token);

test('liste des parties du compte par date decroissante', async () => {
  expect((await request(`${chemin}/parties`)).status).toBe(401);
  const { token } = await signup();
  expect(await (await request(`${chemin}/parties`, undefined, token)).json()).toEqual({ parties: [] });
  const premier = corps();
  const second = corps();
  second.partie.enveloppe.ecritLe = '2026-11-04T11:00:00.000Z';
  for (const body of [premier, second]) expect((await put({ partieId: body.partieId, partie: body.partie }, token)).status).toBe(200);
  expect((await put(corps(), (await signup()).token)).status).toBe(200);
  const response = await request(`${chemin}/parties`, undefined, token);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ parties: [second, premier].map(body => ({
    id: body.partieId, nom: 'Ma partie', revision: 1, ecritLe: body.partie.enveloppe.ecritLe,
    regionCourante: 'kanto', zoneId: null, tempsJeuMs: null,
  })) });
});

test('liste : région, zone et temps de jeu résistent aux données mal typées', async () => {
  const { token } = await signup();
  for (const [regionCourante, zoneId, statistiques, attendu] of [
    ['kanto', 'route-1', { tempsJeuMs: 1234 }, 1234],
    ['kanto', 'route-1', { tempsJeuMs: 0 }, 0],
    ['kanto', 'route-1', {}, null],
    ['kanto', 'route-1', { tempsJeuMs: '1234' }, null],
    ['kanto', 'route-1', { tempsJeuMs: -1 }, null],
    ['kanto', 'route-1', { tempsJeuMs: {} }, null],
    ['kanto', 'route-1', { tempsJeuMs: true }, null],
    ['kanto', 42, null, null],
    [42, 'route-1', [], null],
    [null, null, 'invalide', null],
    [undefined, undefined, undefined, null],
  ] as const) {
    const body = corps();
    body.partie.enveloppe.donnees = { ...body.partie.enveloppe.donnees, regionCourante, statistiques };
    body.regions[0]!.enveloppe.donnees = { ...body.regions[0]!.enveloppe.donnees, zoneId };
    expect((await put({ partieId: body.partieId, partie: body.partie, regions: body.regions }, token)).status).toBe(200);
    const response = await request(`${chemin}/parties`, undefined, token);
    expect(response.status).toBe(200);
    const { parties } = await response.json();
    expect(parties.find((p: { id: string }) => p.id === body.partieId)).toMatchObject({
      regionCourante: typeof regionCourante === 'string' ? regionCourante : null,
      zoneId: typeof regionCourante === 'string' && typeof zoneId === 'string' ? zoneId : null,
      tempsJeuMs: attendu,
    });
  }
});

test('suppression : session, identifiant et isolation entre comptes', async () => {
  const body = corps();
  const { token } = await signup();
  expect((await put(body, token)).status).toBe(200);
  expect((await request(`${chemin}/parties/${body.partieId}`, undefined, undefined, undefined, 'DELETE')).status).toBe(401);
  const autre = await signup();
  const avant = await contexte.pool.query('SELECT * FROM parties WHERE id = $1', [body.partieId]);
  for (const id of ['invalide', randomUUID(), body.partieId]) {
    const response = await request(`${chemin}/parties/${id}`, undefined, autre.token, undefined, 'DELETE');
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ message: 'Partie introuvable.' });
  }
  expect((await contexte.pool.query('SELECT * FROM parties WHERE id = $1', [body.partieId])).rows).toEqual(avant.rows);
});

test('suppression : cascades, archives, autre partie, compte et recréation', async () => {
  const { token } = await signup();
  const premiere = corps();
  const seconde = corps();
  expect((await put(premiere, token)).status).toBe(200);
  expect((await put({ partieId: seconde.partieId, partie: seconde.partie, regions: seconde.regions }, token)).status).toBe(200);
  for (const body of [premiere, seconde]) {
    expect((await request(`${chemin}/parties/${body.partieId}/appareil`, { appareilId: randomUUID() }, token, undefined, 'POST')).status).toBe(200);
    body.partie.revisionBase = 1;
    body.regions[0]!.revisionBase = 1;
    expect((await put({ partieId: body.partieId, partie: body.partie, regions: body.regions }, token)).status).toBe(200);
    expect((await contexte.pool.query('SELECT * FROM versions WHERE objet_id = $1 OR objet_id LIKE $1 || \':%\'', [body.partieId])).rows).toHaveLength(2);
  }
  const compteAvant = await (await request(`${chemin}/compte`, undefined, token)).json();
  const autreAvant = await lire(seconde.partieId, token);
  const archivesAvant = (await contexte.pool.query('SELECT * FROM versions WHERE objet_id = $1 OR objet_id LIKE $1 || \':%\' ORDER BY id', [seconde.partieId])).rows;
  const response = await request(`${chemin}/parties/${premiere.partieId}`, undefined, token, undefined, 'DELETE');
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ ok: true });
  expect((await request(`${chemin}/parties/${premiere.partieId}`, undefined, token)).status).toBe(404);
  expect((await contexte.pool.query('SELECT * FROM regions WHERE partie_id = $1', [premiere.partieId])).rows).toEqual([]);
  expect((await contexte.pool.query('SELECT * FROM appareil_actif WHERE partie_id = $1', [premiere.partieId])).rows).toEqual([]);
  expect((await contexte.pool.query('SELECT * FROM versions WHERE objet_id = $1 OR objet_id LIKE $1 || \':%\'', [premiere.partieId])).rows).toEqual([]);
  expect(await lire(seconde.partieId, token)).toEqual(autreAvant);
  expect((await contexte.pool.query('SELECT * FROM versions WHERE objet_id = $1 OR objet_id LIKE $1 || \':%\' ORDER BY id', [seconde.partieId])).rows).toEqual(archivesAvant);
  expect(await (await request(`${chemin}/compte`, undefined, token)).json()).toEqual(compteAvant);
  const recreation = corps(premiere.partieId);
  expect((await put({ partieId: recreation.partieId, partie: recreation.partie, regions: recreation.regions }, token)).status).toBe(200);
  expect((await lire(premiere.partieId, token)).partie.revision).toBe(1);
});

test('versions : session, isolation et validation', async () => {
  const body = corps();
  expect((await archiver('partie', body.partieId, body.partie.enveloppe)).status).toBe(401);
  const premier = await signup();
  const { token, email } = await signup();
  expect((await put(body, premier.token)).status).toBe(200);
  for (const [niveau, id, enveloppe] of [
    ['partie', body.partieId, body.partie.enveloppe],
    ['region', `${body.partieId}:kanto`, body.regions[0]!.enveloppe],
  ] as const) {
    const response = await archiver(niveau, id, enveloppe, token);
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ message: 'Partie introuvable.' });
  }
  for (const [niveau, enveloppe] of [['inconnu', body.partie.enveloppe], ['partie', {}]] as const) {
    const response = await archiver(niveau, body.partieId, enveloppe, token);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: 'Sauvegarde invalide.' });
  }
  const local = corps();
  expect((await put(local, token)).status).toBe(200);
  for (const [niveau, id, enveloppe] of [
    ['compte', premier.email, local.compte.enveloppe],
    ['partie', local.partieId, local.partie.enveloppe],
    ['region', `${local.partieId}:kanto`, local.regions[0]!.enveloppe],
  ] as const) {
    const response = await archiver(niveau, id, enveloppe, token);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    const { rows } = await contexte.pool.query(`SELECT v.* FROM versions v JOIN "user" u ON u.id = v.compte_id
      WHERE u.email = $1 AND v.niveau = $2`, [email, niveau]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ objet_id: niveau === 'compte' ? rows[0].compte_id : id,
      revision: enveloppe.revision, version: enveloppe.version, donnees: enveloppe.donnees });
    expect(rows[0].ecrit_le.toISOString()).toBe(enveloppe.ecritLe);
  }
});

test('versions : refuse une partie inexistante sans créer d’archive', async () => {
  const { token, email } = await signup();
  const body = corps();
  for (const [niveau, id, enveloppe] of [
    ['partie', body.partieId, body.partie.enveloppe],
    ['region', `${body.partieId}:kanto`, body.regions[0]!.enveloppe],
  ] as const) {
    const response = await archiver(niveau, id, enveloppe, token);
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ message: 'Partie introuvable.' });
    expect((await contexte.pool.query(`SELECT v.* FROM versions v JOIN "user" u ON u.id = v.compte_id
      WHERE u.email = $1`, [email])).rows).toEqual([]);
  }
});

test('versions : purge par insertion puis remplacement PUT', async () => {
  const { token } = await signup();
  const body = corps();
  expect((await put(body, token)).status).toBe(200);
  for (const revision of [900, 800, 700, 600, 500, 400]) {
    expect((await archiver('partie', body.partieId, { ...body.partie.enveloppe, revision }, token)).status).toBe(200);
  }
  const revisions = async () => (await contexte.pool.query('SELECT revision FROM versions WHERE objet_id = $1 ORDER BY id DESC', [body.partieId])).rows;
  expect(await revisions()).toEqual([400, 500, 600, 700, 800].map(revision => ({ revision })));
  expect((await put({ partieId: body.partieId, partie: { ...body.partie, revisionBase: 1 } }, token)).status).toBe(200);
  expect(await revisions()).toEqual([1, 400, 500, 600, 700].map(revision => ({ revision })));
});

test("versions : plafond d'historique par compte", async () => {
  const { token, email } = await signup();
  const id = (await contexte.pool.query('SELECT id FROM "user" WHERE email = $1', [email])).rows[0].id;
  await contexte.pool.query(`INSERT INTO versions(compte_id, niveau, objet_id, revision, version, ecrit_le, donnees)
    SELECT $1, 'partie', gen_random_uuid()::text, 1, 1, now(), '{}' FROM generate_series(1, 205)`, [id]);
  const body = corps();
  expect((await put(body, token)).status).toBe(200);
  expect((await archiver('partie', body.partieId, body.partie.enveloppe, token)).status).toBe(200);
  expect(Number((await contexte.pool.query('SELECT count(*) FROM versions WHERE compte_id = $1', [id])).rows[0].count)).toBe(200);
});

test('versions : limites de taille', async () => {
  const { token } = await signup();
  for (const [taille, statut] of [[200_000, 200], [1_100_000, 413], [3_200_000, 413]] as const) {
    expect((await archiver('compte', 'local', objet('compte', 'local', 0, { texte: 'x'.repeat(taille) }).enveloppe, token)).status).toBe(statut);
  }
});
async function lire(id: string, token: string) {
  const response = await request(`${chemin}/parties/${id}`, undefined, token);
  expect(response.status).toBe(200);
  return response.json();
}

test('migration idempotente', async () => {
  const db = await contexte.pool.connect();
  try { await migrerSauvegarde(db); await migrerSauvegarde(db); } finally { db.release(); }
  expect((await contexte.pool.query('SELECT version FROM migrations_sauvegarde')).rows).toEqual([{ version: 1 }, { version: 2 }]);
});

test('appareil : session, isolation et validation', async () => {
  const id = randomUUID();
  const appareilId = randomUUID();
  const poster = (partie: string, body: object, token?: string) =>
    request(`${chemin}/parties/${partie}/appareil`, body, token, undefined, 'POST');
  expect((await poster(id, { appareilId })).status).toBe(401);
  const { token } = await signup();
  for (const partie of [id, 'invalide']) {
    const response = await poster(partie, { appareilId }, token);
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ message: 'Partie introuvable.' });
  }
  await put(corps(id), token);
  const autre = await signup();
  const response = await poster(id, { appareilId }, autre.token);
  expect(response.status).toBe(404);
  expect(await response.json()).toEqual({ message: 'Partie introuvable.' });
  for (const body of [{ appareilId: 'invalide' }, { appareilId: 42 }, {},
    { appareilId, battementLe: date }, { appareilId, reprendre: 'true' }, { appareilId, reprendre: null }]) {
    const invalide = await poster(id, body, token);
    expect(invalide.status).toBe(400);
    expect(await invalide.json()).toEqual({ message: 'Sauvegarde invalide.' });
  }
});

test('appareil : prise, renouvellement, reprise et expiration', async () => {
  const { token } = await signup();
  const id = randomUUID();
  const a = randomUUID();
  const b = randomUUID();
  await put(corps(id), token);
  const poster = async (appareilId: string, actif: boolean, reprendre?: boolean) => {
    const response = await request(`${chemin}/parties/${id}/appareil`,
      { appareilId, ...(reprendre === undefined ? {} : { reprendre }) }, token, undefined, 'POST');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ actif });
  };
  const ligne = async () => (await contexte.pool.query('SELECT * FROM appareil_actif WHERE partie_id = $1', [id])).rows[0];
  await poster(a, true);
  expect((await ligne()).appareil_id).toBe(a);
  await contexte.pool.query("UPDATE appareil_actif SET battement_le = now() - interval '60 seconds' WHERE partie_id = $1", [id]);
  const avant = await ligne();
  await poster(a, true);
  const apres = await ligne();
  expect(apres.battement_le.getTime()).toBeGreaterThan(avant.battement_le.getTime());
  await poster(b, false);
  expect(await ligne()).toEqual(apres);
  await poster(b, true, true);
  expect((await ligne()).appareil_id).toBe(b);
  await poster(a, false);
  await contexte.pool.query("UPDATE appareil_actif SET appareil_id = $2, battement_le = now() - interval '121 seconds' WHERE partie_id = $1", [id, a]);
  await poster(b, true);
  expect((await ligne()).appareil_id).toBe(b);
  await contexte.pool.query("UPDATE appareil_actif SET appareil_id = $2, battement_le = now() - interval '119 seconds' WHERE partie_id = $1", [id, a]);
  const recent = await ligne();
  await poster(b, false);
  expect(await ligne()).toEqual(recent);
});

test('connexion requise sans jeton ou avec un jeton invalide', async () => {
  for (const token of [undefined, 'invalide']) {
    for (const response of [await request(`${chemin}/compte`, undefined, token), await put(corps(), token)]) {
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ message: 'Connexion requise.' });
      expect(response.headers.get('cache-control')).toBe('no-store');
    }
  }
});

test('création, relecture et mise à jour historisée', async () => {
  const { token } = await signup();
  const body = corps();
  const response = await put(body, token);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ compte: { revision: 1 }, partie: { id: body.partieId, revision: 1 }, regions: [{ id: 'kanto', revision: 1 }] });
  expect(await lire(body.partieId, token)).toEqual({
    partie: { ...body.partie.enveloppe, revision: 1 }, regions: [{ ...body.regions[0]!.enveloppe, revision: 1 }],
  });
  expect(await (await request(`${chemin}/compte`, undefined, token)).json()).toEqual({ enveloppe: { ...body.compte.enveloppe, revision: 1 } });
  const partie = objet('partie', body.partieId, 1, { nom: 'Nouveau nom' });
  expect((await put({ partieId: body.partieId, partie }, token)).status).toBe(200);
  expect((await lire(body.partieId, token)).partie).toEqual({ ...partie.enveloppe, revision: 2 });
  const versions = (await contexte.pool.query('SELECT revision, donnees FROM versions WHERE objet_id = $1', [body.partieId])).rows;
  expect(versions).toEqual([{ revision: 1, donnees: body.partie.enveloppe.donnees }]);
});

test('tous les conflits et aucun changement des autres objets', async () => {
  const { token } = await signup();
  const body = corps();
  expect((await put(body, token)).status).toBe(200);
  const avant = await lire(body.partieId, token);
  const response = await put({ ...body, compte: { ...body.compte, revisionBase: 1 } }, token);
  expect(response.status).toBe(409);
  expect(await response.json()).toEqual({ message: 'Cette sauvegarde a changé depuis ta dernière lecture.', conflits: [
    { niveau: 'partie', id: body.partieId, revisionServeur: 1, ecritLe: date, resume: { nom: 'Ma partie', regionCourante: 'kanto' } },
    { niveau: 'region', id: 'kanto', revisionServeur: 1, ecritLe: date, resume: { zoneId: 'route-1', etape: 2 } },
  ] });
  expect(await lire(body.partieId, token)).toEqual(avant);
  expect((await (await request(`${chemin}/compte`, undefined, token)).json()).enveloppe.revision).toBe(1);
  expect((await contexte.pool.query('SELECT * FROM versions WHERE objet_id = $1', [body.partieId])).rows).toEqual([]);
  const absent = randomUUID();
  const manque = await put({ partieId: absent, partie: objet('partie', absent, 3, { nom: 'Absente' }) }, token);
  expect(manque.status).toBe(409);
  expect((await manque.json()).conflits).toEqual([{ niveau: 'partie', id: absent, revisionServeur: 0, ecritLe: null, resume: {} }]);
});

test('une région périmée empêche la mise à jour de la partie', async () => {
  const { token } = await signup();
  const body = corps();
  expect((await put(body, token)).status).toBe(200);
  const avant = await lire(body.partieId, token);
  const response = await put({ partieId: body.partieId,
    partie: objet('partie', body.partieId, 1, { nom: 'Modification interdite' }), regions: body.regions }, token);
  expect(response.status).toBe(409);
  expect(await lire(body.partieId, token)).toEqual(avant);
  expect((await contexte.pool.query('SELECT * FROM versions WHERE objet_id = $1', [body.partieId])).rows).toEqual([]);
});

test('isolation entre comptes en lecture et en écriture', async () => {
  const premier = await signup();
  const second = await signup();
  const body = corps();
  expect((await put(body, premier.token)).status).toBe(200);
  const avant = await lire(body.partieId, premier.token);
  expect((await request(`${chemin}/compte`, undefined, second.token)).status).toBe(404);
  for (const response of [await request(`${chemin}/parties/${body.partieId}`, undefined, second.token),
    await put({ partieId: body.partieId, partie: { ...body.partie, revisionBase: 1 } }, second.token),
    await put({ partieId: body.partieId, compte: body.compte, regions: body.regions }, second.token),
    await put({ partieId: randomUUID(), regions: body.regions }, second.token),
    await request(`${chemin}/parties/invalide`, undefined, second.token)]) {
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ message: 'Partie introuvable.' });
  }
  expect(await lire(body.partieId, premier.token)).toEqual(avant);
  expect((await request(`${chemin}/compte`, undefined, second.token)).status).toBe(404);
});

test('validation de la forme et des champs inconnus', async () => {
  const { token } = await signup();
  const body = corps();
  const variantes: object[] = [
    {}, { regions: [] }, { compteId: 'usurpation', compte: body.compte },
    { partie: body.partie }, { partieId: 'invalide', partie: body.partie },
    { partieId: body.partieId, partie: objet('region', body.partieId, 0, { nom: 'Nom' }) },
    { partieId: body.partieId, partie: objet('partie', randomUUID(), 0, { nom: 'Nom' }) },
    { compte: { ...body.compte, enveloppe: { ...body.compte.enveloppe, donnees: [] } } },
    { compte: { ...body.compte, enveloppe: { ...body.compte.enveloppe, donnees: null } } },
    { compte: { ...body.compte, inconnu: 1 } },
    { compte: { ...body.compte, enveloppe: { ...body.compte.enveloppe, inconnu: 1 } } },
    { ...body, regions: [...body.regions, ...body.regions] },
    { ...body, regions: [objet('region', 'kanto', 0, { regionId: 'johto' })] },
    { ...body, partie: objet('partie', body.partieId, 0, { nom: '' }) },
    { compte: objet('compte', 'avec:separateur') },
    { compte: { ...body.compte, revisionBase: -1 } },
    { compte: { ...body.compte, enveloppe: { ...body.compte.enveloppe, ecritLe: 'hier' } } },
  ];
  for (const variante of variantes) expect((await put(variante, token)).status).toBe(400);
});

test('limites de taille de l’enveloppe et du corps', async () => {
  const { token } = await signup();
  expect((await put({ compte: objet('compte', 'local', 0, { texte: 'é'.repeat(500_001) }) }, token)).status).toBe(413);
  const id = randomUUID();
  const regions = Array.from({ length: 4 }, (_, i) => objet('region', `region-${i}`, 0,
    { regionId: `region-${i}`, texte: 'x'.repeat(800_000) }));
  expect((await put({ partieId: id, partie: objet('partie', id, 0, { nom: 'Nom' }), regions }, token)).status).toBe(413);
  // La limite globale de 100 ko est bien sautée pour cette route.
  expect((await put({ compte: objet('compte', 'local', 0, { texte: 'x'.repeat(150_000) }) }, token)).status).toBe(200);
});

test('historique limité aux cinq dernières révisions remplacées', async () => {
  const { token } = await signup();
  const body = corps();
  expect((await put(body, token)).status).toBe(200);
  for (let revision = 1; revision <= 7; revision++) {
    const response = await put({ partieId: body.partieId, partie: objet('partie', body.partieId, revision, { nom: `Partie ${revision}` }) }, token);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ partie: { id: body.partieId, revision: revision + 1 } });
  }
  expect((await contexte.pool.query('SELECT revision FROM versions WHERE objet_id = $1 ORDER BY revision DESC', [body.partieId])).rows)
    .toEqual([7, 6, 5, 4, 3].map(revision => ({ revision })));
});

test('préflight CORS autorise PUT', async () => {
  const response = await contexte.runtime.app.request(chemin, { method: 'OPTIONS', headers: {
    origin, 'access-control-request-method': 'PUT', 'access-control-request-headers': 'Authorization,Content-Type',
  } });
  expect(response.status).toBe(204);
  expect(response.headers.get('access-control-allow-origin')).toBe(origin);
  expect(response.headers.get('access-control-allow-methods')).toContain('PUT');
});

test('refuse en 400 ce que Postgres refuserait (caractère nul, date impossible), jamais 500', async () => {
  const { token } = await signup();
  const nul = await put({ compte: objet('compte', 'local', 0, { a: '\u0000' }) }, token);
  expect(nul.status).toBe(400);
  const jour = await put({ compte: { revisionBase: 0, enveloppe: { ...objet('compte', 'local').enveloppe, ecritLe: '2024-02-31T00:00:00Z' } } }, token);
  expect(jour.status).toBeLessThan(500);
});

test('plafonne les parties par compte et les régions par partie', async () => {
  const { token } = await signup();
  for (let i = 0; i < 20; i++) {
    const id = randomUUID();
    expect((await put({ partieId: id, partie: objet('partie', id, 0, { nom: `P${i}` }) }, token)).status).toBe(200);
  }
  const trop = randomUUID();
  const refus = await put({ partieId: trop, partie: objet('partie', trop, 0, { nom: 'Une de trop' }) }, token);
  expect(refus.status).toBe(413);
  expect((await request(`${chemin}/parties/${trop}`, undefined, token)).status).toBe(404);
  const id = randomUUID();
  const regions = Array.from({ length: 21 }, (_, i) => objet('region', `r${i}`, 0, { regionId: `r${i}` }));
  const tropDeRegions = await put({ partieId: id, partie: objet('partie', id, 0, { nom: 'Régions' }), regions }, token);
  expect(tropDeRegions.status).toBe(413);
});

test('plafonne les créations concurrentes à vingt parties par compte', async () => {
  const { token, email } = await signup();
  for (let i = 0; i < 19; i++) {
    const body = corps();
    expect((await put({ partieId: body.partieId, partie: body.partie }, token)).status).toBe(200);
  }
  const reponses = await Promise.all([corps(), corps()].map(body =>
    put({ partieId: body.partieId, partie: body.partie }, token)));
  expect(reponses.map(response => response.status).sort()).toEqual([200, 413]);
  expect(await reponses.find(response => response.status === 413)!.json()).toEqual({ message: 'Trop de parties.' });
  const { rows } = await contexte.pool.query(`SELECT count(*) FROM parties p JOIN "user" u ON u.id = p.compte_id
    WHERE u.email = $1`, [email]);
  expect(Number(rows[0].count)).toBe(20);
});

test('limite le débit par compte', async () => {
  const { token } = await signup();
  const statuts: number[] = [];
  for (let i = 0; i < 61; i++) statuts.push((await request(`${chemin}/compte`, undefined, token)).status);
  expect(statuts.slice(0, 60).every(s => s === 404)).toBe(true);
  expect(statuts[60]).toBe(429);
});
