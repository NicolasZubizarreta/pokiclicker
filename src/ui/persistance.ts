import { compteInitial, creerGestionnaire } from '../core/sauvegarde';
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
  const message = erreur instanceof Error ? erreur.message : '';
  if (message.includes('Conflit')) return ERREUR_CONFLIT;
  if (message.includes('récente')) return 'Cette partie nécessite une version plus récente du jeu.';
  if (/stockage|quota|SecurityError/i.test(`${erreur instanceof Error ? erreur.name : ''} ${message}`)) return 'Le navigateur empêche l’accès à la sauvegarde ou manque de place.';
  if (/JSON|illisible|enveloppe|Région de la partie introuvable/i.test(message)) return 'Les données de cette partie ne peuvent pas être lues.';
  console.error(erreur);
  return `Une erreur inattendue est survenue.\n${erreur instanceof Error ? `${erreur.name}: ${erreur.message}` : String(erreur)}`;
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
  };
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
      if (bloquee) return;
      const actuel = gestionnaire.chargerCompte()?.donnees ?? compteInitial();
      gestionnaire.ecrireCompte({ ...actuel, preferences: { ...actuel.preferences, sonActive: actif } });
    },
    enregistrerPreferences(p: PreferencesCombat) {
      const suivantes = JSON.stringify(p);
      if (bloquee || suivantes === dernieresPreferences) return;
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
        if (actuelle?.revision !== partie.revision) throw new Error('Conflit de partie');
        const base = JSON.stringify([region, pokedex]);
        if (base !== derniereBase) {
          enveloppe = gestionnaire.ecrireRegion(partie.id, region.regionId, region,
            { revisionAttendue: enveloppe!.revision });
        }
        const donnees = { ...partie.donnees, nom: actuelle.donnees.nom, pokedexNational: [...pokedex], vus: [...vusComplets],
          statistiques: { ...partie.donnees.statistiques, tempsJeuMs: tempsBase + Math.floor(tempsSessionMs) } };
        partie = gestionnaire.ecrirePartie(partie.id, donnees, { revisionAttendue: partie.revision });
        derniere = suivante;
        derniereBase = base;
      } catch (erreur) {
        bloquee = true;
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
