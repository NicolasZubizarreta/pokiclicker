/**
 * Temps actif = pas effectivement simulés par la boucle pendant que l'onglet est visible.
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
type Essai = { cle: string; debutMs: number; finMs: number | null; issue: Issue | null };
export type Visite = {
  entreeMs: number; sortieMs: number | null; tempsActifMs: number;
  parametres: ParametresZone; interruptions: Interruption[]; essais: Essai[];
};
export type JournalZones = {
  version: 1; revisionDonnees: string; dernierReleveMs: number; zoneCourante: string | null;
  zones: Record<string, { visites: Visite[]; tempsActifMs: number; nombreEssais: number }>;
};

export function creerJournal(revisionDonnees: string, maintenantMs: number): JournalZones {
  return { version: 1, revisionDonnees, dernierReleveMs: maintenantMs, zoneCourante: null, zones: {} };
}
function visiteCourante(journal: JournalZones) {
  return journal.zoneCourante === null ? undefined : journal.zones[journal.zoneCourante]?.visites.at(-1);
}
// Chaque transition retourne un nouvel état ; aucun stockage ni horloge globale dans le cœur.
function modifierJournal(journal: JournalZones, maintenantMs: number, modifier: (copie: JournalZones) => void): JournalZones {
  const copie = structuredClone(journal);
  modifier(copie);
  copie.dernierReleveMs = maintenantMs;
  return copie;
}
export function finirEssai(journal: JournalZones, issue: Issue, maintenantMs: number): JournalZones {
  if (visiteCourante(journal)?.essais.at(-1)?.issue !== null) return journal;
  return modifierJournal(journal, maintenantMs, copie => {
    const essai = visiteCourante(copie)?.essais.at(-1);
    if (essai && essai.issue === null) { essai.issue = issue; essai.finMs = maintenantMs; }
  });
}
export function sortirZone(journal: JournalZones, maintenantMs: number): JournalZones {
  return modifierJournal(finirEssai(journal, 'abandon', maintenantMs), maintenantMs, copie => {
    const visite = visiteCourante(copie);
    if (visite) {
      visite.sortieMs = maintenantMs;
      const interruption = visite.interruptions.at(-1);
      if (interruption?.finMs === null) interruption.finMs = maintenantMs;
    }
    copie.zoneCourante = null;
  });
}
export function entrerZone(journal: JournalZones, zone: string, parametres: ParametresZone, maintenantMs: number): JournalZones {
  if (journal.zoneCourante === zone) return journal;
  return modifierJournal(sortirZone(journal, maintenantMs), maintenantMs, copie => {
    copie.zoneCourante = zone;
    const releve = copie.zones[zone] ??= { visites: [], tempsActifMs: 0, nombreEssais: 0 };
    releve.visites.push({ entreeMs: maintenantMs, sortieMs: null, tempsActifMs: 0,
      parametres: structuredClone(parametres), interruptions: [], essais: [] });
  });
}
export function debuterEssai(journal: JournalZones, cle: string, maintenantMs: number): JournalZones {
  const precedent = visiteCourante(journal)?.essais.at(-1);
  if (precedent?.issue === null && precedent.cle === cle) return journal;
  return modifierJournal(finirEssai(journal, 'abandon', maintenantMs), maintenantMs, copie => {
    const visite = visiteCourante(copie);
    if (!visite || copie.zoneCourante === null) return;
    visite.essais.push({ cle, debutMs: maintenantMs, finMs: null, issue: null });
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
export function avancerJournal(journal: JournalZones, pasMs: number, maintenantMs: number): JournalZones {
  if (!Number.isFinite(pasMs) || pasMs < 0) throw new Error('Durée du journal invalide');
  return modifierJournal(journal, maintenantMs, copie => {
    const visite = visiteCourante(copie);
    if (!visite || copie.zoneCourante === null || visite.interruptions.at(-1)?.finMs === null) return;
    visite.tempsActifMs += pasMs;
    copie.zones[copie.zoneCourante]!.tempsActifMs += pasMs;
  });
}
export function exporterJournal(journal: JournalZones | null): JournalZones | null {
  return journal === null ? null : structuredClone(journal);
}
export function effacerJournal(journal: JournalZones, horloge: Horloge): JournalZones {
  return creerJournal(journal.revisionDonnees, horloge.maintenant());
}
