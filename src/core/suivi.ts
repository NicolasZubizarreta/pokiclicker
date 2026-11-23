import type { EvenementCombat } from './combat';
import { avancerChaine, type Chaine } from './chaines';

export const CATEGORIES_DEPENSE = ['boutique', 'centre', 'casino', 'pension'] as const;
export const JEUX_SUIVIS = ['machine', 'roulette', 'plusOuMoins', 'pileOuFace', 'gratter', 'blackjack', 'voltorbe'] as const;
export type StatsJeu = { parties: number; meilleurGain: number; meilleureSerie: number; serieActuelle: number };
export type Rencontre = { vus: number; captures: number; depuisShiny: number };
export type EntreeHall = { date: string; tempsJeuMs: number; equipe: { numero: number; niveau: number; shiny: boolean; surnom?: string }[] };
export type Suivi = {
  captures: number; capturesShiny: number; evolutions: number; oeufsEclos: number; bossVaincus: number;
  depenses: Partial<Record<(typeof CATEGORIES_DEPENSE)[number], number>>;
  jetons: { gagnes: number; perdus: number };
  casino: Partial<Record<(typeof JEUX_SUIVIS)[number], StatsJeu>>;
  rencontres: Record<string, Rencontre>;
  serieVictoires: number;
  records: { degatsClicMax: number; dpsMax: number; serieVictoiresMax: number; tempsBossMinMs: number | null; cadenceMax: number; capturesHeureMax: number; mannequinDpsMax: number; chaineMax: number };
  fenetreCaptures: { debutMs: number; n: number } | null;
  argentJours: Record<string, number>;
  equipes: (string[] | null)[];
  hall: EntreeHall[];
  titre?: string;
  /** Chaîne de capture en cours (F-j1-18) ; absente = aucune. */
  chaine?: Chaine;
};

export function suiviVide(): Suivi {
  return { captures: 0, capturesShiny: 0, evolutions: 0, oeufsEclos: 0, bossVaincus: 0,
    depenses: {}, jetons: { gagnes: 0, perdus: 0 }, casino: {}, rencontres: {}, serieVictoires: 0,
    records: { degatsClicMax: 0, dpsMax: 0, serieVictoiresMax: 0, tempsBossMinMs: null, cadenceMax: 0, capturesHeureMax: 0, mannequinDpsMax: 0, chaineMax: 0 },
    fenetreCaptures: null, argentJours: {}, equipes: [null, null, null], hall: [] };
}

export function lireSuivi(region: { suivi?: Suivi }): Suivi {
  const vide = suiviVide();
  const s = region.suivi;
  return { ...vide, ...s, jetons: { ...vide.jetons, ...s?.jetons }, records: { ...vide.records, ...s?.records } };
}

export function noterCombat(suivi: Suivi, evenement: EvenementCombat,
  ctx: { tempsJeuMs: number; dateLocale: string; or?: number; tempsBossMs?: number }): Suivi {
  const s = { ...suivi, records: { ...suivi.records } };
  if (evenement.type === 'boss-echoue') s.serieVictoires = 0;
  if (evenement.type === 'boss-vaincu') {
    s.bossVaincus++;
    if (ctx.tempsBossMs !== undefined) s.records.tempsBossMinMs = Math.min(s.records.tempsBossMinMs ?? Infinity, ctx.tempsBossMs);
  }
  if (evenement.type === 'capture-reussie' || evenement.type === 'ennemi-vaincu') {
    s.serieVictoires++;
    s.records.serieVictoiresMax = Math.max(s.records.serieVictoiresMax, s.serieVictoires);
    const capture = evenement.type === 'capture-reussie';
    if (!evenement.boss) {
      // Le record compte aussi la capture chromatique qui clôt la chaîne.
      s.records.chaineMax = Math.max(s.records.chaineMax, avancerChaine(s.chaine, { ...evenement, shiny: false }).longueur);
      s.chaine = avancerChaine(s.chaine, evenement);
      const r = s.rencontres[evenement.numero] ?? { vus: 0, captures: 0, depuisShiny: 0 };
      s.rencontres = { ...s.rencontres, [evenement.numero]: { vus: r.vus + 1,
        captures: r.captures + Number(capture), depuisShiny: evenement.shiny ? 0 : r.depuisShiny + 1 } };
    }
    if (capture) {
      s.captures++;
      s.capturesShiny += Number(evenement.shiny);
      s.fenetreCaptures = !s.fenetreCaptures || ctx.tempsJeuMs - s.fenetreCaptures.debutMs >= 3_600_000
        ? { debutMs: ctx.tempsJeuMs, n: 1 } : { ...s.fenetreCaptures, n: s.fenetreCaptures.n + 1 };
      s.records.capturesHeureMax = Math.max(s.records.capturesHeureMax, s.fenetreCaptures.n);
    } else if (!evenement.boss && ctx.or !== undefined) {
      s.argentJours = { ...s.argentJours, [ctx.dateLocale]: (s.argentJours[ctx.dateLocale] ?? 0) + ctx.or };
    }
  }
  s.argentJours = Object.fromEntries(Object.entries(s.argentJours).sort(([a], [b]) => a.localeCompare(b)).slice(-7));
  return s;
}

export const noterEvolution = (s: Suivi): Suivi => ({ ...s, evolutions: s.evolutions + 1 });
export const noterEclosions = (s: Suivi, n: number): Suivi => ({ ...s, oeufsEclos: s.oeufsEclos + n });
export function noterDepense(s: Suivi, categorie: (typeof CATEGORIES_DEPENSE)[number], montant: number): Suivi {
  return { ...s, depenses: { ...s.depenses, ...(montant > 0 ? { [categorie]: (s.depenses[categorie] ?? 0) + montant } : {}) } };
}
function noterRecord(s: Suivi, cle: Exclude<keyof Suivi['records'], 'tempsBossMinMs'>, valeur: number): Suivi {
  return { ...s, records: { ...s.records, [cle]: Math.max(s.records[cle], valeur) } };
}
export const noterRecordClic = (s: Suivi, degats: number): Suivi => noterRecord(s, 'degatsClicMax', degats);
export const noterDps = (s: Suivi, dps: number): Suivi => noterRecord(s, 'dpsMax', Math.round(dps * 10) / 10);
export const noterCadence = (s: Suivi, clicsParSeconde: number): Suivi => noterRecord(s, 'cadenceMax', clicsParSeconde);
export const noterMannequin = (s: Suivi, dps: number): Suivi => noterRecord(s, 'mannequinDpsMax', dps);

export function noterPartieCasino(s: Suivi, jeu: (typeof JEUX_SUIVIS)[number], { mise, gain }: { mise: number; gain: number }): Suivi {
  const ancien = s.casino[jeu] ?? { parties: 0, meilleurGain: 0, meilleureSerie: 0, serieActuelle: 0 };
  const net = gain - mise;
  const serieActuelle = net > 0 ? ancien.serieActuelle + 1 : 0;
  return { ...s, jetons: { gagnes: s.jetons.gagnes + Math.max(0, net), perdus: s.jetons.perdus + Math.max(0, -net) },
    casino: { ...s.casino, [jeu]: { parties: ancien.parties + 1, meilleurGain: Math.max(ancien.meilleurGain, net),
      serieActuelle, meilleureSerie: Math.max(ancien.meilleureSerie, serieActuelle) } } };
}
export function enregistrerEquipe(s: Suivi, emplacement: 0 | 1 | 2, uids: string[] | null): Suivi {
  const equipes = [...s.equipes];
  const equipe = uids && [...new Set(uids)].slice(0, 6);
  equipes[emplacement] = equipe?.length ? equipe : null;
  return { ...s, equipes };
}
export function enregistrerVictoireLigue(s: Suivi, entree: EntreeHall): Suivi {
  return { ...s, hall: [structuredClone(entree), ...s.hall].slice(0, 50) };
}
export function definirTitre(s: Suivi, titre: string | undefined): Suivi {
  const resultat = { ...s };
  if (titre === undefined) delete resultat.titre;
  else resultat.titre = titre.slice(0, 40);
  return resultat;
}
