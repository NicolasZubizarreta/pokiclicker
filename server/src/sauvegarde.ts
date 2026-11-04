import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import type { Pool, PoolClient } from 'pg';

type Auth = { api: { getSession: (options: { headers: Headers }) => Promise<{ user: { id: string } } | null> } };
type Objet = Record<string, unknown>;
type Enveloppe = { version: number; niveau: string; id: string; revision: number; ecritLe: string; donnees: Objet };
type Envoi = { revisionBase: number; enveloppe: Enveloppe };
type Corps = { partieId?: string; compte?: Envoi; partie?: Envoi; regions?: Envoi[] };
type Ligne = { revision: number; version: number; ecrit_le: Date; donnees: Objet };
const objet = (v: unknown): v is Objet => typeof v === 'object' && v !== null && !Array.isArray(v);
const entier = (v: unknown): v is number => Number.isSafeInteger(v) && Number(v) >= 0;
const texte = (v: unknown): v is string => typeof v === 'string' && v.length >= 1 && v.length <= 100;
const uuid = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const MAX_PARTIES = 20;
const MAX_REGIONS = 20;
const DEBIT_MAX = 60;
const MAX_VERSIONS = 200; // plafond d'historique par compte : l'archivage d'une version écartée ne doit pas remplir la base
const champs = (v: Objet, permis: string[]) => Object.keys(v).every(k => permis.includes(k));

async function purgerVersions(db: PoolClient, compteId: string, niveau: string, objetId: string) {
  await db.query(`DELETE FROM versions WHERE compte_id = $1 AND niveau = $2 AND objet_id = $3
    AND id NOT IN (SELECT id FROM versions WHERE compte_id = $1 AND niveau = $2 AND objet_id = $3 ORDER BY id DESC LIMIT 5)`,
  [compteId, niveau, objetId]);
}

function valider(v: unknown): { message: string; statut: 400 | 413 } | undefined {
  const erreur = { message: 'Sauvegarde invalide.', statut: 400 as const };
  if (!objet(v) || !champs(v, ['partieId', 'compte', 'partie', 'regions'])) return erreur;
  if (v.partieId !== undefined && !uuid(v.partieId)) return erreur;
  if (v.regions !== undefined && (!Array.isArray(v.regions) || !v.regions.length)) return erreur;
  if (v.compte === undefined && v.partie === undefined && v.regions === undefined) return erreur;
  if ((v.partie !== undefined || v.regions !== undefined) && !uuid(v.partieId)) return erreur;
  const ids = new Set<string>();
  const entrees = [['compte', v.compte], ['partie', v.partie],
    ...(Array.isArray(v.regions) ? v.regions.map(r => ['region', r]) : [])];
  for (const [niveau, valeur] of entrees) {
    if (valeur === undefined) continue;
    if (!objet(valeur) || !champs(valeur, ['revisionBase', 'enveloppe']) || !entier(valeur.revisionBase)) return erreur;
    const e = valeur.enveloppe;
    if (!objet(e)) return erreur;
    const json = JSON.stringify(e);
    if (Buffer.byteLength(json) > 1_000_000) return { message: 'Enveloppe trop volumineuse.', statut: 413 };
    // Postgres refuse le caractère nul dans le texte et le jsonb : 400 plutôt que 500.
    if (json.includes('\\u0000')) return erreur;
    if (!champs(e, ['version', 'niveau', 'id', 'revision', 'ecritLe', 'donnees']) ||
      !entier(e.version) || e.version < 1 || e.version > 1000 || e.niveau !== niveau ||
      !texte(e.id) || e.id.includes(':') || !entier(e.revision) ||
      typeof e.ecritLe !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(e.ecritLe) ||
      !Number.isFinite(Date.parse(e.ecritLe)) || !objet(e.donnees)) return erreur;
    if (niveau === 'partie' && (e.id !== v.partieId || !texte(e.donnees.nom))) return erreur;
    if (niveau === 'region') {
      if (e.id !== e.donnees.regionId || ids.has(e.id)) return erreur;
      ids.add(e.id);
    }
  }
}

function enveloppe(ligne: Ligne, niveau: string, id: string): Enveloppe {
  return { version: ligne.version, niveau, id, revision: ligne.revision,
    ecritLe: ligne.ecrit_le.toISOString(), donnees: ligne.donnees };
}
function resume(ligne: Ligne | undefined, niveau: string) {
  const resultat: Objet = {};
  for (const [cle, type] of niveau === 'partie' ? [['nom', 'string'], ['regionCourante', 'string']]
    : niveau === 'region' ? [['zoneId', 'string'], ['etape', 'number']] : []) {
    if (ligne && typeof ligne.donnees[cle!] === type) resultat[cle!] = ligne.donnees[cle!];
  }
  return resultat;
}

export function routesSauvegarde(pool: Pool, auth: Auth): Hono<{ Variables: { compteId: string } }> {
  const app = new Hono<{ Variables: { compteId: string } }>();
  // Débit par compte (en mémoire, fenêtre fixe d'une minute) : la synchro normale n'envoie pas plus de 30 requêtes par minute.
  const debit = new Map<string, { debut: number; n: number }>();
  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ message: 'Connexion requise.' }, 401);
    const maintenant = Date.now();
    if (debit.size > 1000) for (const [cle, v] of debit) if (maintenant - v.debut >= 60_000) debit.delete(cle);
    const fenetre = debit.get(session.user.id);
    if (!fenetre || maintenant - fenetre.debut >= 60_000) debit.set(session.user.id, { debut: maintenant, n: 1 });
    else if (++fenetre.n > DEBIT_MAX) return c.json({ message: 'Trop de requêtes.' }, 429);
    c.set('compteId', session.user.id);
    await next();
  });
  app.get('/compte', async c => {
    const { rows } = await pool.query('SELECT * FROM donnees_compte WHERE compte_id = $1', [c.get('compteId')]);
    return rows[0] ? c.json({ enveloppe: enveloppe(rows[0], 'compte', 'local') })
      : c.json({ message: 'Aucune sauvegarde.' }, 404);
  });
  app.get('/parties', async c => {
    const { rows } = await pool.query(`SELECT id, nom, revision, ecrit_le,
      donnees->'regionCourante' AS region_courante,
      (SELECT r.donnees->'zoneId' FROM regions r
        WHERE r.partie_id = p.id AND r.region_id = p.donnees->>'regionCourante'
          AND jsonb_typeof(p.donnees->'regionCourante') = 'string') AS zone_id,
      donnees->'statistiques'->'tempsJeuMs' AS temps_jeu_ms
      FROM parties p WHERE compte_id = $1 ORDER BY ecrit_le DESC LIMIT $2`,
      [c.get('compteId'), MAX_PARTIES]);
    return c.json({ parties: rows.map(p => ({ id: p.id, nom: p.nom, revision: p.revision, ecritLe: p.ecrit_le.toISOString(),
      regionCourante: typeof p.region_courante === 'string' ? p.region_courante : null,
      zoneId: typeof p.zone_id === 'string' ? p.zone_id : null,
      tempsJeuMs: typeof p.temps_jeu_ms === 'number' && Number.isFinite(p.temps_jeu_ms) && p.temps_jeu_ms >= 0 ? p.temps_jeu_ms : null,
    })) });
  });
  app.get('/parties/:id', async c => {
    const id = c.req.param('id');
    if (!uuid(id)) return c.json({ message: 'Partie introuvable.' }, 404);
    // Une seule requête conserve une vue cohérente de la partie et de ses régions.
    const { rows } = await pool.query(`SELECT p.*, COALESCE(
      (SELECT json_agg(r ORDER BY r.region_id) FROM regions r WHERE r.partie_id = p.id), '[]') AS regions
      FROM parties p WHERE p.id = $1 AND p.compte_id = $2`, [id, c.get('compteId')]);
    if (!rows[0]) return c.json({ message: 'Partie introuvable.' }, 404);
    return c.json({ partie: enveloppe(rows[0], 'partie', rows[0].id),
      regions: rows[0].regions.map((r: Ligne & { region_id: string }) =>
        enveloppe({ ...r, ecrit_le: new Date(r.ecrit_le) }, 'region', r.region_id)) });
  });
  app.delete('/parties/:id', async c => {
    const id = c.req.param('id');
    if (!uuid(id)) return c.json({ message: 'Partie introuvable.' }, 404);
    const compteId = c.get('compteId');
    const db = await pool.connect();
    let echec: Error | undefined;
    try {
      await db.query('BEGIN');
      const partie = await db.query('SELECT id FROM parties WHERE id = $1 AND compte_id = $2 FOR UPDATE', [id, compteId]);
      if (!partie.rows[0]) {
        await db.query('ROLLBACK');
        return c.json({ message: 'Partie introuvable.' }, 404);
      }
      await db.query(`DELETE FROM versions WHERE compte_id = $2
        AND ((niveau = 'partie' AND objet_id = $1) OR (niveau = 'region' AND objet_id LIKE $1 || ':%'))`, [id, compteId]);
      await db.query('DELETE FROM parties WHERE id = $1 AND compte_id = $2', [id, compteId]);
      await db.query('COMMIT');
      return c.json({ ok: true });
    } catch (error) {
      await db.query('ROLLBACK').catch(() => undefined);
      echec = error as Error;
      throw error;
    } finally { db.release(echec); }
  });
  app.post('/parties/:id/appareil', async c => {
    const id = c.req.param('id');
    if (!uuid(id)) return c.json({ message: 'Partie introuvable.' }, 404);
    let brut: unknown;
    try { brut = await c.req.json(); } catch { return c.json({ message: 'Sauvegarde invalide.' }, 400); }
    if (!objet(brut) || !champs(brut, ['appareilId', 'reprendre']) || !uuid(brut.appareilId) ||
      ('reprendre' in brut && typeof brut.reprendre !== 'boolean')) {
      return c.json({ message: 'Sauvegarde invalide.' }, 400);
    }
    const db = await pool.connect();
    let echec: Error | undefined;
    try {
      await db.query('BEGIN');
      const partie = await db.query('SELECT id FROM parties WHERE id = $1 AND compte_id = $2 FOR UPDATE',
        [id, c.get('compteId')]);
      if (!partie.rows[0]) {
        await db.query('ROLLBACK');
        return c.json({ message: 'Partie introuvable.' }, 404);
      }
      const resultat = await db.query(`INSERT INTO appareil_actif(partie_id, appareil_id, battement_le)
        VALUES ($1, $2, now()) ON CONFLICT (partie_id) DO UPDATE
        SET appareil_id = EXCLUDED.appareil_id, battement_le = now()
        WHERE appareil_actif.appareil_id = EXCLUDED.appareil_id
          OR now() - appareil_actif.battement_le > interval '120 seconds' OR $3
        RETURNING partie_id`, [id, brut.appareilId, brut.reprendre === true]);
      await db.query('COMMIT');
      return c.json({ actif: resultat.rows.length > 0 });
    } catch (error) {
      await db.query('ROLLBACK').catch(() => undefined);
      echec = error as Error;
      throw error;
    } finally { db.release(echec); }
  });
  app.post('/versions', bodyLimit({ maxSize: 3 * 1024 * 1024,
    onError: c => c.json({ message: 'Requête trop volumineuse.' }, 413) }), async c => {
    let brut: unknown;
    try { brut = await c.req.json(); } catch { return c.json({ message: 'JSON invalide.' }, 400); }
    if (!objet(brut) || !champs(brut, ['niveau', 'objetId', 'enveloppe']) ||
      typeof brut.niveau !== 'string' || !['compte', 'partie', 'region'].includes(brut.niveau) || typeof brut.objetId !== 'string') {
      return c.json({ message: 'Sauvegarde invalide.' }, 400);
    }
    const { niveau, objetId } = brut as { niveau: string; objetId: string };
    const partieId = niveau === 'region' ? objetId.split(':')[0] : objetId;
    const envoi = { revisionBase: 0, enveloppe: brut.enveloppe };
    let erreur;
    try {
      erreur = valider(niveau === 'compte' ? { compte: envoi }
        : niveau === 'partie' ? { partieId, partie: envoi } : { partieId, regions: [envoi] });
      if (!erreur && niveau === 'region' && objetId !== `${partieId}:${(brut.enveloppe as Enveloppe).id}`) {
        erreur = { message: 'Sauvegarde invalide.', statut: 400 as const };
      }
    } catch { erreur = { message: 'Sauvegarde invalide.', statut: 400 as const }; }
    if (erreur) return c.json({ message: erreur.message }, erreur.statut);
    const e = brut.enveloppe as Enveloppe;
    const compteId = c.get('compteId');
    const id = niveau === 'compte' ? compteId : objetId;
    const db = await pool.connect();
    let echec: Error | undefined;
    try {
      await db.query('BEGIN');
      if (niveau !== 'compte') {
        const partie = (await db.query('SELECT compte_id FROM parties WHERE id = $1 FOR UPDATE', [partieId])).rows[0];
        if (partie && partie.compte_id !== compteId) {
          await db.query('ROLLBACK');
          return c.json({ message: 'Partie introuvable.' }, 404);
        }
      }
      await db.query(`INSERT INTO versions(compte_id, niveau, objet_id, revision, version, ecrit_le, donnees)
        VALUES ($1,$2,$3,$4,$5,$6,$7)`, [compteId, niveau, id, e.revision, e.version, new Date(e.ecritLe).toISOString(), e.donnees]);
      await purgerVersions(db, compteId, niveau, id);
      await db.query(`DELETE FROM versions WHERE compte_id = $1 AND id NOT IN (SELECT id FROM versions WHERE compte_id = $1 ORDER BY id DESC LIMIT $2)`,
        [compteId, MAX_VERSIONS]);
      await db.query('COMMIT');
      return c.json({ ok: true });
    } catch (error) {
      await db.query('ROLLBACK').catch(() => undefined);
      echec = error as Error;
      throw error;
    } finally { db.release(echec); }
  });
  app.put('/', bodyLimit({ maxSize: 3 * 1024 * 1024,
    onError: c => c.json({ message: 'Requête trop volumineuse.' }, 413) }), async c => {
    let brut: unknown;
    try { brut = await c.req.json(); } catch { return c.json({ message: 'JSON invalide.' }, 400); }
    let erreur;
    try { erreur = valider(brut); } catch { erreur = { message: 'Sauvegarde invalide.', statut: 400 as const }; }
    if (erreur) return c.json({ message: erreur.message }, erreur.statut);
    const corps = brut as Corps;
    const compteId = c.get('compteId');
    const db = await pool.connect();
    let echec: Error | undefined; // une connexion en erreur est détruite au lieu de retourner au pool
    const conflit = { message: 'Cette sauvegarde a changé depuis ta dernière lecture.', conflits: [] as Objet[] };
    try {
      await db.query('BEGIN');
      const partie = corps.partieId ? (await db.query('SELECT * FROM parties WHERE id = $1 FOR UPDATE', [corps.partieId])).rows[0] : undefined;
      if ((partie && partie.compte_id !== compteId) || (!partie && corps.regions && !corps.partie)) {
        await db.query('ROLLBACK');
        return c.json({ message: 'Partie introuvable.' }, 404);
      }
      const objets: { envoi: Envoi; niveau: string; id: string; table: string; cle: string; valeurs: unknown[]; ligne?: Ligne }[] = [];
      if (corps.compte) objets.push({ envoi: corps.compte, niveau: 'compte', id: compteId,
        table: 'donnees_compte', cle: 'compte_id = $1', valeurs: [compteId] });
      if (corps.partie) objets.push({ envoi: corps.partie, niveau: 'partie', id: corps.partieId!,
        table: 'parties', cle: 'id = $1', valeurs: [corps.partieId] });
      for (const envoi of corps.regions ?? []) objets.push({ envoi, niveau: 'region',
        id: `${corps.partieId}:${envoi.enveloppe.id}`, table: 'regions',
        cle: 'partie_id = $1 AND region_id = $2', valeurs: [corps.partieId, envoi.enveloppe.id] });
      // Les fragments SQL viennent uniquement des constantes ci-dessus ; toutes les valeurs sont paramétrées.
      for (const o of objets) {
        o.ligne = (await db.query(`SELECT * FROM ${o.table} WHERE ${o.cle} FOR UPDATE`, o.valeurs)).rows[0];
        if ((o.ligne?.revision ?? 0) !== o.envoi.revisionBase) conflit.conflits.push({
          niveau: o.niveau, id: o.niveau === 'region' ? o.envoi.enveloppe.id : o.id,
          revisionServeur: o.ligne?.revision ?? 0, ecritLe: o.ligne?.ecrit_le.toISOString() ?? null,
          resume: resume(o.ligne, o.niveau) });
      }
      if (conflit.conflits.length) { await db.query('ROLLBACK'); return c.json(conflit, 409); }
      // Plafonds de stockage par compte (une partie neuve, des régions neuves).
      const regionsNeuves = objets.filter(o => o.niveau === 'region' && !o.ligne).length;
      if (corps.partie && !partie && Number((await db.query('SELECT count(*) FROM parties WHERE compte_id = $1', [compteId])).rows[0].count) >= MAX_PARTIES) {
        await db.query('ROLLBACK');
        return c.json({ message: 'Trop de parties.' }, 413);
      }
      if (regionsNeuves && Number((await db.query('SELECT count(*) FROM regions WHERE partie_id = $1', [corps.partieId])).rows[0].count) + regionsNeuves > MAX_REGIONS) {
        await db.query('ROLLBACK');
        return c.json({ message: 'Trop de régions.' }, 413);
      }
      const resultat: { compte?: { revision: number }; partie?: { id: string; revision: number }; regions?: { id: string; revision: number }[] } = {};
      for (const o of objets) {
        const e = o.envoi.enveloppe;
        const base = o.envoi.revisionBase;
        let modifie;
        if (o.ligne) {
          await db.query(`INSERT INTO versions(compte_id, niveau, objet_id, revision, version, ecrit_le, donnees)
            VALUES ($1,$2,$3,$4,$5,$6,$7)`, [compteId, o.niveau, o.id, o.ligne.revision, o.ligne.version, o.ligne.ecrit_le, o.ligne.donnees]);
          const n = o.valeurs.length;
          modifie = await db.query(`UPDATE ${o.table} SET revision = $${n + 1} + 1,
            version = $${n + 2}, ecrit_le = $${n + 3}, donnees = $${n + 4}
            ${o.niveau === 'partie' ? `, nom = $${n + 5}` : ''}
            WHERE ${o.cle} AND revision = $${n + 1} RETURNING revision`,
          [...o.valeurs, base, e.version, new Date(e.ecritLe).toISOString(), e.donnees, ...(o.niveau === 'partie' ? [e.donnees.nom] : [])]);
          await purgerVersions(db, compteId, o.niveau, o.id);
        } else {
          const colonnes = o.niveau === 'compte' ? 'compte_id' : o.niveau === 'partie' ? 'id, compte_id, nom' : 'partie_id, region_id';
          const valeurs = o.niveau === 'compte' ? [compteId] : o.niveau === 'partie' ? [corps.partieId, compteId, e.donnees.nom] : o.valeurs;
          const parametres = [...valeurs, 1, e.version, new Date(e.ecritLe).toISOString(), e.donnees];
          modifie = await db.query(`INSERT INTO ${o.table} (${colonnes}, revision, version, ecrit_le, donnees)
            VALUES (${parametres.map((_, i) => `$${i + 1}`).join(',')}) ON CONFLICT DO NOTHING RETURNING revision`, parametres);
        }
        if (!modifie.rowCount) { await db.query('ROLLBACK'); return c.json({ ...conflit, conflits: [] }, 409); }
        const revision = modifie.rows[0].revision as number;
        if (o.niveau === 'compte') resultat.compte = { revision };
        else if (o.niveau === 'partie') resultat.partie = { id: e.id, revision };
        else (resultat.regions ??= []).push({ id: e.id, revision });
      }
      await db.query('COMMIT');
      return c.json(resultat);
    } catch (error) {
      await db.query('ROLLBACK').catch(() => undefined);
      echec = error as Error;
      throw error;
    }
    finally { db.release(echec); }
  });
  return app;
}
