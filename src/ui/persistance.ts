import { creerGestionnaire } from '../core/sauvegarde';
import type { DonneesRegion } from '../core/sauvegarde';
import { equipeDeDepart } from './equipe-de-depart';

export const ERREUR_CHARGEMENT = 'Une erreur est survenue. Recharge la page ; ta partie est gardée.';
export const ERREUR_CONFLIT = 'Cette partie est ouverte ailleurs. Recharge la page.';

export function detailErreur(erreur: unknown): string {
  const message = erreur instanceof Error ? erreur.message : '';
  if (message.includes('Conflit')) return ERREUR_CONFLIT;
  if (message.includes('récente')) return 'Cette partie nécessite une version plus récente du jeu.';
  if (/stockage|quota|SecurityError/i.test(message)) return 'Le navigateur empêche l’accès à la sauvegarde ou manque de place.';
  return 'Les données de cette partie ne peuvent pas être lues.';
}

export function ouvrirPartie(options: Parameters<typeof creerGestionnaire>[0]) {
  const gestionnaire = creerGestionnaire(options);
  // Valider aussi le compte avant toute création ou écriture.
  gestionnaire.chargerCompte();
  const recente = gestionnaire.listerParties()[0];
  let partie = recente ? gestionnaire.chargerPartie(recente.id)! : gestionnaire.creerPartie('Partie 1');
  let enveloppe = gestionnaire.chargerRegion(partie.id, partie.donnees.regionCourante);
  if (!enveloppe) throw new Error('Région de la partie introuvable');
  if (!recente) enveloppe = gestionnaire.ecrireRegion(partie.id, enveloppe.id,
    { ...enveloppe.donnees, equipe: equipeDeDepart() }, { revisionAttendue: enveloppe.revision });
  let derniere = JSON.stringify(enveloppe.donnees);
  let bloquee = false;
  return {
    region: enveloppe.donnees,
    enregistrer(region: DonneesRegion) {
      const suivante = JSON.stringify(region);
      if (bloquee || suivante === derniere) return;
      try {
        const actuelle = gestionnaire.chargerPartie(partie.id);
        if (actuelle?.revision !== partie.revision) throw new Error('Conflit de partie');
        enveloppe = gestionnaire.ecrireRegion(partie.id, region.regionId, region,
          { revisionAttendue: enveloppe!.revision });
        partie = gestionnaire.ecrirePartie(partie.id, partie.donnees, { revisionAttendue: partie.revision });
        derniere = suivante;
      } catch (erreur) {
        bloquee = true;
        throw erreur;
      }
    },
  };
}
