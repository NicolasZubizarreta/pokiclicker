import donneesZones from '../../data/regions/kanto/zones.json';
import donneesPokemon from '../../data/pokemon.json';
import type { Horloge } from '../core/clock';
import type { Stockage } from '../core/sauvegarde';
import type { EtatCombat } from '../core/combat';
import { calculerClic, calculerDpsEquipe } from '../core/combat';
import type { DonneesRegion } from '../core/sauvegarde-types';
import { chargerPokemon } from '../core/pokemon';
import { pokedexDeKanto } from '../core/pokedex';
import { actifsDe, chargerJalons } from '../core/progression';
import { clesActives } from '../core/objets-actifs';
import type { ZoneMonde } from '../core/monde';
import { reglages } from '../core/reglages';
import { avancerJournal, creerJournal, debuterEssai, entrerZone, finirEssai, pauserJournal,
  rechargerJournal, reprendreJournal, exporterJournal, effacerJournal, ajouterAction, compterClic,
  type Action, type Instantane, type Issue, type JournalZones } from '../core/journal-zones';

const catalogue = chargerPokemon();
export function instantaneDe(region: DonneesRegion, pokedex: readonly number[], maintenant: number): Instantane {
  const dex = pokedexDeKanto(pokedex, catalogue);
  return { argent: region.argent, argentTotalGagne: region.statistiques.argentTotalGagne,
    badges: region.badges.length, pokedexCaptures: dex.nombre, pokedexTotal: dex.total,
    palierPokedex: chargerJalons().filter(jalon => jalon.palier <= dex.nombre).at(-1)?.palier ?? 0,
    bonusActifs: [...actifsDe(region), ...clesActives(region.chronos, maintenant)],
    ameliorations: [...region.ameliorations], inventaire: { ...region.inventaire },
    equipe: region.equipe.map(({ numero, niveau, bonheur, calcium, shiny }) => ({ numero, niveau, bonheur, calcium, shiny })) };
}

function instantaneValide(valeur: Instantane | null): boolean {
  return valeur === null || !!valeur && [valeur.argent, valeur.argentTotalGagne, valeur.badges,
    valeur.pokedexCaptures, valeur.pokedexTotal, valeur.palierPokedex].every(Number.isFinite)
    && Array.isArray(valeur.bonusActifs) && Array.isArray(valeur.ameliorations)
    && valeur.bonusActifs.every(cle => typeof cle === 'string') && valeur.ameliorations.every(cle => typeof cle === 'string')
    && !!valeur.inventaire && !Array.isArray(valeur.inventaire) && Object.values(valeur.inventaire).every(Number.isFinite) && Array.isArray(valeur.equipe)
    && valeur.equipe.every(p => p && [p.numero, p.niveau, p.bonheur, p.calcium].every(Number.isFinite) && typeof p.shiny === 'boolean');
}

// Préfixe distinct des comptes et parties : exclu des sauvegardes et de leurs exports.
export const CLE_JOURNAL = 'pokiclicker-dev:journal-zones';
export const CLE_ACTIVATION_JOURNAL = 'pokiclicker-dev:journal-actif';
declare global {
  interface Window { pokiJournal?: { exporter(): JournalZones | null; effacer(): void } }
}
export function creerJournalLocal(horloge: Horloge, stockage: Stockage, activation?: boolean,
  instantane: () => Instantane | null = () => null) {
  let actif = reglages.journal.actif;
  try { const choix = stockage.lire(CLE_ACTIVATION_JOURNAL); if (choix === '0' || choix === '1') actif = choix === '1'; } catch { /* Stockage indisponible. */ }
  actif = activation ?? actif;
  if (!actif || import.meta.env.PROD) return null;
  // Empreinte du contenu, indépendante de la version du schéma des données.
  let empreinte = 2166136261;
  for (const caractere of JSON.stringify([donneesZones, donneesPokemon, reglages])) {
    empreinte = Math.imul(empreinte ^ caractere.charCodeAt(0), 16777619) >>> 0;
  }
  const revision = empreinte.toString(16);
  let journal = creerJournal(revision, horloge.maintenant());
  let motifPause: 'pause' | 'onglet-masque' | 'rechargement' | null = null;
  let dernierPasMs = horloge.maintenant();
  let budgetVisibleMs = 0;
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
      if (precedent.version === 2 && precedent.revisionDonnees === revision
        && Number.isFinite(precedent.dernierReleveMs) && precedent.zones && !Array.isArray(precedent.zones)
        && Object.values(precedent.zones).every(zone => zone && Number.isFinite(zone.tempsActifMs)
          && Number.isFinite(zone.nombreEssais) && Array.isArray(zone.visites)
          && zone.visites.every(visite => visite && Number.isFinite(visite.tempsActifMs)
            && Number.isFinite(visite.entreeMs) && (visite.sortieMs === null || Number.isFinite(visite.sortieMs))
            && Number.isFinite(visite.tempsSimuleMs) && Number.isFinite(visite.tempsMontreMs)
            && instantaneValide(visite.entree) && Array.isArray(visite.actions)
            && visite.actions.every(action => action && ['achat', 'amelioration', 'objet', 'retour'].includes(action.type) && Number.isFinite(action.tMs)
              && (action.objet === undefined || typeof action.objet === 'string')
              && [action.quantite, action.prix, action.soldeApres].every(n => n === undefined || Number.isFinite(n)))
            && Array.isArray(visite.interruptions) && visite.interruptions.every(interruption => interruption
              && ['pause', 'onglet-masque', 'rechargement'].includes(interruption.motif)
              && Number.isFinite(interruption.debutMs) && (interruption.finMs === null || Number.isFinite(interruption.finMs)))
            && Array.isArray(visite.essais) && visite.essais.every(essai => essai
              && typeof essai.cle === 'string' && Number.isFinite(essai.debutMs)
              && (essai.finMs === null || Number.isFinite(essai.finMs))
              && (essai.issue === null || ['victoire', 'echec', 'abandon'].includes(essai.issue))
              && Number.isFinite(essai.nombreClics) && Number.isFinite(essai.tempsSimuleMs)
              && instantaneValide(essai.debut) && instantaneValide(essai.fin)
              && (essai.boss === null || !!essai.boss
                && [essai.boss.pvBoss, essai.boss.dpsEquipe, essai.boss.clicParSeconde, essai.boss.degatsClic].every(Number.isFinite)
                && (essai.boss.tempsAccordeMs === null || Number.isFinite(essai.boss.tempsAccordeMs))
                && (essai.boss.margeTemps === null || Number.isFinite(essai.boss.margeTemps))))))
        && (precedent.zoneCourante === null || precedent.zones[precedent.zoneCourante]?.visites.length)) {
        journal = rechargerJournal(precedent, horloge.maintenant());
      }
    }
  } catch { /* Un ancien relevé illisible ne bloque pas la partie. */ }
  return {
    exporter() { return exporterJournal(avancerJournal(journal, 0, horloge.maintenant())); },
    effacer() { conserver(effacerJournal(journal, horloge)); },
    synchroniser(lieu: ZoneMonde, coeur: EtatCombat | null, vaincue = false) {
      const maintenant = horloge.maintenant();
      const entree = journal.zoneCourante !== lieu.id;
      const visite = journal.zoneCourante === null ? undefined : journal.zones[journal.zoneCourante]?.visites.at(-1);
      const essai = visite?.essais.at(-1);
      const commencer = coeur?.ennemi.boss && coeur.attenteMs === 0 && (entree || essai?.issue !== null || essai.cle !== coeur.zoneId);
      const terminer = (!coeur || !coeur.ennemi.boss) && essai?.issue === null;
      const capture = entree || commencer || terminer ? instantane() : null;
      let suivant = entrerZone(journal, lieu.id, { nom: lieu.nom,
        multiplicateurPv: lieu.sansCombat ? null : lieu.multiplicateurPv,
        combat: reglages.combat, actifs: coeur?.actifs ?? [],
        autoAttaque: coeur?.autoAttaque, autoClic: coeur?.autoClic }, maintenant, capture);
      if (entree && vaincue) suivant = ajouterAction(suivant, { type: 'retour', tMs: maintenant });
      if (motifPause) suivant = pauserJournal(suivant, motifPause, maintenant);
      if (coeur?.ennemi.boss && coeur.attenteMs === 0) {
        if (commencer) {
          const dpsEquipe = calculerDpsEquipe(coeur.equipe, coeur.ennemi, coeur.actifs);
          const tempsAccordeMs = coeur.minuteurMs === null ? null : reglages.combat.minuteurBossMs;
          suivant = debuterEssai(suivant, coeur.zoneId, maintenant, capture, {
            pvBoss: coeur.ennemi.pvMax, dpsEquipe, clicParSeconde: 0, degatsClic: calculerClic(dpsEquipe, coeur.actifs),
            tempsAccordeMs, margeTemps: tempsAccordeMs === null ? null
              : dpsEquipe > 0 ? coeur.ennemi.pvMax / dpsEquipe * 1000 / tempsAccordeMs : null });
        }
      } else if (terminer) suivant = finirEssai(suivant, 'abandon', maintenant, capture);
      conserver(suivant);
    },
    issue(issue: Issue, cle: string) {
      const maintenant = horloge.maintenant();
      const capture = instantane();
      conserver(finirEssai(debuterEssai(journal, cle, maintenant, capture), issue, maintenant, capture));
    },
    action(action: Omit<Action, 'tMs'>) { conserver(ajouterAction(journal, { ...action, tMs: horloge.maintenant() })); },
    clic() { conserver(compterClic(journal, horloge.maintenant())); },
    avancer(pasMs: number) {
      const maintenant = horloge.maintenant();
      const visible = !motifPause && (typeof document === 'undefined' || document.visibilityState !== 'hidden');
      budgetVisibleMs = visible ? budgetVisibleMs + Math.max(0, maintenant - dernierPasMs) : 0;
      dernierPasMs = maintenant;
      const joue = Math.min(pasMs, budgetVisibleMs);
      budgetVisibleMs -= joue;
      conserver(avancerJournal(journal, pasMs, maintenant, visible, joue));
    },
    pauser(motif: 'pause' | 'onglet-masque' | 'rechargement') {
      motifPause = motif;
      budgetVisibleMs = 0;
      conserver(pauserJournal(journal, motif, horloge.maintenant()));
    },
    reprendre() { motifPause = null; dernierPasMs = horloge.maintenant(); budgetVisibleMs = 0;
      conserver(reprendreJournal(journal, horloge.maintenant())); },
  };
}
