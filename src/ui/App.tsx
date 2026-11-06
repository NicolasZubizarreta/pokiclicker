import { Coquille } from './Coquille';
import { MiseAJour } from './MiseAJour';
import { useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import { EcranCompte } from './compte/EcranCompte';
import { EcranChoixVersion } from './compte/EcranChoixVersion';
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
  const [repriseEnAttente, fixerRepriseEnAttente] = useState(false);
  const appareil = useMemo(() => creerAppareilActif({ stockage: creerStockageLocal(), horloge: creerHorlogeSysteme(),
    urlApi: import.meta.env.VITE_API_URL ?? '', jeton: () => jeton,
    quandChange: () => rafraichir(n => n + 1) }), [jeton]);
  const synchro = useMemo(() => creerSynchro({ stockage: creerStockageLocal(), horloge: creerHorlogeSysteme(),
    urlApi: import.meta.env.VITE_API_URL ?? '', jeton: () => jeton,
    enPause: () => appareil.ailleurs(),
    quandChange: () => rafraichir(n => n + 1) }), [jeton, appareil]);
  useEffect(() => {
    let actif = true;
    void synchro.ouvrir().then(async resultat => {
      if (!actif) return;
      if (jeuDejaMonte && resultat === 'charge') { window.location.reload(); return; }
      if (!synchro.choix()) {
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
  }, [synchro, appareil]);
  useEffect(() => {
    if (!jeuMonte) return;
    jeuDejaMonte = true;
    synchro.demarrer();
    appareil.demarrer();
    const desabonner = storeJeu.abonnerSauvegarde(fermeture => { void synchro.envoyerMaintenant({ fermeture }); });
    return () => { desabonner(); synchro.arreter(); appareil.arreter(); };
  }, [synchro, appareil, jeuMonte]);
  const ailleurs = appareil.ailleurs();
  useEffect(() => {
    if (ailleurs && jeuMonte && !jeuArrete.current) {
      jeuArrete.current = true;
      storeJeu.getState().arreter();
    }
  }, [ailleurs, jeuMonte]);
  async function choisir(cote: 'local' | 'serveur') {
    if (occupe) return;
    fixerOccupe(true);
    fixerErreur('');
    const recharger = cote === 'serveur' && (jeuMonte || jeuDejaMonte || !!synchro.choix()?.supprimee);
    if (recharger && jeuMonte) storeJeu.getState().arreter();
    const resultat = await synchro.trancher(cote);
    if (resultat === 'echec') {
      fixerErreur("Connexion impossible. Rien n'a changé, réessaie.");
      if (recharger && jeuMonte) storeJeu.getState().demarrer();
    } else if (recharger) { window.location.reload(); return; }
    if (resultat === 'ok' && !synchro.choix() && !appareil.ailleurs() && jeuArrete.current) {
      storeJeu.getState().demarrer(); jeuArrete.current = false;
      synchro.demarrer();
    }
    if (!synchro.choix() && await appareil.ouvrir() === 'libre') fixerJeuMonte(true);
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
      if (resultat === 'charge') { window.location.reload(); return; }
      if (resultat === 'hors-ligne') fixerErreur('Connexion impossible. Réessaie.');
      else {
        fixerRepriseEnAttente(false);
        if (resultat !== 'choix') {
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
  async function menuPrincipal(): Promise<boolean> {
    if (!storeJeu.getState().sauvegarder()) return false;
    await synchro.envoyerMaintenant({ fermeture: true });
    fixerErreur(''); fixerEcranParties(true); void listerParties();
    return true;
  }
  // envoyerMaintenant ne rejette jamais : l'état de la synchro dit si la partie est vraiment partie.
  const attendreEnvoi = async () => {
    await synchro.envoyerMaintenant({ fermeture: true });
    return !['hors-ligne', 'refuse', 'conflit'].includes(synchro.etat());
  };
  async function jouer(id: string) {
    if (occupe) return;
    fixerOccupe(true); fixerErreur('');
    if (jeuMonte) storeJeu.getState().arreter();
    if (await synchro.ouvrirPartie(id) === 'ok') { window.location.reload(); return; }
    fixerErreur("Connexion impossible. Rien n'a changé, réessaie.");
    if (jeuMonte) storeJeu.getState().demarrer();
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
      if (arrete) { storeJeu.getState().demarrer(); synchro.demarrer(); }
    }
    fixerOccupe(false);
  }
  if (phase === 'verification') return <p role="status">Vérification de la sauvegarde…</p>;
  const choix = synchro.choix();
  return <>
    {jeuMonte && <Coquille quandMenuPrincipal={menuPrincipal} attendreEnvoi={attendreEnvoi} />}
    {!choix && (ailleurs || repriseEnAttente) && <div className={jeuMonte ? 'fixed inset-0 z-50' : undefined}>
      <EcranAutreAppareil occupe={occupe} erreur={erreur} quandReprendre={() => { void reprendre(); }} />
    </div>}
    {choix && <div className={jeuMonte ? 'fixed inset-0 z-50' : undefined}>
      <EcranChoixVersion choix={choix} occupe={occupe} erreur={erreur} quandChoisir={cote => { void choisir(cote); }} />
    </div>}
    {(phase === 'creation' || ecranParties) && <div className={jeuMonte ? 'fixed inset-0 z-50 overflow-y-auto' : undefined}>
      <ZoneCompteConnectee {...liste} chargement={chargement} occupe={occupe} erreur={erreur}
        quandJouer={id => { void jouer(id); }} quandCreer={nom => { void creer(nom); }} quandSupprimer={id => { void supprimer(id); }}
        quandRetourJeu={phase === 'creation' ? undefined : () => fixerEcranParties(false)}
        etatSynchro={synchro.etat()} quandDeconnecter={quandDeconnecter} />
    </div>}
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
