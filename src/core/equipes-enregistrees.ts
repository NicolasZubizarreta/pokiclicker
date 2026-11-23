import { echanger, envoyerAuPc, placerDansEquipe, type ResultatEquipe } from './equipe';
import { reglages } from './reglages';
import type { DonneesRegion } from './sauvegarde-types';
import { enregistrerEquipe, lireSuivi } from './suivi';

const emplacementValide = (n: number): n is 0 | 1 | 2 => Number.isInteger(n) && n >= 0 && n <= 2;
type Resultat = ResultatEquipe & { message?: string };

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
  const selection = [...new Set(uids)].filter(uid => disponibles.has(uid)).slice(0, places);
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
    ...(selection.length < uids.length ? { message: 'Certains Pokémon sont indisponibles ou l’équipe manque de place. Ils ont été ignorés.' } : {}) };
}
