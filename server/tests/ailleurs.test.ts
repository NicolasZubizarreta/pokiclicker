import { randomUUID } from 'node:crypto';
import { expect, it } from 'vitest';
import { support } from './support.js';

const s = support();

async function preparer() {
  const { token } = await s.signup();
  const id = randomUUID();
  const a = randomUUID();
  const b = randomUUID();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', origin: s.origin };
  const ecritLe = '2026-01-01T00:00:00.000Z';
  const reponse = await s.runtime.app.request('/api/sauvegarde', {
    method: 'PUT', headers, body: JSON.stringify({ partieId: id, appareilId: randomUUID(),
      partie: { revisionBase: 0, enveloppe: { version: 1, niveau: 'partie', id,
        revision: 0, ecritLe, donnees: { nom: 'Aventure', regionCourante: 'kanto', statistiques: { tempsJeuMs: 42 } } } },
      regions: [{ revisionBase: 0, enveloppe: { version: 1, niveau: 'region', id: 'kanto',
        revision: 0, ecritLe, donnees: { regionId: 'kanto', zoneId: 'kanto.route-1' } } }],
    }),
  });
  expect(reponse.status).toBe(200);
  await s.pool.query('DELETE FROM appareil_actif WHERE partie_id = $1', [id]); // l'appareil de la création ne compte pas dans ces scénarios
  const lister = async (appareilId?: string, jeton = token) => {
    const reponse = await s.runtime.app.request(`/api/sauvegarde/parties${appareilId === undefined ? '' : `?appareilId=${appareilId}`}`,
      { headers: { ...headers, Authorization: `Bearer ${jeton}` } });
    expect(reponse.status).toBe(200);
    const texte = await reponse.text();
    for (const appareil of [a, b]) expect(texte.toLowerCase()).not.toContain(appareil);
    return JSON.parse(texte);
  };
  const activer = async (appareilId: string, reprendre = false) => {
    const reponse = await s.runtime.app.request(`/api/sauvegarde/parties/${id}/appareil`, {
      method: 'POST', headers, body: JSON.stringify({ appareilId, reprendre }),
    });
    expect(reponse.status).toBe(200);
    expect(await reponse.json()).toEqual({ actif: true });
  };
  return { id, a, b, headers, lister, activer };
}

it('conserve la liste sans appareilId et indique les appareils actifs sans exposer leurs identifiants', async () => {
  const { id, a, b, lister, activer } = await preparer();
  const avant = await lister();
  expect(avant).toEqual({ parties: [{ id, nom: 'Aventure', revision: 1, ecritLe: expect.any(String),
    regionCourante: 'kanto', zoneId: 'kanto.route-1', tempsJeuMs: 42 }] });
  expect(await lister(a)).toEqual({ parties: [{ ...avant.parties[0], appareilActif: null }] });
  await activer(a);
  expect(await lister()).toEqual(avant);
  expect(await lister(a.toUpperCase())).toEqual({ parties: [{ ...avant.parties[0], appareilActif: 'cet-appareil' }] });
  expect(await lister(b)).toEqual({ parties: [{ ...avant.parties[0], appareilActif: 'autre' }] });
  await activer(b, true);
  expect((await lister(b)).parties[0].appareilActif).toBe('cet-appareil');
  expect((await lister(a)).parties[0].appareilActif).toBe('autre');
  await s.pool.query("UPDATE appareil_actif SET battement_le = now() - interval '121 seconds' WHERE partie_id = $1", [id]);
  expect((await lister(a)).parties[0].appareilActif).toBeNull();
  expect((await lister(b)).parties[0].appareilActif).toBeNull();
});

it('refuse un appareilId invalide, y compris vide', async () => {
  const { headers } = await preparer();
  for (const appareilId of ['invalide', '']) {
    const reponse = await s.runtime.app.request(`/api/sauvegarde/parties?appareilId=${appareilId}`, { headers });
    expect(reponse.status).toBe(400);
    expect(await reponse.json()).toEqual({ message: 'Sauvegarde invalide.' });
  }
});

it('ne montre ni la partie ni son état à un autre compte', async () => {
  const { a, b, lister, activer } = await preparer();
  await activer(a);
  const autre = await s.signup();
  expect(await lister(b, autre.token)).toEqual({ parties: [] });
});
