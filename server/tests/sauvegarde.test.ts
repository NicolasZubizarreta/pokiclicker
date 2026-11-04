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
async function lire(id: string, token: string) {
  const response = await request(`${chemin}/parties/${id}`, undefined, token);
  expect(response.status).toBe(200);
  return response.json();
}

test('migration idempotente', async () => {
  const db = await contexte.pool.connect();
  try { await migrerSauvegarde(db); await migrerSauvegarde(db); } finally { db.release(); }
  expect((await contexte.pool.query('SELECT version FROM migrations_sauvegarde')).rows).toEqual([{ version: 1 }]);
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

test('limite le débit par compte', async () => {
  const { token } = await signup();
  const statuts: number[] = [];
  for (let i = 0; i < 61; i++) statuts.push((await request(`${chemin}/compte`, undefined, token)).status);
  expect(statuts.slice(0, 60).every(s => s === 404)).toBe(true);
  expect(statuts[60]).toBe(429);
});
