import { echanger, envoyerAuPc, placerDansEquipe, type ResultatEquipe } from './equipe';
import { chargerPokemon } from './pokemon';
import { reglages } from './reglages';
import type { DonneesRegion } from './sauvegarde-types';
import { enregistrerEquipe, lireSuivi } from './suivi';

const emplacementValide = (n: number): n is 0 | 1 | 2 => Number.isInteger(n) && n >= 0 && n <= 2;
type Resultat = ResultatEquipe & { message?: string };
const catalogue = chargerPokemon();
const LETTRES = ['A', 'B', 'C'];

/** « Bulbizarre », « Bulbizarre et Roucool », « Bulbizarre, Roucool et 1 Pokémon » : liste lisible sur une ligne courte. */
const enumerer = (noms: readonly string[]) => noms.length < 2 ? (noms[0] ?? '')
  : `${noms.slice(0, -1).join(', ')} et ${noms.at(-1)}`;

/**
 * Phrase d'application quand des Pokémon enregistrés sont laissés de côté : ceux dont l'espèce est connue
 * (à la Pension, ou restés au PC faute de place) sont nommés ; un Pokémon relâché n'a plus de nom : il est compté.
 */
function messageApplication(emplacement: number, region: DonneesRegion, absents: readonly string[], sansPlace: readonly string[]): string {
  const nom = (p: { numero: number; surnom?: string }) => p.surnom ?? catalogue.parNumero(p.numero).nom;
  const pension = new Map(region.pension.parents.map(p => [p.uid, p]));
  const noms = absents.flatMap(uid => pension.has(uid) ? [nom(pension.get(uid)!)] : []);
  const inconnus = absents.length - noms.length;
  const indisponibles = inconnus > 0 ? [...noms, `${inconnus} Pokémon`] : noms;
  const restes = [...region.equipe, ...region.pc].filter(p => sansPlace.includes(p.uid)).map(nom);
  const parties: string[] = [];
  if (indisponibles.length) parties.push(`${enumerer(indisponibles)} ${absents.length > 1 ? 'ne sont plus disponibles' : 'n’est plus disponible'}`);
  if (restes.length) parties.push(`${enumerer(restes)} ${restes.length > 1 ? 'restent' : 'reste'} au PC (équipe pleine)`);
  return `Équipe ${LETTRES[emplacement]} appliquée, mais ${parties.join(' et ')}.`;
}

export function enregistrerEquipeCourante(region: DonneesRegion, emplacement: number): Resultat {
  if (!emplacementValide(emplacement)) return { ok: false, raison: 'Cet emplacement est introuvable.' };
  const uids = region.equipe.filter(p => !p.oeuf).map(p => p.uid);
  if (!uids.length) return { ok: false, raison: 'Ton équipe ne contient aucun Pokémon hors œuf.' };
  return { ok: true, region: { ...region, suivi: enregistrerEquipe(lireSuivi(region), emplacement, uids) } };
}

export function appliquerEquipeEnregistree(region: DonneesRegion, emplacement: number): Resultat {
  if (!emplacementValide(emplacement)) return { ok: false, raison: 'Cet emplacement est introuvable.' };
  const uids = lireSuivi(region).equipes[emplacement];
  if (!uids?.length) return { ok: false, raison: 'Aucune équipe enregistrée ici.' };
  const disponibles = new Map([...region.equipe, ...region.pc].filter(p => !p.oeuf).map(p => [p.uid, p]));
  const places = reglages.equipe.taille - region.equipe.filter(p => p.oeuf).length;
  const presents = [...new Set(uids)].filter(uid => disponibles.has(uid));
  const selection = presents.slice(0, places);
  const absents = [...new Set(uids)].filter(uid => !disponibles.has(uid));
  const sansPlace = presents.slice(places);
  if (!selection.length) return { ok: false, raison: 'Aucun Pokémon de cette équipe n’est disponible.' };
  const taille = selection.length + region.equipe.filter(p => p.oeuf).length;
  if (region.equipe.some((p, i) => p.oeuf && i >= taille)) {
    return { ok: false, raison: 'Il manque des Pokémon pour garder les œufs à leur place.' };
  }
  let courante = region;
  for (const uid of selection) {
    if (courante.equipe.some(p => p.uid === uid)) continue;
    const sortant = courante.equipe.find(p => !p.oeuf && !selection.includes(p.uid));
    const resultat = sortant ? echanger(courante, uid, sortant.uid) : placerDansEquipe(courante, uid);
    if (!resultat.ok) return resultat;
    if (resultat.echangeRequis) return { ok: false, raison: 'Ton équipe est pleine.' };
    courante = resultat.region;
  }
  for (const p of courante.equipe) {
    if (p.oeuf || selection.includes(p.uid)) continue;
    const resultat = envoyerAuPc(courante, p.uid);
    if (!resultat.ok) return resultat;
    courante = resultat.region;
  }
  let index = 0;
  const equipe = Array.from({ length: taille }, (_, i) => region.equipe[i]?.oeuf
    ? region.equipe[i]! : disponibles.get(selection[index++]!)!);
  return { ok: true, region: { ...courante, equipe },
    ...(absents.length || sansPlace.length ? { message: messageApplication(emplacement, region, absents, sansPlace) } : {}) };
}
