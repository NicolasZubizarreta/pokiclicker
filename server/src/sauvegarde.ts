import { Hono } from 'hono';
import { randomUUID } from 'node:crypto';
import { bodyLimit } from 'hono/body-limit';
import type { Pool, PoolClient } from 'pg';

type Auth = { api: { getSession: (options: { headers: Headers }) => Promise<{ user: { id: string } } | null> } };
import { LIMITES } from './limites.js';
import { transaction, annulerTransaction } from './transaction.js';
import { objet, entier, texte, uuid, champs, valider, type Objet, type Enveloppe, type Envoi, type Corps, type Ligne } from './validation.js';

export async function purgerLots(db: PoolClient, compteId: string, partieId: string) {
  await db.query(`DELETE FROM versions WHERE compte_id = $1 AND origine IN ('divergence', 'restauration')
    AND (objet_id = $2 OR objet_id LIKE $2 || ':%') AND lot IN (
      SELECT lot FROM versions WHERE compte_id = $1 AND origine IN ('divergence', 'restauration')
        AND lot IS NOT NULL AND (objet_id = $2 OR objet_id LIKE $2 || ':%')
      GROUP BY lot ORDER BY max(remplace_le) DESC, lot DESC OFFSET $3)`, [compteId, partieId, LIMITES.lotsParPartie]);
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
    const authorization = c.req.header('authorization');
    if (!authorization || !/^Bearer\s+\S+$/i.test(authorization)) return c.json({ message: 'Connexion requise.' }, 401);
    const session = await auth.api.getSession({ headers: new Headers({ authorization }) });
    if (!session) return c.json({ message: 'Connexion requise.' }, 401);
    if ((['POST', 'PUT', 'PATCH'].includes(c.req.method) || (c.req.method === 'DELETE' && c.req.raw.body !== null)) &&
        !/^application\/json(?:\s*;|$)/i.test(c.req.header('content-type') ?? '')) {
      return c.json({ message: 'Type de contenu non accepté.' }, 415);
    }
    const maintenant = Date.now();
    if (debit.size > LIMITES.debitSeuilPurge) for (const [cle, v] of debit) if (maintenant - v.debut >= LIMITES.debitFenetreMs) debit.delete(cle);
    const fenetre = debit.get(session.user.id);
    if (!fenetre || maintenant - fenetre.debut >= LIMITES.debitFenetreMs) debit.set(session.user.id, { debut: maintenant, n: 1 });
    else if (++fenetre.n > LIMITES.debitRequetes) return c.json({ message: 'Trop de requêtes.' }, 429);
    c.set('compteId', session.user.id);
    await next();
  });
  app.get('/compte', async c => {
    const { rows } = await pool.query('SELECT * FROM donnees_compte WHERE compte_id = $1', [c.get('compteId')]);
    return rows[0] ? c.json({ enveloppe: enveloppe(rows[0], 'compte', 'local') })
      : c.json({ message: 'Aucune sauvegarde.' }, 404);
  });
  app.get('/parties', async c => {
    const appareilId = c.req.query('appareilId');
    if (appareilId !== undefined && !uuid(appareilId)) return c.json({ message: 'Sauvegarde invalide.' }, 400);
    const { rows } = await pool.query(`SELECT id, nom, revision, ecrit_le,
      donnees->'regionCourante' AS region_courante,
      (SELECT r.donnees->'zoneId' FROM regions r
        WHERE r.partie_id = p.id AND r.region_id = p.donnees->>'regionCourante'
          AND jsonb_typeof(p.donnees->'regionCourante') = 'string') AS zone_id,
      donnees->'statistiques'->'tempsJeuMs' AS temps_jeu_ms,
      (SELECT CASE WHEN now() - a.battement_le <= make_interval(secs => $4)
        THEN CASE WHEN lower(a.appareil_id::text) = $3 THEN 'cet-appareil' ELSE 'autre' END
        ELSE NULL END FROM appareil_actif a WHERE a.partie_id = p.id) AS appareil_actif
      FROM parties p WHERE compte_id = $1 ORDER BY ecrit_le DESC LIMIT $2`,
      [c.get('compteId'), LIMITES.maxParties, appareilId?.toLowerCase() ?? null, LIMITES.verrouAppareilSecondes]);
    return c.json({ parties: rows.map(p => ({ id: p.id, nom: p.nom, revision: p.revision, ecritLe: p.ecrit_le.toISOString(),
      regionCourante: typeof p.region_courante === 'string' ? p.region_courante : null,
      zoneId: typeof p.zone_id === 'string' ? p.zone_id : null,
      tempsJeuMs: typeof p.temps_jeu_ms === 'number' && Number.isFinite(p.temps_jeu_ms) && p.temps_jeu_ms >= 0 ? p.temps_jeu_ms : null,
      ...(appareilId === undefined ? {} : { appareilActif: p.appareil_actif }),
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
  app.patch('/parties/:id', async c => {
    const id = c.req.param('id');
    if (!uuid(id)) return c.json({ message: 'Partie introuvable.' }, 404);
    let brut: unknown;
    try { brut = await c.req.json(); } catch { return c.json({ message: 'Sauvegarde invalide.' }, 400); }
    if (!objet(brut) || !champs(brut, ['nom']) || typeof brut.nom !== 'string') {
      return c.json({ message: 'Sauvegarde invalide.' }, 400);
    }
    const nom = brut.nom.trim();
    if (!texte(nom) || nom.includes('\u0000')) return c.json({ message: 'Sauvegarde invalide.' }, 400);
    const compteId = c.get('compteId');
    return transaction(pool, async db => {
      const partie = await db.query('SELECT id FROM parties WHERE id = $1 AND compte_id = $2 FOR UPDATE', [id, compteId]);
      if (!partie.rows[0]) {
        return annulerTransaction(c.json({ message: 'Partie introuvable.' }, 404));
      }
      await db.query(`UPDATE parties SET nom = $1, donnees = jsonb_set(donnees, '{nom}', to_jsonb($1::text))
        WHERE id = $2 AND compte_id = $3`, [nom, id, compteId]);
      return c.json({ nom });
    });
  });
  app.delete('/parties/:id', async c => {
    const id = c.req.param('id');
    if (!uuid(id)) return c.json({ message: 'Partie introuvable.' }, 404);
    let brut: unknown = {};
    if (c.req.raw.body !== null) {
      try { brut = await c.req.json(); } catch { return c.json({ message: 'Sauvegarde invalide.' }, 400); }
    }
    if (!objet(brut) || !champs(brut, ['revisionBase']) || ('revisionBase' in brut && !entier(brut.revisionBase))) return c.json({ message: 'Sauvegarde invalide.' }, 400);
    const compteId = c.get('compteId');
    return transaction(pool, async db => {
      const partie = await db.query('SELECT id FROM parties WHERE id = $1 AND compte_id = $2 FOR UPDATE', [id, compteId]);
      if (!partie.rows[0]) {
        return annulerTransaction(c.json({ message: 'Partie introuvable.' }, 404));
      }
      const revision = (await db.query('SELECT revision FROM parties WHERE id=$1', [id])).rows[0].revision;
      if (brut.revisionBase !== undefined && brut.revisionBase !== revision) {
        return annulerTransaction(c.json({ message: 'Cette sauvegarde a changé depuis ta dernière lecture.', conflits: [] }, 409));
      }
      const lot = randomUUID();
      await db.query(`DELETE FROM versions WHERE compte_id=$1 AND origine='suppression' AND remplace_le < now() - make_interval(days => $2)`, [compteId, LIMITES.conservationSuppressionJours]);
      await db.query(`INSERT INTO versions(compte_id,niveau,objet_id,revision,version,ecrit_le,donnees,origine,lot)
        SELECT compte_id,'partie',id::text,revision,version,ecrit_le,donnees,'suppression',$2 FROM parties WHERE id=$1`, [id, lot]);
      await db.query(`INSERT INTO versions(compte_id,niveau,objet_id,revision,version,ecrit_le,donnees,origine,lot)
        SELECT $3,'region',$1::text || ':' || region_id,revision,version,ecrit_le,donnees,'suppression',$2 FROM regions WHERE partie_id=$1::uuid`, [id, lot, compteId]);
      await db.query('DELETE FROM parties WHERE id = $1 AND compte_id = $2', [id, compteId]);
      return c.json({ ok: true });
    });
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
    const appareilId = brut.appareilId;
    return transaction(pool, async db => {
      const partie = await db.query('SELECT id FROM parties WHERE id = $1 AND compte_id = $2 FOR UPDATE',
        [id, c.get('compteId')]);
      if (!partie.rows[0]) {
        return annulerTransaction(c.json({ message: 'Partie introuvable.' }, 404));
      }
      const resultat = await db.query(`INSERT INTO appareil_actif(partie_id, appareil_id, battement_le)
        VALUES ($1, $2, now()) ON CONFLICT (partie_id) DO UPDATE
        SET appareil_id = EXCLUDED.appareil_id, battement_le = now()
        WHERE appareil_actif.appareil_id = EXCLUDED.appareil_id
          OR now() - appareil_actif.battement_le > make_interval(secs => $4) OR $3
        RETURNING partie_id`, [id, appareilId.toLowerCase(), brut.reprendre === true, LIMITES.verrouAppareilSecondes]);
      return c.json({ actif: resultat.rows.length > 0 });
    });
  });
  app.post('/parties/:id/archives', bodyLimit({ maxSize: LIMITES.corpsArchiveOctets,
    onError: c => c.json({ message: 'Requête trop volumineuse.' }, 413) }), async c => {
    const id = c.req.param('id');
    if (!uuid(id)) return c.json({ message: 'Partie introuvable.' }, 404);
    let brut: unknown;
    try { brut = await c.req.json(); } catch { return c.json({ message: 'Sauvegarde invalide.' }, 400); }
    if (!objet(brut) || !champs(brut, ['partie', 'regions']) || !objet(brut.partie) || !Array.isArray(brut.regions)) {
      return c.json({ message: 'Sauvegarde invalide.' }, 400);
    }
    if (brut.regions.length > LIMITES.maxRegions) return c.json({ message: 'Trop de régions.' }, 413);
    const erreur = valider({ partieId: id, partie: { revisionBase: 0, enveloppe: brut.partie },
      regions: brut.regions.map(enveloppe => ({ revisionBase: 0, enveloppe })) });
    if (erreur) return c.json({ message: erreur.message }, erreur.statut);
    const compteId = c.get('compteId');
    const lot = randomUUID();
    const regions = brut.regions;
    return transaction(pool, async db => {
      const partie = await db.query('SELECT id FROM parties WHERE id = $1 AND compte_id = $2 FOR UPDATE', [id, compteId]);
      if (!partie.rows[0]) {
        return annulerTransaction(c.json({ message: 'Partie introuvable.' }, 404));
      }
      for (const e of [brut.partie, ...regions] as Enveloppe[]) {
        await db.query(`INSERT INTO versions(compte_id, niveau, objet_id, revision, version, ecrit_le, donnees, origine, lot)
          VALUES ($1,$2,$3,$4,$5,$6,$7,'divergence',$8)`,
        [compteId, e.niveau, e.niveau === 'partie' ? id : `${id}:${e.id}`, e.revision, e.version, e.ecritLe, e.donnees, lot]);
      }
      await purgerLots(db, compteId, id);
      return c.json({ ok: true, lot });
    });
  });
  app.post('/parties/:id/restaurer', async c => {
    const id = c.req.param('id');
    if (!uuid(id)) return c.json({ message: 'Partie introuvable.' }, 404);
    let brut: unknown;
    try { brut = await c.req.json(); } catch { return c.json({ message: 'Sauvegarde invalide.' }, 400); }
    if (!objet(brut) || !champs(brut, ['appareilId', 'lot']) || !uuid(brut.appareilId) || !uuid(brut.lot)) {
      return c.json({ message: 'Sauvegarde invalide.' }, 400);
    }
    const appareilId = brut.appareilId;
    const compteId = c.get('compteId');
    return transaction(pool, async db => {
      const actuelle = await db.query('SELECT * FROM parties WHERE id = $1 AND compte_id = $2 FOR UPDATE', [id, compteId]);
      if (!actuelle.rows[0]) {
        return annulerTransaction(c.json({ message: 'Partie introuvable.' }, 404));
      }
      const { rows } = await db.query<Ligne & { niveau: string; objet_id: string }>(`SELECT * FROM versions
        WHERE compte_id = $1 AND lot = $2 AND origine IN ('divergence', 'restauration')
          AND ((niveau = 'partie' AND objet_id = $3) OR (niveau = 'region' AND objet_id LIKE $3 || ':%'))`,
      [compteId, brut.lot, id]);
      const partie = rows.find(r => r.niveau === 'partie');
      const regions = rows.filter(r => r.niveau === 'region');
      if (!partie || typeof partie.donnees.regionCourante !== 'string' ||
          !regions.some(r => r.objet_id === `${id}:${partie.donnees.regionCourante}`)) {
        return annulerTransaction(c.json({ message: 'Sauvegarde introuvable.' }, 404));
      }
      await db.query(`INSERT INTO appareil_actif(partie_id, appareil_id, battement_le)
        VALUES ($1,$2,now()) ON CONFLICT (partie_id) DO UPDATE
        SET appareil_id = EXCLUDED.appareil_id, battement_le = now()`, [id, appareilId.toLowerCase()]);
      const lot = randomUUID();
      await db.query(`INSERT INTO versions(compte_id,niveau,objet_id,revision,version,ecrit_le,donnees,origine,lot)
        SELECT compte_id,'partie',id,revision,version,ecrit_le,donnees,'restauration',$2 FROM parties WHERE id=$1`, [id, lot]);
      await db.query(`INSERT INTO versions(compte_id,niveau,objet_id,revision,version,ecrit_le,donnees,origine,lot)
        SELECT $3,'region',$1::text || ':' || region_id,revision,version,ecrit_le,donnees,'restauration',$2
        FROM regions WHERE partie_id=$1::uuid`, [id, lot, compteId]);
      const resultat = await db.query(`UPDATE parties SET donnees = jsonb_set($2::jsonb, '{nom}', to_jsonb(nom)),
        revision = revision + 1, version = $3, ecrit_le = now() WHERE id = $1 RETURNING revision`,
      [id, partie.donnees, partie.version]);
      const ids = regions.map(r => r.objet_id.slice(id.length + 1));
      for (const [i, region] of regions.entries()) {
        await db.query(`INSERT INTO regions(partie_id,region_id,revision,version,ecrit_le,donnees)
          VALUES ($1,$2,COALESCE((SELECT derniere_revision + 1 FROM regions_supprimees WHERE partie_id=$1 AND region_id=$2),1),$3,now(),$4) ON CONFLICT (partie_id,region_id) DO UPDATE
          SET revision = regions.revision + 1, version = EXCLUDED.version, donnees = EXCLUDED.donnees, ecrit_le = now()`,
        [id, ids[i], region.version, region.donnees]);
        await db.query('DELETE FROM regions_supprimees WHERE partie_id=$1 AND region_id=$2', [id, ids[i]]);
      }
      await db.query(`INSERT INTO regions_supprimees(partie_id,region_id,derniere_revision)
        SELECT partie_id,region_id,revision FROM regions WHERE partie_id=$1 AND NOT (region_id = ANY($2::text[]))
        ON CONFLICT (partie_id,region_id) DO UPDATE SET derniere_revision=GREATEST(regions_supprimees.derniere_revision,EXCLUDED.derniere_revision)`, [id, ids]);
      await db.query('DELETE FROM regions WHERE partie_id=$1 AND NOT (region_id = ANY($2::text[]))', [id, ids]);
      await purgerLots(db, compteId, id);
      return c.json({ ok: true, partie: { id, revision: resultat.rows[0].revision } });
    });
  });
  app.get('/parties/:id/versions', async c => {
    const id = c.req.param('id');
    if (!uuid(id)) return c.json({ message: 'Partie introuvable.' }, 404);
    const compteId = c.get('compteId');
    const partie = await pool.query('SELECT id FROM parties WHERE id = $1 AND compte_id = $2', [id, compteId]);
    if (!partie.rows[0]) return c.json({ message: 'Partie introuvable.' }, 404);
    const { rows } = await pool.query(`SELECT p.lot, p.origine, p.remplace_le, p.ecrit_le, p.donnees,
      r.donnees AS region FROM versions p JOIN versions r ON r.lot = p.lot AND r.compte_id = p.compte_id
        AND r.niveau = 'region' AND r.objet_id = $1 || ':' || (p.donnees->>'regionCourante')
        AND r.origine IN ('divergence', 'restauration')
      WHERE p.compte_id = $2 AND p.niveau = 'partie' AND p.objet_id = $1 AND p.lot IS NOT NULL
        AND p.origine IN ('divergence', 'restauration') AND jsonb_typeof(p.donnees->'regionCourante') = 'string'
      ORDER BY p.remplace_le DESC, p.lot DESC LIMIT 5`, [id, compteId]);
    return c.json({ versions: rows.map(p => {
      const statistiques = p.donnees.statistiques;
      const temps = objet(statistiques) ? statistiques.tempsJeuMs : null;
      const region = objet(p.region) ? p.region : {};
      const equipe: unknown = region.equipe;
      const niveaux = Array.isArray(equipe) ? equipe.map(e => objet(e) ? e.niveau : null) : [];
      const moyenne = niveaux.length && niveaux.every(n => typeof n === 'number' && Number.isFinite(n))
        ? niveaux.reduce((s: number, n) => s + (n as number) / niveaux.length, 0) : null;
      return { lot: p.lot, origine: p.origine, remplaceLe: p.remplace_le.toISOString(), ecritLe: p.ecrit_le.toISOString(),
        tempsJeuMs: typeof temps === 'number' && Number.isFinite(temps) && temps >= 0 ? temps : null,
        regionCourante: typeof p.donnees.regionCourante === 'string' ? p.donnees.regionCourante : null,
        zoneId: typeof region.zoneId === 'string' ? region.zoneId : null,
        niveauEquipe: moyenne !== null && Number.isFinite(moyenne) ? Math.round(moyenne) : null };
    }) });
  });
  app.post('/versions', bodyLimit({ maxSize: LIMITES.corpsSauvegardeOctets,
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
    const compteId = c.get('compteId');
    return transaction(pool, async db => {
      if (niveau !== 'compte') {
        const partie = (await db.query('SELECT compte_id FROM parties WHERE id = $1 AND compte_id = $2 FOR UPDATE', [partieId, compteId])).rows[0];
        if (!partie) {
          return annulerTransaction(c.json({ message: 'Partie introuvable.' }, 404));
        }
      }
      // Plus d’historique de rotation : la route reste pour les clients qui l’appellent encore.
      return c.json({ ok: true });
    });
  });
  app.put('/', bodyLimit({ maxSize: LIMITES.corpsSauvegardeOctets,
    onError: c => c.json({ message: 'Requête trop volumineuse.' }, 413) }), async c => {
    let brut: unknown;
    try { brut = await c.req.json(); } catch { return c.json({ message: 'JSON invalide.' }, 400); }
    let erreur;
    try { erreur = valider(brut); } catch { erreur = { message: 'Sauvegarde invalide.', statut: 400 as const }; }
    if (erreur) return c.json({ message: erreur.message }, erreur.statut);
    const corps = brut as Corps;
    // Sans appareil, impossible de savoir qui écrit : le client doit être à jour (lot 8, ADR 0004).
    if ((corps.partie !== undefined || corps.regions !== undefined) && corps.appareilId === undefined) {
      return c.json({ message: 'Mets à jour le jeu.', code: 'appareil-requis' }, 400);
    }
    const appareil = corps.appareilId !== undefined && (corps.partie !== undefined || corps.regions !== undefined);
    const compteId = c.get('compteId');
    return transaction(pool, async db => {
      const prendreAppareil = () => db.query(`INSERT INTO appareil_actif(partie_id, appareil_id, battement_le)
        VALUES ($1, $2, now()) ON CONFLICT (partie_id) DO UPDATE
        SET appareil_id = EXCLUDED.appareil_id, battement_le = now()
        WHERE appareil_actif.appareil_id = EXCLUDED.appareil_id
          OR now() - appareil_actif.battement_le > make_interval(secs => $3)
        RETURNING partie_id`, [corps.partieId, corps.appareilId?.toLowerCase(), LIMITES.verrouAppareilSecondes]);
      const conflit = { message: 'Cette sauvegarde a changé depuis ta dernière lecture.', conflits: [] as Objet[] };
      const partie = corps.partieId ? (await db.query('SELECT * FROM parties WHERE id = $1 AND compte_id = $2 FOR UPDATE', [corps.partieId, compteId])).rows[0] : undefined;
      if (corps.partie && !partie) await db.query('SELECT pg_advisory_xact_lock(hashtext($1))', [compteId]);
      if (!partie && corps.regions && !corps.partie) {
        return annulerTransaction(c.json({ message: 'Partie introuvable.' }, 404));
      }
      if (appareil && partie) {
        const actif = (await db.query(`SELECT appareil_id,
          now() - battement_le <= make_interval(secs => $2) AS recent
          FROM appareil_actif WHERE partie_id = $1 FOR UPDATE`, [corps.partieId, LIMITES.verrouAppareilSecondes])).rows[0];
        if (actif && String(actif.appareil_id).toLowerCase() !== corps.appareilId!.toLowerCase() && actif.recent) {
          return annulerTransaction(c.json({ message: 'Cette partie est ouverte sur un autre appareil.', code: 'ailleurs', conflits: [] }, 409));
        }
        await prendreAppareil();
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
        o.ligne = o.niveau === 'partie' ? partie : o.niveau === 'region' && !partie ? undefined : (await db.query(`SELECT * FROM ${o.table} WHERE ${o.cle} FOR UPDATE`, o.valeurs)).rows[0];
        if ((o.ligne?.revision ?? 0) !== o.envoi.revisionBase) conflit.conflits.push({
          niveau: o.niveau, id: o.niveau === 'region' ? o.envoi.enveloppe.id : o.id,
          revisionServeur: o.ligne?.revision ?? 0, ecritLe: o.ligne?.ecrit_le.toISOString() ?? null,
          resume: resume(o.ligne, o.niveau) });
      }
      if (conflit.conflits.length) { return annulerTransaction(c.json(conflit, 409)); }
      // Plafonds de stockage par compte (une partie neuve, des régions neuves).
      const regionsNeuves = objets.filter(o => o.niveau === 'region' && !o.ligne).length;
      if (corps.partie && !partie && Number((await db.query('SELECT count(*) FROM parties WHERE compte_id = $1', [compteId])).rows[0].count) >= LIMITES.maxParties) {
        return annulerTransaction(c.json({ message: 'Trop de parties.' }, 413));
      }
      if (partie && regionsNeuves && Number((await db.query('SELECT count(*) FROM regions WHERE partie_id = $1', [corps.partieId])).rows[0].count) + regionsNeuves > LIMITES.maxRegions) {
        return annulerTransaction(c.json({ message: 'Trop de régions.' }, 413));
      }
      const resultat: { compte?: { revision: number }; partie?: { id: string; revision: number }; regions?: { id: string; revision: number }[] } = {};
      for (const o of objets) {
        const e = o.envoi.enveloppe;
        const base = o.envoi.revisionBase;
        let modifie;
        if (o.ligne) {
          const n = o.valeurs.length;
          modifie = await db.query(`UPDATE ${o.table} SET revision = $${n + 1} + 1,
            version = $${n + 2}, ecrit_le = LEAST($${n + 3}::timestamptz, now() + make_interval(mins => $${n + 5})), donnees = ${o.niveau === 'partie'
              ? `jsonb_set($${n + 4}::jsonb, '{nom}', to_jsonb(nom))` : `$${n + 4}`}
            WHERE ${o.cle} AND revision = $${n + 1} RETURNING revision`,
          [...o.valeurs, base, e.version, new Date(e.ecritLe).toISOString(), e.donnees, LIMITES.toleranceHorlogeMinutes]);
        } else {
          const colonnes = o.niveau === 'compte' ? 'compte_id' : o.niveau === 'partie' ? 'id, compte_id, nom' : 'partie_id, region_id';
          const valeurs = o.niveau === 'compte' ? [compteId] : o.niveau === 'partie' ? [corps.partieId, compteId, e.donnees.nom] : o.valeurs;
          const revision = o.niveau === 'region' ? ((await db.query('SELECT derniere_revision FROM regions_supprimees WHERE partie_id=$1 AND region_id=$2', o.valeurs)).rows[0]?.derniere_revision ?? 0) + 1 : 1;
          const parametres = [...valeurs, revision, e.version, new Date(e.ecritLe).toISOString(), e.donnees];
          modifie = await db.query(`INSERT INTO ${o.table} (${colonnes}, revision, version, ecrit_le, donnees)
            VALUES (${parametres.map((_, i) => i === valeurs.length + 2 ? `LEAST($${i + 1}::timestamptz, now() + make_interval(mins => $${parametres.length + 1}))` : `$${i + 1}`).join(',')}) ON CONFLICT DO NOTHING RETURNING revision`, [...parametres, LIMITES.toleranceHorlogeMinutes]);
          if (modifie.rowCount && o.niveau === 'region') await db.query('DELETE FROM regions_supprimees WHERE partie_id=$1 AND region_id=$2', o.valeurs);
        }
        if (!modifie.rowCount) { return annulerTransaction(c.json({ ...conflit, conflits: [] }, 409)); }
        if (appareil && o.niveau === 'partie' && !partie) await prendreAppareil();
        const revision = modifie.rows[0].revision as number;
        if (o.niveau === 'compte') resultat.compte = { revision };
        else if (o.niveau === 'partie') resultat.partie = { id: e.id, revision };
        else (resultat.regions ??= []).push({ id: e.id, revision });
      }
      return c.json(resultat);
    });
  });
  return app;
}
