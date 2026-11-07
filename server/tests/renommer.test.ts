import { randomUUID } from 'node:crypto';
import { expect, it } from 'vitest';
import { support } from './support.js';

const s = support();
const api = '/api/sauvegarde';

async function preparer() {
  const { token } = await s.signup();
  const id = randomUUID();
  const enveloppe = { version: 1, niveau: 'partie', id, revision: 0,
    ecritLe: '2026-01-01T00:00:00.000Z', donnees: { nom: 'Ancien nom' } };
  const reponse = await s.request(api, { partieId: id, partie: { revisionBase: 0, enveloppe } }, token, undefined, 'PUT');
  expect(reponse.status).toBe(200);
  await s.pool.query('DELETE FROM appareil_actif WHERE partie_id = $1', [id]); // la création ne retient aucun appareil actif
  return { token, id, enveloppe };
}

it('renomme sans changer revision, version, date ou historique et nettoie les espaces', async () => {
  const { token, id } = await preparer();
  const avant = (await s.pool.query('SELECT * FROM parties WHERE id = $1', [id])).rows[0];
  const versions = (await s.pool.query('SELECT * FROM versions')).rows;
  const reponse = await s.request(`${api}/parties/${id}`, { nom: ' Ma partie ' }, token, undefined, 'PATCH');
  expect(reponse.status).toBe(200);
  expect(await reponse.json()).toEqual({ nom: 'Ma partie' });
  expect((await s.pool.query('SELECT * FROM parties WHERE id = $1', [id])).rows[0])
    .toEqual({ ...avant, nom: 'Ma partie', donnees: { ...avant.donnees, nom: 'Ma partie' } });
  expect((await s.pool.query('SELECT * FROM versions')).rows).toEqual(versions);
  expect(await (await s.request(`${api}/parties`, undefined, token)).json()).toMatchObject({
    parties: [{ id, nom: 'Ma partie', revision: avant.revision, ecritLe: avant.ecrit_le.toISOString() }],
  });
  expect(await (await s.request(`${api}/parties/${id}`, undefined, token)).json()).toMatchObject({
    partie: { revision: avant.revision, version: avant.version,
      ecritLe: avant.ecrit_le.toISOString(), donnees: { nom: 'Ma partie' } },
  });
});

it.each([
  { nom: '' }, { nom: '   ' }, { nom: 'a'.repeat(101) }, { nom: 'x', autre: true },
  { nom: 'a\u0000b' }, { nom: 12 }, {}, null, [],
])('refuse un corps invalide : %j', async corps => {
  const { token, id } = await preparer();
  const reponse = await s.runtime.app.request(`http://localhost:3000${api}/parties/${id}`, {
    method: 'PATCH', headers: { origin: s.origin, authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(corps),
  });
  expect(reponse.status).toBe(400);
  expect(await reponse.json()).toEqual({ message: 'Sauvegarde invalide.' });
});

it('refuse un JSON illisible', async () => {
  const { token, id } = await preparer();
  const reponse = await s.runtime.app.request(`http://localhost:3000${api}/parties/${id}`, {
    method: 'PATCH', headers: { origin: s.origin, authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: '{',
  });
  expect(reponse.status).toBe(400);
  expect(await reponse.json()).toEqual({ message: 'Sauvegarde invalide.' });
});

it('masque les parties absentes ou appartenant a un autre compte et exige une session', async () => {
  const { token, id } = await preparer();
  const autre = await s.signup();
  for (const [cible, session] of [[id, autre.token], [randomUUID(), token], ['invalide', token]]) {
    const reponse = await s.request(`${api}/parties/${cible}`, { nom: 'Nom' }, session, undefined, 'PATCH');
    expect(reponse.status).toBe(404);
    expect(await reponse.json()).toEqual({ message: 'Partie introuvable.' });
  }
  expect((await s.request(`${api}/parties/${id}`, { nom: 'Nom' }, undefined, undefined, 'PATCH')).status).toBe(401);
});

it('conserve le nouveau nom au PUT de l’appareil actif avec son ancien nom', async () => {
  const { token, id, enveloppe } = await preparer();
  const appareilId = randomUUID();
  expect((await s.request(`${api}/parties/${id}/appareil`, { appareilId }, token)).status).toBe(200);
  const actif = (await s.pool.query('SELECT * FROM appareil_actif WHERE partie_id = $1', [id])).rows[0];
  expect((await s.request(`${api}/parties/${id}`, { nom: 'Nouveau nom' }, token, undefined, 'PATCH')).status).toBe(200);
  expect((await s.pool.query('SELECT * FROM appareil_actif WHERE partie_id = $1', [id])).rows[0]).toEqual(actif);
  const reponse = await s.request(api, { partieId: id, appareilId,
    partie: { revisionBase: 1, enveloppe: { ...enveloppe, revision: 1, donnees: { nom: 'Ancien nom', progression: 42 } } },
  }, token, undefined, 'PUT');
  expect(reponse.status).toBe(200);
  expect((await s.pool.query('SELECT nom, donnees, revision FROM parties WHERE id = $1', [id])).rows[0])
    .toEqual({ nom: 'Nouveau nom', donnees: { nom: 'Nouveau nom', progression: 42 }, revision: 2 });
  expect((await s.pool.query("SELECT donnees FROM versions WHERE niveau = 'partie' AND objet_id = $1", [id])).rows)
    .toEqual([{ donnees: { nom: 'Nouveau nom' } }]);
});

it('garde le nom envoye au PUT d’une partie neuve', async () => {
  const { id } = await preparer();
  expect((await s.pool.query('SELECT nom, donnees FROM parties WHERE id = $1', [id])).rows[0])
    .toEqual({ nom: 'Ancien nom', donnees: { nom: 'Ancien nom' } });
});
