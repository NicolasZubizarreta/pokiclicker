import { compteInitial, creerGestionnaire } from '../core/sauvegarde';
import type { DonneesRegion } from '../core/sauvegarde';
import type { PreferencesCombat } from '../core/sauvegarde-types';
import { reglages } from '../core/reglages';
import { kanto } from '../core/regions';
import { equipeDeDepart } from './equipe-de-depart';

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

export function ouvrirPartie(options: Parameters<typeof creerGestionnaire>[0],
  depart: Pick<DonneesRegion, 'equipe' | 'drapeaux'> = { equipe: equipeDeDepart(), drapeaux: [] }) {
  const gestionnaire = creerGestionnaire(options);
  // Valider aussi le compte avant toute création ou écriture.
  const compte = gestionnaire.chargerCompte()?.donnees ?? compteInitial();
  const preferences: PreferencesCombat = {
    autoAttaque: compte.preferences.autoAttaque ?? reglages.depart.preferences.autoAttaque,
    arretAuto: structuredClone(compte.preferences.arretAuto ?? reglages.depart.preferences.arretAuto),
  };
  let dernieresPreferences = JSON.stringify(preferences);
  const recente = gestionnaire.listerParties()[0];
  let partie = recente ? gestionnaire.chargerPartie(recente.id)! : gestionnaire.creerPartie('Partie 1',
    depart.drapeaux.includes('nouvelle-partie') ? kanto.depart : undefined);
  let enveloppe = gestionnaire.chargerRegion(partie.id, partie.donnees.regionCourante);
  if (!enveloppe) throw new Error('Région de la partie introuvable');
  if (!recente) enveloppe = gestionnaire.ecrireRegion(partie.id, enveloppe.id,
    { ...enveloppe.donnees, ...depart }, { revisionAttendue: enveloppe.revision });
  let derniere = JSON.stringify([enveloppe.donnees, partie.donnees.pokedexNational]);
  let bloquee = false;
  return {
    region: enveloppe.donnees,
    pokedex: partie.donnees.pokedexNational,
    preferences,
    sonActive: compte.preferences.sonActive ?? reglages.sons.actifParDefaut,
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
    enregistrer(region: DonneesRegion, pokedex: readonly number[]) {
      const suivante = JSON.stringify([region, pokedex]);
      if (bloquee || suivante === derniere) return;
      try {
        const actuelle = gestionnaire.chargerPartie(partie.id);
        if (actuelle?.revision !== partie.revision) throw new Error('Conflit de partie');
        enveloppe = gestionnaire.ecrireRegion(partie.id, region.regionId, region,
          { revisionAttendue: enveloppe!.revision });
        const donnees = JSON.stringify(pokedex) === JSON.stringify(partie.donnees.pokedexNational)
          ? partie.donnees : { ...partie.donnees, pokedexNational: [...pokedex] };
        partie = gestionnaire.ecrirePartie(partie.id, donnees, { revisionAttendue: partie.revision });
        derniere = suivante;
      } catch (erreur) {
        bloquee = true;
        throw erreur;
      }
    },
  };
}
