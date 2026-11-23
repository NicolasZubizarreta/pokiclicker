import { compteInitial, creerGestionnaire, ErreurStockage } from '../core/sauvegarde';
import type { DonneesRegion } from '../core/sauvegarde';
import type { DonneesCompte, PreferencesCombat } from '../core/sauvegarde-types';
import { mesuresDe, registreSucces, succesAccordes } from '../core/succes';
import { reglages } from '../core/reglages';
import { kanto } from '../core/regions';
import { equipeDeDepart } from './equipe-de-depart';
import { completerVus } from '../core/pokedex';

export const ERREUR_CHARGEMENT = 'Une erreur est survenue. Recharge la page ; ta partie est gardée.';
export const ERREUR_CONFLIT = 'Cette partie est ouverte ailleurs. Recharge la page.';

export function detailErreur(erreur: unknown): string {
  if (erreur instanceof ErreurStockage) return erreur.code === 'stockage-plein'
    ? "Ton appareil n'a plus de place pour sauvegarder. Libère de l'espace puis réessaie."
    : "Le navigateur empêche l'accès à la sauvegarde. Vérifie qu'il n'est pas en navigation privée.";
  const message = erreur instanceof Error ? erreur.message : '';
  if (message.includes('Conflit')) return ERREUR_CONFLIT;
  if (message.includes('récente')) return 'Cette partie nécessite une version plus récente du jeu.';
  if (/stockage|quota|SecurityError/i.test(`${erreur instanceof Error ? erreur.name : ''} ${message}`)) return 'Le navigateur empêche l’accès à la sauvegarde ou manque de place.';
  // « déjà utilisé » : l'identifiant d'une partie illisible, que `listerParties()` ne montre plus (B-core-01).
  if (/JSON|illisible|enveloppe|Région de la partie introuvable|déjà utilisé/i.test(message)) return 'Les données de cette partie ne peuvent pas être lues.';
  console.error(erreur);
  return 'Une erreur inattendue est survenue.';
}

export function creerPartieNommee(options: Parameters<typeof creerGestionnaire>[0], nom: string,
  depart: Pick<DonneesRegion, 'equipe' | 'drapeaux'>): string {
  const gestionnaire = creerGestionnaire(options);
  const partie = gestionnaire.creerPartie(nom, depart.drapeaux.includes('nouvelle-partie') ? kanto.depart : undefined);
  const region = gestionnaire.chargerRegion(partie.id, partie.donnees.regionCourante)!;
  gestionnaire.ecrireRegion(partie.id, region.id, { ...region.donnees, ...depart }, { revisionAttendue: region.revision });
  gestionnaire.choisirPartie(partie.id);
  return partie.id;
}

export function ouvrirPartie(options: Parameters<typeof creerGestionnaire>[0],
  depart: Pick<DonneesRegion, 'equipe' | 'drapeaux'> = { equipe: equipeDeDepart(), drapeaux: [] }) {
  const gestionnaire = creerGestionnaire(options);
  // Valider aussi le compte avant toute création ou écriture.
  const compte = gestionnaire.chargerCompte()?.donnees ?? compteInitial();
  const preferences: PreferencesCombat = {
    autoAttaque: compte.preferences.autoAttaque ?? reglages.depart.preferences.autoAttaque,
    autoClicLie: compte.preferences.autoClicLie ?? reglages.depart.preferences.autoClicLie,
    arretAuto: structuredClone(compte.preferences.arretAuto ?? reglages.depart.preferences.arretAuto),
    evolutionAuto: compte.preferences.evolutionAuto ?? reglages.depart.preferences.evolutionAuto,
    passerEclosions: compte.preferences.passerEclosions ?? reglages.depart.preferences.passerEclosions,
    relacherDoublons: compte.preferences.relacherDoublons ?? reglages.depart.preferences.relacherDoublons,
    notifications: compte.preferences.notifications ?? reglages.depart.preferences.notifications,
  };
  const balle: unknown = compte.preferences.balleChoisie;
  if (typeof balle === 'string' && reglages.capture.balles.some(b => b.cle === balle)) preferences.balleChoisie = balle;
  let dernieresPreferences = JSON.stringify(preferences);
  const id = gestionnaire.partieCourante() ?? creerPartieNommee(options, 'Partie 1', depart);
  let partie = gestionnaire.chargerPartie(id)!;
  let enveloppe = gestionnaire.chargerRegion(partie.id, partie.donnees.regionCourante);
  if (!enveloppe) throw new Error('Région de la partie introuvable');
  let derniere = JSON.stringify([enveloppe.donnees, partie.donnees.pokedexNational, partie.donnees.vus]);
  // Région et capturés tels qu'écrits en dernier : un simple nouveau « vu » ne réécrit pas la région (sa révision n'avance pas).
  let derniereBase = JSON.stringify([enveloppe.donnees, partie.donnees.pokedexNational]);
  let bloquee = false;
  const tempsBase = partie.donnees.statistiques.tempsJeuMs ?? 0;
  return {
    region: enveloppe.donnees,
    nom: partie.donnees.nom,
    tempsBase,
    pokedex: partie.donnees.pokedexNational,
    vus: partie.donnees.vus,
    preferences,
    sonActive: compte.preferences.sonActive ?? reglages.sons.actifParDefaut,
    compte(): DonneesCompte {
      return gestionnaire.chargerCompte()?.donnees ?? compteInitial();
    },
    /** Vrai après un échec d'écriture de la partie : plus rien n'est écrit tant que la partie n'est pas rechargée. */
    estBloquee: () => bloquee,
    enregistrerSon(actif: boolean) {
      const actuel = gestionnaire.chargerCompte()?.donnees ?? compteInitial();
      gestionnaire.ecrireCompte({ ...actuel, preferences: { ...actuel.preferences, sonActive: actif } });
    },
    enregistrerPreferences(p: PreferencesCombat) {
      const suivantes = JSON.stringify(p);
      if (suivantes === dernieresPreferences) return;
      const actuel = gestionnaire.chargerCompte()?.donnees ?? compteInitial();
      gestionnaire.ecrireCompte({ ...actuel, preferences: { ...actuel.preferences, ...structuredClone(p) } });
      dernieresPreferences = suivantes;
    },
    /** `tempsSessionMs` : temps de jeu écoulé depuis l'ouverture ; il s'ajoute au temps déjà gardé dans la partie et n'est écrit qu'avec une vraie modification. */
    enregistrer(region: DonneesRegion, pokedex: readonly number[], tempsSessionMs = 0, vus?: readonly number[]) {
      const vusComplets = completerVus(vus ?? partie.donnees.vus, pokedex);
      const suivante = JSON.stringify([region, pokedex, vusComplets]);
      if (bloquee || suivante === derniere) return;
      try {
        const actuelle = gestionnaire.chargerPartie(partie.id);
        // Un renommage depuis un autre écran change la révision (B-core-17) mais pas le reste : on repart de sa révision.
        if (actuelle && actuelle.revision !== partie.revision
          && JSON.stringify({ ...actuelle.donnees, nom: '' }) === JSON.stringify({ ...partie.donnees, nom: '' })) {
          partie = { ...partie, revision: actuelle.revision };
        }
        if (actuelle?.revision !== partie.revision) throw new Error('Conflit de partie');
        const base = JSON.stringify([region, pokedex]);
        if (base !== derniereBase) {
          enveloppe = gestionnaire.ecrireRegion(partie.id, region.regionId, region,
            { revisionAttendue: enveloppe!.revision });
          derniereBase = base;
        }
        const donnees = { ...partie.donnees, nom: actuelle.donnees.nom, pokedexNational: [...pokedex], vus: [...vusComplets],
          statistiques: { ...partie.donnees.statistiques, tempsJeuMs: tempsBase + Math.floor(tempsSessionMs) } };
        partie = gestionnaire.ecrirePartie(partie.id, donnees, { revisionAttendue: partie.revision });
        derniere = suivante;
        derniereBase = base;
      } catch (erreur) {
        bloquee = !(erreur instanceof ErreurStockage) && erreur instanceof Error && /Conflit|revisionAttendue/.test(erreur.message);
        throw erreur;
      }
      try {
        const compteActuel = gestionnaire.chargerCompte()?.donnees ?? compteInitial();
        const resultat = succesAccordes(registreSucces, compteActuel, mesuresDe(region, pokedex));
        if (resultat.nouveaux.length) gestionnaire.ecrireCompte(resultat.compte);
      } catch {
        // La partie est déjà sauvegardée ; un échec du compte ne doit pas la bloquer.
      }
    },
  };
}
