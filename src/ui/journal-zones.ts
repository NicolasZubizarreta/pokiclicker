import donneesZones from '../../data/regions/kanto/zones.json';
import donneesPokemon from '../../data/pokemon.json';
import type { Horloge } from '../core/clock';
import type { Stockage } from '../core/sauvegarde';
import type { EtatCombat } from '../core/combat';
import type { ZoneMonde } from '../core/monde';
import { reglages } from '../core/reglages';
import { avancerJournal, creerJournal, debuterEssai, entrerZone, finirEssai, pauserJournal,
  rechargerJournal, reprendreJournal, type Issue, type JournalZones } from '../core/journal-zones';

// Préfixe distinct des comptes et parties : exclu des sauvegardes et de leurs exports.
export const CLE_JOURNAL = 'pokiclicker-dev:journal-zones';
export function creerJournalLocal(horloge: Horloge, stockage: Stockage) {
  if (!reglages.journal.actif || import.meta.env.PROD) return null;
  // Empreinte du contenu, indépendante de la version du schéma des données.
  let empreinte = 2166136261;
  for (const caractere of JSON.stringify([donneesZones, donneesPokemon, reglages])) {
    empreinte = Math.imul(empreinte ^ caractere.charCodeAt(0), 16777619) >>> 0;
  }
  const revision = empreinte.toString(16);
  let journal = creerJournal(revision, horloge.maintenant());
  let motifPause: 'pause' | 'onglet-masque' | 'rechargement' | null = null;
  const conserver = (suivant: JournalZones) => {
    if (suivant === journal) return;
    journal = suivant;
    // Un stockage bloqué ou plein ne doit jamais interrompre le jeu.
    try { stockage.ecrire(CLE_JOURNAL, JSON.stringify(journal)); } catch { /* Relevé conservé en mémoire. */ }
  };
  try {
    const texte = stockage.lire(CLE_JOURNAL);
    if (texte) {
      const precedent = JSON.parse(texte) as JournalZones;
      if (precedent.version === 1 && precedent.revisionDonnees === revision
        && Number.isFinite(precedent.dernierReleveMs) && precedent.zones && !Array.isArray(precedent.zones)
        && Object.values(precedent.zones).every(zone => zone && Number.isFinite(zone.tempsActifMs)
          && Number.isFinite(zone.nombreEssais) && Array.isArray(zone.visites)
          && zone.visites.every(visite => visite && Number.isFinite(visite.tempsActifMs)
            && Array.isArray(visite.interruptions) && visite.interruptions.every(interruption => interruption)
            && Array.isArray(visite.essais) && visite.essais.every(essai => essai)))
        && (precedent.zoneCourante === null || precedent.zones[precedent.zoneCourante]?.visites.length)) {
        journal = rechargerJournal(precedent, horloge.maintenant());
      }
    }
  } catch { /* Un ancien relevé illisible ne bloque pas la partie. */ }
  return {
    synchroniser(lieu: ZoneMonde, coeur: EtatCombat | null) {
      const maintenant = horloge.maintenant();
      let suivant = entrerZone(journal, lieu.id, { nom: lieu.nom,
        multiplicateurPv: lieu.sansCombat ? null : lieu.multiplicateurPv,
        combat: reglages.combat, actifs: coeur?.actifs ?? [],
        autoAttaque: coeur?.autoAttaque, autoClic: coeur?.autoClic }, maintenant);
      if (motifPause) suivant = pauserJournal(suivant, motifPause, maintenant);
      if (coeur?.ennemi.boss && coeur.attenteMs === 0) {
        suivant = debuterEssai(suivant, coeur.zoneId, maintenant);
      } else if (!coeur || !coeur.ennemi.boss) suivant = finirEssai(suivant, 'abandon', maintenant);
      conserver(suivant);
    },
    issue(issue: Issue, cle: string) {
      const maintenant = horloge.maintenant();
      conserver(finirEssai(debuterEssai(journal, cle, maintenant), issue, maintenant));
    },
    avancer(pasMs: number) { conserver(avancerJournal(journal, pasMs, horloge.maintenant())); },
    pauser(motif: 'pause' | 'onglet-masque' | 'rechargement') {
      motifPause = motif;
      conserver(pauserJournal(journal, motif, horloge.maintenant()));
    },
    reprendre() { motifPause = null; conserver(reprendreJournal(journal, horloge.maintenant())); },
  };
}
