import { Coquille } from './Coquille';
import { MiseAJour } from './MiseAJour';
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import { EcranCompte } from './compte/EcranCompte';
import { EcranRepriseAilleurs } from './compte/EcranRepriseAilleurs';
import { EcranSupprimeeAilleurs } from './compte/EcranSupprimeeAilleurs';
import { DialogueDeconnexion } from './compte/DialogueDeconnexion';
import { useSessionCompte } from './compte/session-compte';
import { creerHorlogeSysteme } from '../core/clock';
import { departNouvellePartie, storeJeu } from './store';
import { creerGestionnaire } from '../core/sauvegarde';
import { creerStockageLocal } from './stockage-local';
import { creerSynchro, type PartieListee } from './synchro';
import { ZoneCompte } from './compte/ZoneCompte';
import { useStore } from 'zustand';
import { registreSucces } from '../core/succes';
import { creerAppareilActif } from './appareil';
import { EcranAutreAppareil } from './compte/EcranAutreAppareil';

// La zone compte lit le résumé du compte dans le store du jeu, seulement quand elle est affichée.
function ZoneCompteConnectee(props: Omit<ComponentProps<typeof ZoneCompte>, 'compte' | 'registre'>) {
  const compte = useStore(storeJeu, e => e.compte);
  return <ZoneCompte {...props} compte={compte} registre={registreSucces} />;
}

// Le store du jeu est un singleton : un jeu déjà monté dans cette page garde sa région en mémoire.
let jeuDejaMonte = false;

function PartieConnectee({ jeton, quandDeconnecter }: { jeton: string; quandDeconnecter: () => void }) {
  const [, rafraichir] = useState(0);
  const [phase, fixerPhase] = useState<'verification' | 'creation' | 'jeu'>('verification');
  const [ecranParties, fixerEcranParties] = useState(false);
  const [liste, fixerListe] = useState<{ parties: PartieListee[]; horsConnexion: boolean }>({ parties: [], horsConnexion: false });
  const [chargement, fixerChargement] = useState(false);
  const [jeuMonte, fixerJeuMonte] = useState(false);
  const [occupe, fixerOccupe] = useState(false);
  const [erreur, fixerErreur] = useState('');
  const jeuArrete = useRef(false);
  const resolution = useRef(false);
  const [avis, fixerAvis] = useState<string | null>(null);
  const [deco, fixerDeco] = useState<ComponentProps<typeof DialogueDeconnexion>['etat'] | null>(null);
  const [repriseEnAttente, fixerRepriseEnAttente] = useState(false);
  const appareil = useMemo(() => creerAppareilActif({ stockage: creerStockageLocal(), horloge: creerHorlogeSysteme(),
    urlApi: import.meta.env.VITE_API_URL ?? '', jeton: () => jeton,
    quandChange: () => rafraichir(n => n + 1) }), [jeton]);
  const synchro = useMemo(() => creerSynchro({ stockage: creerStockageLocal(), horloge: creerHorlogeSysteme(),
    urlApi: import.meta.env.VITE_API_URL ?? '', jeton: () => jeton,
    enPause: () => appareil.ailleurs(),
    appareilId: () => appareil.id(), quandAilleurs: () => appareil.signalerAilleurs(),
    quandChange: () => rafraichir(n => n + 1) }), [jeton, appareil]);
  const lireAvis = useCallback(() => {
    const phrase = synchro.lireAvis();
    if (phrase) fixerAvis(phrase);
  }, [synchro]);
  const [apresAilleurs, fixerApresAilleurs] = useState(false);
  useEffect(() => {
    let actif = true;
    void synchro.ouvrir().then(async resultat => {
      if (!actif) return;
      lireAvis();
      if (jeuDejaMonte && resultat === 'charge') { window.location.reload(); return; }
      if (!synchro.suppression()) {
        const gestionnaire = creerGestionnaire({ stockage: creerStockageLocal(), horloge: creerHorlogeSysteme(), genererId: () => 'x' });
        if (gestionnaire.listerParties().length === 0) {
          fixerPhase('creation');
          fixerChargement(true);
          const liste = await synchro.lister();
          if (actif) { fixerListe(liste); fixerChargement(false); }
          return;
        }
        const resultatAppareil = await appareil.ouvrir();
        if (!actif) return;
        if (resultatAppareil === 'libre') fixerJeuMonte(true);
      }
      fixerPhase('jeu');
    });
    return () => { actif = false; synchro.arreter(); appareil.arreter(); };
  }, [synchro, appareil, lireAvis]);
  useEffect(() => {
    if (!jeuMonte) return;
    jeuDejaMonte = true;
    synchro.demarrer();
    appareil.demarrer();
    const desabonner = storeJeu.abonnerSauvegarde(fermeture => { void synchro.envoyerMaintenant({ fermeture }); });
    return () => { desabonner(); synchro.arreter(); appareil.arreter(); };
  }, [synchro, appareil, jeuMonte]);
  const ailleurs = appareil.ailleurs();
  const suppression = synchro.suppression();
  const etatSynchro = synchro.etat();
  useEffect(() => {
    if (suppression && jeuMonte && !jeuArrete.current) {
      jeuArrete.current = true; storeJeu.getState().arreter();
    }
  }, [suppression, jeuMonte]);
  useEffect(() => {
    if (ailleurs && jeuMonte) {
      if (!jeuArrete.current) { jeuArrete.current = true; storeJeu.getState().arreter(); }
      appareil.arreter(); synchro.arreter();
    }
  }, [ailleurs, jeuMonte, appareil, synchro]);
  useEffect(() => {
    if (!jeuMonte || ailleurs || suppression || etatSynchro !== 'divergence' || resolution.current) return;
    resolution.current = true;
    jeuArrete.current = true;
    storeJeu.getState().arreter();
    void synchro.resoudre().then(resultat => {
      lireAvis();
      if (resultat === 'charge') { window.location.reload(); return; }
      if (!appareil.ailleurs() && jeuArrete.current) {
        storeJeu.getState().demarrer(); jeuArrete.current = false;
      }
    }).finally(() => { resolution.current = false; });
  }, [jeuMonte, ailleurs, suppression, etatSynchro, synchro, appareil, lireAvis]);
  async function resoudreSuppression(cote: 'garder' | 'abandonner') {
    if (occupe) return;
    fixerOccupe(true);
    fixerErreur('');
    const resultat = await synchro.resoudreSuppression(cote);
    if (resultat === 'echec') {
      fixerErreur("Connexion impossible. Rien n'a changé, réessaie.");
    } else if (cote === 'abandonner') { window.location.reload(); return; }
    if (resultat === 'ok' && !appareil.ailleurs() && jeuArrete.current) {
      storeJeu.getState().demarrer(); jeuArrete.current = false;
      synchro.demarrer();
    }
    if (resultat === 'ok' && !jeuMonte && await appareil.ouvrir() === 'libre') fixerJeuMonte(true);
    fixerOccupe(false);
  }
  async function reprendre() {
    if (occupe) return;
    fixerOccupe(true);
    fixerErreur('');
    fixerRepriseEnAttente(true);
    synchro.arreter();
    if (await appareil.reprendre() === 'ok') {
      const resultat = await synchro.ouvrir();
      lireAvis();
      if (resultat === 'charge') { window.location.reload(); return; }
      if (resultat === 'hors-ligne') fixerErreur('Connexion impossible. Réessaie.');
      else {
        fixerRepriseEnAttente(false);
        if (!synchro.suppression()) {
          if (jeuArrete.current) { storeJeu.getState().demarrer(); jeuArrete.current = false; }
          synchro.demarrer();
          fixerJeuMonte(true);
        }
      }
    } else fixerErreur('Connexion impossible. Réessaie.');
    fixerOccupe(false);
  }
  async function listerParties() {
    fixerChargement(true);
    fixerListe(await synchro.lister());
    fixerChargement(false);
  }
  function voirParties() { fixerApresAilleurs(true); fixerEcranParties(true); void listerParties(); }
  async function deconnecter() {
    if (deco === 'chargement') return;
    if (deco !== 'confirmer' || synchro.enAttente()) {
      fixerDeco('chargement');
      if (jeuMonte) storeJeu.getState().sauvegarder();
      await synchro.envoyerMaintenant({ fermeture: true });
      if (synchro.enAttente() || ['hors-ligne', 'refuse', 'divergence'].includes(synchro.etat())) {
        fixerDeco('echec'); return;
      }
    }
    synchro.arreter(); appareil.arreter(); quandDeconnecter();
  }
  async function menuPrincipal(): Promise<boolean> {
    if (!storeJeu.getState().sauvegarder()) return false;
    await synchro.envoyerMaintenant({ fermeture: true });
    fixerErreur(''); fixerEcranParties(true); void listerParties();
    return true;
  }
  // envoyerMaintenant ne rejette jamais : l'état de la synchro dit si la partie est vraiment partie.
  const attendreEnvoi = async () => {
    await synchro.envoyerMaintenant({ fermeture: true });
    return !['hors-ligne', 'refuse', 'divergence'].includes(synchro.etat());
  };
  async function jouer(id: string) {
    if (occupe) return;
    fixerOccupe(true); fixerErreur('');
    if (jeuMonte) storeJeu.getState().arreter();
    if (await synchro.ouvrirPartie(id) === 'ok') { window.location.reload(); return; }
    fixerErreur("Connexion impossible. Rien n'a changé, réessaie.");
    if (jeuMonte && !appareil.ailleurs()) storeJeu.getState().demarrer();
    fixerOccupe(false);
  }
  async function creer(nom: string) {
    if (occupe) return;
    fixerOccupe(true); fixerErreur('');
    const resultat = await synchro.creerPartie(nom, departNouvellePartie());
    if (resultat === 'ok') { window.location.reload(); return; }
    fixerErreur(resultat === 'plein' ? 'Tu as déjà 20 parties. Supprime-en une pour en créer une autre.'
      : resultat === 'nom-invalide' ? 'Donne un nom à ta partie (100 caractères au plus).'
        : "La partie n'a pas pu être créée. Réessaie.");
    fixerOccupe(false);
  }
  async function renommer(id: string, nom: string): Promise<boolean> {
    if (occupe) return false;
    fixerOccupe(true); fixerErreur('');
    const r = await synchro.renommerPartie(id, nom);
    if (r === 'ok') await listerParties();
    else fixerErreur(r === 'nom-invalide' ? 'Donne un nom à ta partie (100 caractères au plus).'
      : "Connexion impossible. Le nom n'a pas changé, réessaie.");
    fixerOccupe(false);
    return r === 'ok';
  }
  async function supprimer(id: string) {
    if (occupe) return;
    fixerOccupe(true); fixerErreur('');
    const courante = liste.parties.some(p => p.id === id && p.courante);
    const arrete = courante && jeuMonte;
    if (arrete) storeJeu.getState().arreter();
    if (await synchro.supprimerPartie(id) === 'ok') {
      if (courante) { window.location.reload(); return; }
      await listerParties();
    } else {
      fixerErreur("Connexion impossible. La partie n'est pas supprimée, réessaie.");
      if (arrete && !appareil.ailleurs()) { storeJeu.getState().demarrer(); synchro.demarrer(); }
    }
    fixerOccupe(false);
  }
  if (phase === 'verification') return <p role="status">Vérification de la sauvegarde…</p>;
  const gestionnaire = creerGestionnaire({ stockage: creerStockageLocal(), horloge: creerHorlogeSysteme(), genererId: () => 'x' });
  const id = suppression?.id ?? gestionnaire.partieCourante();
  const partie = id ? gestionnaire.chargerPartie(id) : null;
  const regionId = partie?.donnees.regionCourante ?? '';
  const zoneId = id ? gestionnaire.chargerRegion(id, regionId)?.donnees.zoneId ?? '' : '';
  return <>
    {jeuMonte && <Coquille quandMenuPrincipal={menuPrincipal} attendreEnvoi={attendreEnvoi} />}
    {!suppression && !jeuMonte && !ecranParties && (ailleurs || repriseEnAttente) && <div>
      <EcranAutreAppareil nom={partie?.donnees.nom ?? ''} regionId={regionId} zoneId={zoneId} ecritLe={partie?.ecritLe ?? ''}
        occupe={occupe} erreur={erreur} quandReprendre={() => { void reprendre(); }} quandPlusTard={voirParties} />
    </div>}
    {jeuMonte && ailleurs && !apresAilleurs && <div className="fixed inset-0 z-50">
      <EcranRepriseAilleurs nom={partie?.donnees.nom ?? ''} quandVoirParties={voirParties} />
    </div>}
    {suppression && <div className={jeuMonte ? 'fixed inset-0 z-50' : undefined}>
      <EcranSupprimeeAilleurs nom={partie?.donnees.nom ?? ''} {...suppression.local} occupe={occupe} erreur={erreur}
        quandGarder={() => { void resoudreSuppression('garder'); }} quandAbandonner={() => { void resoudreSuppression('abandonner'); }} />
    </div>}
    {(phase === 'creation' || (ecranParties && (!ailleurs || !jeuMonte || apresAilleurs))) && <div className={jeuMonte ? 'fixed inset-0 z-50 overflow-y-auto' : undefined}>
      <ZoneCompteConnectee {...liste} chargement={chargement} occupe={occupe} erreur={erreur}
        quandRenommer={renommer}
        quandJouer={id => { void jouer(id); }} quandCreer={nom => { void creer(nom); }} quandSupprimer={id => { void supprimer(id); }}
        quandRetourJeu={phase === 'creation' || ailleurs || repriseEnAttente ? undefined : () => fixerEcranParties(false)}
        etatSynchro={synchro.etat()} quandDeconnecter={() => fixerDeco(synchro.enAttente() ? 'confirmer-attente' : 'confirmer')} />
    </div>}
    {avis && <div role="status" className="compte-message info fixed inset-x-0 top-0 z-50">{avis}<button className="plaque min-h-12 min-w-12" onClick={() => fixerAvis(null)}>OK</button></div>}
    {deco && <DialogueDeconnexion etat={deco} quandConfirmer={() => { void deconnecter(); }} quandReessayer={() => { void deconnecter(); }} quandAnnuler={() => fixerDeco(null)} quandRester={() => fixerDeco(null)} />}
  </>;
}

function JeuAvecCompte() {
  const session = useSessionCompte();
  const [token, fixerToken] = useState(() => {
    const parametres = new URLSearchParams(window.location.search);
    return parametres.get('token') ?? (parametres.get('error') === 'INVALID_TOKEN' ? '' : null);
  });
  useEffect(() => {
    const adresse = new URL(window.location.href);
    if (adresse.searchParams.has('token')) {
      adresse.searchParams.delete('token');
      window.history.replaceState(window.history.state, '', adresse.pathname + adresse.search + adresse.hash);
    }
  }, []);
  if (token !== null || !session.valide) {
    if (token === null && session.attente) return <p role="status">Vérification du compte…</p>;
    return <EcranCompte token={token} sessionExpiree={session.expiree} quandConnecte={jeton => { fixerToken(null); session.memoriser(jeton); }} quandReinitialise={() => { fixerToken(null); session.memoriser(null); }} />;
  }
  return session.jeton ? <PartieConnectee key={session.jeton} jeton={session.jeton} quandDeconnecter={() => { void session.quitter(); }} />
    : <Coquille />;
}

export default function App() {
  // Le service worker s'enregistre dès le premier écran, connexion comprise : le jeu doit être en cache même avant la première connexion.
  return <>
    <MiseAJour />
    {import.meta.env.VITE_API_URL ? <JeuAvecCompte /> : <Coquille />}
  </>;
}
