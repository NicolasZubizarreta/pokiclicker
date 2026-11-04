/**
 * Temps actif = pas simulés attribuables à une période visible ; le rattrapage masqué est exclu.
 * Temps simulé = tous les pas de boucle, même masqués. Temps de montre = horloge depuis l'entrée.
 * Un dialogue de combat ne suspend pas la boucle et reste donc du temps actif.
 * Les interruptions (onglet masqué, pause de la boucle, rechargement) sont séparées,
 * jamais ajoutées au temps actif. Une reprise conserve la visite et l'essai ouverts :
 * ils ne sont jamais comptés deux fois. Le temps hors session part du dernier relevé.
 * Comparaison au simulateur : les attentes visibles, captures et dialogues sont inclus ;
 * les clics humains et le hasard ne sont pas ceux d'un parcours théorique.
 */
import type { Horloge } from './clock';
import type { reglages } from './reglages';

export type Issue = 'victoire' | 'echec' | 'abandon';
export type ParametresZone = {
  nom: string; multiplicateurPv: number | null; combat: typeof reglages.combat; actifs: readonly string[];
  autoAttaque?: boolean; autoClic?: boolean;
};
type Interruption = { motif: 'onglet-masque' | 'pause' | 'rechargement'; debutMs: number; finMs: number | null };
export type Instantane = {
  argent: number; argentTotalGagne: number; badges: number; pokedexCaptures: number; pokedexTotal: number;
  palierPokedex: number; bonusActifs: readonly string[]; ameliorations: readonly string[];
  inventaire: Readonly<Partial<Record<string, number>>>;
  equipe: readonly { numero: number; niveau: number; bonheur: number; calcium: number; shiny: boolean }[];
};
export type MesuresBoss = { pvBoss: number; dpsEquipe: number; clicParSeconde: number; degatsClic: number;
  tempsAccordeMs: number | null; margeTemps: number | null };
export type Action = { type: 'achat' | 'amelioration' | 'objet' | 'retour'; objet?: string;
  quantite?: number; prix?: number; soldeApres?: number; tMs: number };
type Essai = { cle: string; debutMs: number; finMs: number | null; issue: Issue | null;
  debut: Instantane | null; fin: Instantane | null; boss: MesuresBoss | null; nombreClics: number; tempsSimuleMs: number };
export type Visite = {
  entreeMs: number; sortieMs: number | null; tempsActifMs: number;
  tempsSimuleMs: number; tempsMontreMs: number; entree: Instantane | null; actions: Action[];
  parametres: ParametresZone; interruptions: Interruption[]; essais: Essai[];
};
export type JournalZones = {
  version: 2; revisionDonnees: string; dernierReleveMs: number; zoneCourante: string | null;
  zones: Record<string, { visites: Visite[]; tempsActifMs: number; nombreEssais: number }>;
};

export function creerJournal(revisionDonnees: string, maintenantMs: number): JournalZones {
  return { version: 2, revisionDonnees, dernierReleveMs: maintenantMs, zoneCourante: null, zones: {} };
}
function visiteCourante(journal: JournalZones) {
  return journal.zoneCourante === null ? undefined : journal.zones[journal.zoneCourante]?.visites.at(-1);
}
// Chaque transition retourne un nouvel état ; aucun stockage ni horloge globale dans le cœur.
function modifierJournal(journal: JournalZones, maintenantMs: number, modifier: (copie: JournalZones) => void): JournalZones {
  const copie = structuredClone(journal);
  modifier(copie);
  const visite = visiteCourante(copie);
  if (visite) visite.tempsMontreMs = maintenantMs - visite.entreeMs;
  copie.dernierReleveMs = maintenantMs;
  return copie;
}
export function finirEssai(journal: JournalZones, issue: Issue, maintenantMs: number, fin: Instantane | null = null): JournalZones {
  if (visiteCourante(journal)?.essais.at(-1)?.issue !== null) return journal;
  return modifierJournal(journal, maintenantMs, copie => {
    const essai = visiteCourante(copie)?.essais.at(-1);
    if (essai && essai.issue === null) { essai.issue = issue; essai.finMs = maintenantMs; essai.fin = structuredClone(fin); }
  });
}
export function sortirZone(journal: JournalZones, maintenantMs: number, fin: Instantane | null = null): JournalZones {
  return modifierJournal(finirEssai(journal, 'abandon', maintenantMs, fin), maintenantMs, copie => {
    const visite = visiteCourante(copie);
    if (visite) {
      visite.sortieMs = maintenantMs;
      visite.tempsMontreMs = maintenantMs - visite.entreeMs;
      const interruption = visite.interruptions.at(-1);
      if (interruption?.finMs === null) interruption.finMs = maintenantMs;
    }
    copie.zoneCourante = null;
  });
}
export function entrerZone(journal: JournalZones, zone: string, parametres: ParametresZone, maintenantMs: number, entree: Instantane | null = null): JournalZones {
  if (journal.zoneCourante === zone) return journal;
  return modifierJournal(sortirZone(journal, maintenantMs, entree), maintenantMs, copie => {
    copie.zoneCourante = zone;
    const releve = copie.zones[zone] ??= { visites: [], tempsActifMs: 0, nombreEssais: 0 };
    releve.visites.push({ entreeMs: maintenantMs, sortieMs: null, tempsActifMs: 0,
      tempsSimuleMs: 0, tempsMontreMs: 0, entree: structuredClone(entree), actions: [],
      parametres: structuredClone(parametres), interruptions: [], essais: [] });
  });
}
export function debuterEssai(journal: JournalZones, cle: string, maintenantMs: number,
  debut: Instantane | null = null, boss: MesuresBoss | null = null): JournalZones {
  const precedent = visiteCourante(journal)?.essais.at(-1);
  if (precedent?.issue === null && precedent.cle === cle) return journal;
  return modifierJournal(finirEssai(journal, 'abandon', maintenantMs, debut), maintenantMs, copie => {
    const visite = visiteCourante(copie);
    if (!visite || copie.zoneCourante === null) return;
    visite.essais.push({ cle, debutMs: maintenantMs, finMs: null, issue: null,
      debut: structuredClone(debut), fin: null, boss: structuredClone(boss), nombreClics: 0, tempsSimuleMs: 0 });
    copie.zones[copie.zoneCourante]!.nombreEssais++;
  });
}
export function pauserJournal(journal: JournalZones, motif: Interruption['motif'], maintenantMs: number): JournalZones {
  if (visiteCourante(journal)?.interruptions.at(-1)?.finMs === null) return journal;
  return modifierJournal(journal, maintenantMs, copie => {
    visiteCourante(copie)?.interruptions.push({ motif, debutMs: maintenantMs, finMs: null });
  });
}
export function reprendreJournal(journal: JournalZones, maintenantMs: number): JournalZones {
  return modifierJournal(journal, maintenantMs, copie => {
    const interruption = visiteCourante(copie)?.interruptions.at(-1);
    if (interruption?.finMs === null) interruption.finMs = maintenantMs;
  });
}
export function rechargerJournal(journal: JournalZones, maintenantMs: number): JournalZones {
  return reprendreJournal(pauserJournal(reprendreJournal(journal, journal.dernierReleveMs), 'rechargement', journal.dernierReleveMs), maintenantMs);
}
export function avancerJournal(journal: JournalZones, pasMs: number, maintenantMs: number, visible = true, joueMs = pasMs): JournalZones {
  if (![pasMs, joueMs].every(Number.isFinite) || pasMs < 0 || joueMs < 0 || joueMs > pasMs) throw new Error('Durée du journal invalide');
  return modifierJournal(journal, maintenantMs, copie => {
    const visite = visiteCourante(copie);
    if (!visite || copie.zoneCourante === null) return;
    visite.tempsSimuleMs += pasMs;
    const essai = visite.essais.at(-1);
    if (essai?.issue === null) {
      essai.tempsSimuleMs += pasMs;
      if (essai.boss) essai.boss.clicParSeconde = essai.tempsSimuleMs > 0 ? essai.nombreClics * 1000 / essai.tempsSimuleMs : 0;
    }
    if (!visible || visite.interruptions.at(-1)?.finMs === null) return;
    visite.tempsActifMs += joueMs;
    copie.zones[copie.zoneCourante]!.tempsActifMs += joueMs;
  });
}
export function ajouterAction(journal: JournalZones, action: Action): JournalZones {
  return modifierJournal(journal, action.tMs, copie => { visiteCourante(copie)?.actions.push(structuredClone(action)); });
}
export function compterClic(journal: JournalZones, maintenantMs: number): JournalZones {
  if (visiteCourante(journal)?.essais.at(-1)?.issue !== null) return journal;
  return modifierJournal(journal, maintenantMs, copie => {
    const essai = visiteCourante(copie)!.essais.at(-1)!;
    essai.nombreClics++;
    if (essai.boss && essai.tempsSimuleMs > 0) essai.boss.clicParSeconde = essai.nombreClics * 1000 / essai.tempsSimuleMs;
  });
}
export function exporterJournal(journal: JournalZones | null): JournalZones | null {
  return journal === null ? null : structuredClone(journal);
}
export function effacerJournal(journal: JournalZones, horloge: Horloge): JournalZones {
  return creerJournal(journal.revisionDonnees, horloge.maintenant());
}
