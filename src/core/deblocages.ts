import donnees from '../../data/deblocages.json';
import { evaluer } from './conditions';
import type { chargerMonde } from './monde';
import type { DonneesRegion } from './sauvegarde-types';
import { etatMondeDe } from './sauvegarde';

/**
 * Une fonction se débloque quand sa zone s'ouvre, quand son lieu annexe devient accessible
 * ou quand son objet est possédé. Le texte et le déclencheur vivent dans `data/deblocages.json`.
 */
export type DeclencheurDeblocage = { zone: string } | { lieu: string } | { amelioration: string };
export type Deblocage = {
  id: string; declencheur: DeclencheurDeblocage; texte: string;
  /** Drapeau posé par un événement qui annonce déjà la fonction lui-même (l'intro pour le Sac). */
  dejaAnnonceSi?: string;
};
type Monde = Pick<ReturnType<typeof chargerMonde>, 'zonesOuvertes' | 'lieu' | 'zone'>;

export function chargerDeblocages(): Deblocage[] {
  const liste = structuredClone(donnees.deblocages) as Deblocage[];
  const ids = new Set<string>();
  for (const deblocage of liste) {
    if (!deblocage.id || ids.has(deblocage.id) || deblocage.id.includes(':')) throw new Error(`Déblocage invalide : ${deblocage.id}`);
    ids.add(deblocage.id);
    if (typeof deblocage.texte !== 'string' || !deblocage.texte.trim()) throw new Error(`Texte de déblocage manquant : ${deblocage.id}`);
    const declencheur = deblocage.declencheur as Record<string, unknown>;
    const cles = Object.keys(declencheur);
    if (cles.length !== 1 || !['zone', 'lieu', 'amelioration'].includes(cles[0]!) || typeof declencheur[cles[0]!] !== 'string') {
      throw new Error(`Déclencheur de déblocage invalide : ${deblocage.id}`);
    }
  }
  return liste;
}

export const deblocages = chargerDeblocages();

/**
 * Identifiants des fonctions ouvertes dans cet état, dans l'ordre du fichier de données.
 * Sert aussi de valeur initiale à `annoncesVues` pour une sauvegarde qui n'a pas ce champ :
 * tout ce qui est déjà ouvert compte comme vu, rien ne se rejoue.
 */
export function deblocagesAtteints(region: DonneesRegion, monde: Monde, catalogue: readonly Deblocage[] = deblocages): string[] {
  const etat = etatMondeDe(region);
  const nomZone = (id: string) => monde.zone(id).nom;
  return catalogue.filter(({ declencheur }) => {
    if ('zone' in declencheur) return monde.zonesOuvertes(etat).some(zone => zone.id === declencheur.zone);
    if ('amelioration' in declencheur) return region.ameliorations.includes(declencheur.amelioration);
    const condition = monde.lieu(declencheur.lieu).si;
    return !condition || evaluer(condition, etat, { nomZone }).ok;
  }).map(deblocage => deblocage.id);
}

/**
 * Fonctions ouvertes dont l'annonce n'a pas été vue et n'est pas déjà en attente (`exclus`).
 * `silencieux` : ouvertes par un événement qui les a déjà annoncées, à marquer comme vues sans rien afficher.
 */
export function nouveauxDeblocages(region: DonneesRegion, monde: Monde, exclus: readonly string[],
  catalogue: readonly Deblocage[] = deblocages): { annoncer: Deblocage[]; silencieux: string[] } {
  const vues = new Set([...(region.annoncesVues ?? []), ...exclus]);
  const ouverts = new Set(deblocagesAtteints(region, monde, catalogue));
  const nouveaux = catalogue.filter(deblocage => ouverts.has(deblocage.id) && !vues.has(deblocage.id));
  const deja = (deblocage: Deblocage) => deblocage.dejaAnnonceSi !== undefined && region.drapeaux.includes(deblocage.dejaAnnonceSi);
  return { annoncer: nouveaux.filter(deblocage => !deja(deblocage)), silencieux: nouveaux.filter(deja).map(deblocage => deblocage.id) };
}
