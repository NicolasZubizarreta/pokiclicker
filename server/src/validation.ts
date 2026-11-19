import { LIMITES } from './limites.js';

export type Objet = Record<string, unknown>;
export type Enveloppe = { version: number; niveau: string; id: string; revision: number; ecritLe: string; donnees: Objet };
export type Envoi = { revisionBase: number; enveloppe: Enveloppe };
export type Corps = { partieId?: string; appareilId?: string; compte?: Envoi; partie?: Envoi; regions?: Envoi[] };
export type Ligne = { revision: number; version: number; ecrit_le: Date; donnees: Objet };
export const objet = (v: unknown): v is Objet => typeof v === 'object' && v !== null && !Array.isArray(v);
export const entier = (v: unknown): v is number => Number.isSafeInteger(v) && Number(v) >= 0;
export const texte = (v: unknown): v is string => typeof v === 'string' && v.length >= 1 && v.length <= LIMITES.texteCaracteres;
export const uuid = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export const champs = (v: Objet, permis: string[]) => Object.keys(v).every(k => permis.includes(k));

export function valider(v: unknown): { message: string; statut: 400 | 413 } | undefined {
  const erreur = { message: 'Sauvegarde invalide.', statut: 400 as const };
  if (!objet(v) || !champs(v, ['partieId', 'appareilId', 'compte', 'partie', 'regions'])) return erreur;
  if ('appareilId' in v && !uuid(v.appareilId)) return erreur;
  if (v.partieId !== undefined && !uuid(v.partieId)) return erreur;
  if (v.regions !== undefined && (!Array.isArray(v.regions) || !v.regions.length)) return erreur;
  if (Array.isArray(v.regions) && v.regions.length > LIMITES.maxRegions) return { message: 'Trop de régions.', statut: 413 };
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
    if (Buffer.byteLength(json) > LIMITES.enveloppeOctets) return { message: 'Enveloppe trop volumineuse.', statut: 413 };
    // Postgres refuse le caractère nul dans le texte et le jsonb : 400 plutôt que 500.
    if (json.includes('\\u0000')) return erreur;
    if (!champs(e, ['version', 'niveau', 'id', 'revision', 'ecritLe', 'donnees']) ||
      !entier(e.version) || e.version < 1 || e.version > LIMITES.versionEnveloppe || e.niveau !== niveau ||
      !texte(e.id) || e.id.includes(':') || !entier(e.revision) || e.revision > LIMITES.revision ||
      typeof e.ecritLe !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(e.ecritLe) ||
      !Number.isFinite(Date.parse(e.ecritLe)) || !objet(e.donnees)) return erreur;
    const [annee, mois, jour] = e.ecritLe.slice(0, 10).split('-').map(Number);
    if (mois! < 1 || mois! > 12 || jour! < 1 || jour! > new Date(Date.UTC(annee!, mois!, 0)).getUTCDate()) return erreur;
    if (niveau === 'partie' && (e.id !== v.partieId || !texte(e.donnees.nom))) return erreur;
    if (niveau === 'region') {
      if (e.id !== e.donnees.regionId || ids.has(e.id)) return erreur;
      ids.add(e.id);
    }
  }
}
