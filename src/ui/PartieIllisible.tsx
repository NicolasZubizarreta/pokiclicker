import { useState } from 'react';
import { creerHorlogeSysteme } from '../core/clock';
import { creerGestionnaire, type Stockage } from '../core/sauvegarde';
import { exporterPartieOuBrut } from './export-secours';
import { genererIdentifiant } from './identifiants';
import { creerPartieNommee, detailErreur } from './persistance';
import { creerStockageLocal } from './stockage-local';
import { departNouvellePartie } from './store';
import { telechargerTexte } from './telecharger';

const PREFIXE_PARTIE = 'pokiclicker:partie:';

/** Partie à exporter : la courante si elle se lit, sinon la première partie présente même illisible (lecture des clés brutes). */
function identifiantAExporter(stockage: Stockage): string | null {
  try {
    const courante = stockage.lire('pokiclicker:courante');
    if (courante && stockage.lire(PREFIXE_PARTIE + courante) !== null) return courante;
    const cle = stockage.cles().find(c => c.startsWith(PREFIXE_PARTIE));
    return cle ? cle.slice(PREFIXE_PARTIE.length) : null;
  } catch { return null; }
}

/**
 * Sortie quand le jeu ne peut pas lire la sauvegarde locale : la vraie situation (recharger n'y change rien),
 * un export de la sauvegarde telle qu'elle est, puis une nouvelle partie après confirmation explicite.
 * Rien n'est jamais effacé : la nouvelle partie s'ajoute, l'ancienne reste dans le navigateur.
 */
export function PartieIllisible({ stockage, quandTermine = () => window.location.reload() }: {
  stockage?: Stockage; quandTermine?: () => void;
}) {
  const [confirmer, fixerConfirmer] = useState(false);
  const [message, fixerMessage] = useState('');
  const [erreur, fixerErreur] = useState('');
  const local = stockage ?? creerStockageLocal();
  const options = { stockage: local, horloge: creerHorlogeSysteme(), genererId: genererIdentifiant };
  const id = identifiantAExporter(local);
  function exporter() {
    fixerErreur(''); fixerMessage('');
    try {
      const gestionnaire = creerGestionnaire(options);
      telechargerTexte(`pokiclicker-sauvegarde-illisible-${id!.slice(0, 8)}.json`,
        exporterPartieOuBrut(() => gestionnaire.exporterPartie(id!), local, id!));
      fixerMessage('Sauvegarde exportée dans tes téléchargements.');
    } catch (cause) { fixerErreur(detailErreur(cause)); }
  }
  function commencer() {
    fixerErreur('');
    try {
      creerPartieNommee(options, 'Partie 1', departNouvellePartie());
      quandTermine();
    } catch (cause) { fixerErreur(detailErreur(cause)); fixerConfirmer(false); }
  }
  return <section aria-label="Sauvegarde illisible" className="cadre grid gap-3 bg-surface p-4">
    <div role="alert" className="grid gap-2">
      <p className="font-titre text-xl font-bold">Cette sauvegarde ne peut pas être lue.</p>
      <p>Le jeu n’arrive pas à lire les données de cette partie. Elles sont toujours dans ton navigateur et rien n’a été effacé, mais recharger la page ne les réparera pas.</p>
    </div>
    {!confirmer && <>
      <p>Exporte-les pour en garder une copie, puis commence une nouvelle partie.</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        {id && <button type="button" className="plaque min-h-12 px-4" onClick={exporter}>Exporter la sauvegarde</button>}
        <button type="button" className="plaque min-h-12 px-4" onClick={() => { fixerErreur(''); fixerConfirmer(true); }}>Commencer une nouvelle partie</button>
      </div>
    </>}
    {confirmer && <div role="group" aria-label="Confirmation" className="cadre grid gap-3 bg-selection p-3">
      <p className="font-titre font-bold">Commencer une nouvelle partie ?</p>
      <p>Tu repars de zéro. L’ancienne sauvegarde reste dans ton navigateur, mais le jeu ne pourra plus l’ouvrir : exporte-la d’abord si tu veux la garder.</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="button" autoFocus className="plaque min-h-12 px-4" onClick={() => fixerConfirmer(false)}>Annuler</button>
        <button type="button" className="plaque min-h-12 px-4" onClick={commencer}>Oui, commencer une nouvelle partie</button>
      </div>
    </div>}
    {message && <p role="status">{message}</p>}
    {erreur && <p role="alert">{erreur}</p>}
  </section>;
}
