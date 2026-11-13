import donnees from '../../data/tutoriels.json';
import { deblocages } from './deblocages';
import { pensionVisitee } from './pension';
import { reglages } from './reglages';
import type { DonneesRegion } from './sauvegarde-types';

export type ActionTuto = 'clic' | 'vaincu' | 'equipe' | 'sac' | 'ok';
export type EtapeTuto = { cible: string | null; texte: string; geste?: string; action: ActionTuto };
export type DeclencheurTuto = { debut: 'nouvelle-partie' } | { cible: string; deblocage: string };
export type EcranTuto = 'Combat' | 'Carte' | 'PC' | 'Casino' | 'Pension';
export type Tutoriel = { id: string; titre: string; ecran: EcranTuto; declencheur: DeclencheurTuto; etapes: EtapeTuto[] };

const texteNonVide = (valeur: unknown): valeur is string => typeof valeur === 'string' && valeur.trim().length > 0;

export function validerTutoriels(liste: Tutoriel[]): void {
  const ids = new Set<string>();
  for (const tuto of liste) {
    if (!['Combat', 'Carte', 'PC', 'Casino', 'Pension'].includes(tuto.ecran)) throw new Error(`Écran de tutoriel invalide : ${tuto.id}`);
    if (!texteNonVide(tuto.id) || tuto.id.includes(':') || ids.has(tuto.id)) throw new Error(`Identifiant de tutoriel invalide : ${tuto.id}`);
    ids.add(tuto.id);
    if (!Array.isArray(tuto.etapes) || tuto.etapes.length < 1 || tuto.etapes.length > 8) throw new Error(`Nombre d'étapes invalide : ${tuto.id}`);
    for (const etape of tuto.etapes) {
      if (!texteNonVide(etape.texte) || etape.texte.trim().split(/ +/).length > 12) throw new Error(`Texte de tutoriel invalide : ${tuto.id}`);
      if (!['clic', 'vaincu', 'equipe', 'sac', 'ok'].includes(etape.action)) throw new Error(`Action de tutoriel inconnue : ${tuto.id}`);
      if (etape.cible === null ? etape.action !== 'ok' : !texteNonVide(etape.cible)) throw new Error(`Cible de tutoriel invalide : ${tuto.id}`);
      if (etape.geste !== undefined && !texteNonVide(etape.geste)) throw new Error(`Geste de tutoriel invalide : ${tuto.id}`);
    }
    const d = tuto.declencheur;
    if (!d || typeof d !== 'object' || !(
      ('debut' in d && Object.keys(d).length === 1 && d.debut === 'nouvelle-partie')
      || ('cible' in d && Object.keys(d).length === 2 && texteNonVide(d.cible) && deblocages.some(element => element.id === d.deblocage))
    )) throw new Error(`Déclencheur de tutoriel invalide : ${tuto.id}`);
  }
}

export function chargerTutoriels(): Tutoriel[] {
  const liste = structuredClone(donnees.tutoriels) as Tutoriel[];
  validerTutoriels(liste);
  return liste;
}

export const tutoriels = chargerTutoriels();

export function tutoriel(id: string): Tutoriel {
  const resultat = tutoriels.find(tuto => tuto.id === id);
  if (!resultat) throw new Error(`Tutoriel inconnu : ${id}`);
  return resultat;
}

export function tutosDejaDepasses(region: DonneesRegion): string[] {
  return tutoriels.filter(({ id, declencheur }) => {
    if (id === 'route-1') return region.statistiques.eliminations > 0 || region.bossVaincus.length > 0 || region.etape > reglages.depart.etape;
    if (id === 'pc') return region.pc.length > 0;
    if (id === 'pension') return pensionVisitee(region);
    if (id === 'casino') return region.casinoVu === true || region.jetons > 0;
    // Une fonction déjà annoncée avant la mise à jour est déjà connue du joueur.
    return !('debut' in declencheur) && (region.annoncesVues ?? []).includes(declencheur.deblocage);
  }).map(tuto => tuto.id);
}

/** « visibles » peut être une fonction : le DOM n'est interrogé qu'une fois, et seulement si un tutoriel non vu a déjà son déblocage. */
export function tutoAArmer(region: DonneesRegion, atteints: readonly string[], visibles: ReadonlySet<string> | (() => ReadonlySet<string>)): Tutoriel | null {
  let lues: ReadonlySet<string> | undefined;
  const vues = () => lues ??= typeof visibles === 'function' ? visibles() : visibles;
  return tutoriels.find(({ id, declencheur, etapes }) => !(region.tutosVus ?? []).includes(id) && (
    'debut' in declencheur
      ? region.evenementsJoues.includes('kanto.intro') && region.starterId !== null && region.statistiques.eliminations === 0 && vues().has(etapes[0]!.cible ?? '')
      : atteints.includes(declencheur.deblocage) && vues().has(declencheur.cible)
  )) ?? null;
}

export function avecTutoVu(region: DonneesRegion, id: string): DonneesRegion {
  return region.tutosVus?.includes(id) ? region : { ...region, tutosVus: [...(region.tutosVus ?? []), id] };
}
