import { randomUUID } from 'node:crypto';
import { expect, test, vi } from 'vitest';
import { support } from './support.js';

const contexte = support();
const { request, signup, password, origin, mails } = contexte;

async function remplir() {
  const joueur = await signup();
  const { user } = await joueur.response.json();
  const partieId = randomUUID();
  const donnees = { marqueur: user.id };
  await contexte.pool.query('INSERT INTO donnees_compte VALUES ($1, 1, 1, now(), $2)', [user.id, donnees]);
  await contexte.pool.query("INSERT INTO parties VALUES ($1, $2, 'Partie', 1, 1, now(), $3)", [partieId, user.id, donnees]);
  await contexte.pool.query("INSERT INTO regions VALUES ($1, 'kanto', 1, 1, now(), $2)", [partieId, donnees]);
  await contexte.pool.query(`INSERT INTO versions(compte_id, niveau, objet_id, revision, version, ecrit_le, donnees)
    VALUES ($1, 'partie', $2, 1, 1, now(), $3)`, [user.id, partieId, donnees]);
  return { ...joueur, id: user.id as string, partieId };
}

test('5. quatre IP, trois courriels et réponses neutres identiques', async () => {
  const { email } = await signup();
  const journal = vi.spyOn(console, 'info');
  try {
    const reponses = await Promise.all(Array.from({ length: 4 }, (_, i) =>
      request('/api/auth/request-password-reset', { email, redirectTo: `${origin}/reset` }, undefined, `203.0.113.${100 + i}`)));
    for (const reponse of reponses) expect(reponse.status).toBe(200);
    const corps = await Promise.all(reponses.map(r => r.json()));
    for (const valeur of corps) expect(valeur).toEqual(corps[0]);
    await expect.poll(() => mails.filter(m => m.to === email).length).toBe(3);
    await expect.poll(() => journal.mock.calls.some(([ligne]) => JSON.parse(String(ligne)).evt === 'reinit-limite')).toBe(true);
    expect(mails.filter(m => m.to === email)).toHaveLength(3);
  } finally { journal.mockRestore(); }
});

test('6. Bearer signé obligatoire sur la sauvegarde', async () => {
  const { token } = await remplir();
  expect(token).toContain('.');
  expect((await request('/api/sauvegarde/compte', undefined, token)).status).toBe(200);
  expect((await request('/api/sauvegarde/compte', undefined, token.split('.')[0])).status).toBe(401);
});

test('7. seules les méthodes et routes autorisées atteignent Better Auth', async () => {
  const { token } = await signup();
  for (const chemin of ['change-password', 'change-email', 'update-user', 'list-sessions', 'revoke-session']) {
    const reponse = await request(`/api/auth/${chemin}`, {}, token);
    expect(reponse.status).toBe(404);
    expect(await reponse.json()).toEqual({ message: 'Introuvable.' });
  }
  expect((await request('/api/auth/list-sessions', undefined, token)).status).toBe(404);
  expect((await request('/api/auth/get-session', {}, token)).status).toBe(404);
});

test('8. suppression avec mot de passe et cascades', async () => {
  const joueur = await remplir();
  expect((await request('/api/auth/delete-user', { password: 'incorrect123' }, joueur.token)).ok).toBe(false);
  expect((await request('/api/auth/delete-user', { password }, joueur.token)).status).toBe(200);
  for (const table of ['parties', 'versions', 'donnees_compte']) {
    expect((await contexte.pool.query(`SELECT * FROM ${table} WHERE compte_id = $1`, [joueur.id])).rows).toHaveLength(0);
  }
  expect((await contexte.pool.query('SELECT * FROM regions WHERE partie_id = $1', [joueur.partieId])).rows).toHaveLength(0);
  expect((await request('/api/auth/sign-in/email', { email: joueur.email, password })).status).toBe(401);
  expect((await request('/api/compte/export', undefined, joueur.token)).status).toBe(401);
});

test('8. une session ancienne ne suffit pas à supprimer le compte', async () => {
  const { token, response } = await signup();
  const { user } = await response.json();
  await contexte.pool.query('UPDATE session SET "createdAt" = now() - interval \'2 days\' WHERE "userId" = $1', [user.id]);
  expect((await request('/api/auth/delete-user', {}, token)).ok).toBe(false);
  expect((await request('/api/auth/delete-user', { password }, token)).status).toBe(200);
});

test('8. export complet isolé, Bearer seul et absence de cache', async () => {
  const a = await remplir();
  const b = await remplir();
  const reponse = await request('/api/compte/export', undefined, a.token);
  expect(reponse.status).toBe(200);
  expect(reponse.headers.get('cache-control')).toBe('no-store');
  const contenu = await reponse.json();
  expect(Number.isFinite(Date.parse(contenu.exporteLe))).toBe(true);
  expect(contenu.compte).toMatchObject({ version: 1, revision: 1, donnees: { marqueur: a.id } });
  expect(contenu.parties).toHaveLength(1);
  expect(contenu.parties[0].partie).toMatchObject({ id: a.partieId, donnees: { marqueur: a.id } });
  expect(contenu.parties[0].regions).toEqual([expect.objectContaining({ id: 'kanto', donnees: { marqueur: a.id } })]);
  expect(JSON.stringify(contenu)).not.toContain(b.id);
  expect(JSON.stringify(contenu)).not.toContain(b.partieId);
  expect((await request('/api/compte/export')).status).toBe(401);
  const cookies = a.response.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');
  expect((await contexte.runtime.app.request('/api/compte/export', { headers: { cookie: cookies } })).status).toBe(401);
  const vide = await signup();
  expect(await (await request('/api/compte/export', undefined, vide.token)).json()).toMatchObject({ compte: null, parties: [] });
  expect((await request('/api/compte/export', { texte: 'x'.repeat(103 * 1024) }, a.token)).status).toBe(413);
});

test('9. inscription : nom tronqué et image trop longue supprimée', async () => {
  const email = `${randomUUID()}@example.test`;
  const reponse = await request('/api/auth/sign-up/email', { email, password, name: 'é'.repeat(200), image: `https://example.test/${'a'.repeat(2048)}` });
  expect(reponse.status).toBe(200);
  const { rows } = await contexte.pool.query('SELECT name, image FROM "user" WHERE email = $1', [email]);
  expect(rows[0].name).toBe('é'.repeat(50));
  expect(rows[0].image).toBeNull();
});
