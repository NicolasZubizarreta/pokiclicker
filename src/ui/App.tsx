import { Coquille } from './Coquille';
import { useEffect, useMemo, useState } from 'react';
import { EcranCompte } from './compte/EcranCompte';
import { EcranChoixVersion } from './compte/EcranChoixVersion';
import { useSessionCompte } from './compte/session-compte';
import { creerHorlogeSysteme } from '../core/clock';
import { storeJeu } from './store';
import { creerStockageLocal } from './stockage-local';
import { creerSynchro } from './synchro';

// Le store du jeu est un singleton : un jeu déjà monté dans cette page garde sa région en mémoire.
let jeuDejaMonte = false;

function PartieConnectee({ jeton, quandDeconnecter }: { jeton: string; quandDeconnecter: () => void }) {
  const [, rafraichir] = useState(0);
  const [phase, fixerPhase] = useState<'verification' | 'jeu'>('verification');
  const [jeuMonte, fixerJeuMonte] = useState(false);
  const [occupe, fixerOccupe] = useState(false);
  const [erreur, fixerErreur] = useState('');
  const synchro = useMemo(() => creerSynchro({ stockage: creerStockageLocal(), horloge: creerHorlogeSysteme(),
    urlApi: import.meta.env.VITE_API_URL ?? '', jeton: () => jeton,
    quandChange: () => rafraichir(n => n + 1) }), [jeton]);
  useEffect(() => {
    let actif = true;
    void synchro.ouvrir().then(resultat => {
      if (!actif) return;
      if (jeuDejaMonte && resultat === 'charge') { window.location.reload(); return; }
      fixerPhase('jeu');
      if (!synchro.choix()) fixerJeuMonte(true);
    });
    return () => { actif = false; synchro.arreter(); };
  }, [synchro]);
  useEffect(() => {
    if (!jeuMonte) return;
    jeuDejaMonte = true;
    synchro.demarrer();
    const desabonner = storeJeu.abonnerSauvegarde(fermeture => { void synchro.envoyerMaintenant({ fermeture }); });
    return () => { desabonner(); synchro.arreter(); };
  }, [synchro, jeuMonte]);
  async function choisir(cote: 'local' | 'serveur') {
    if (occupe) return;
    fixerOccupe(true);
    fixerErreur('');
    const recharger = cote === 'serveur' && (jeuMonte || jeuDejaMonte);
    if (recharger && jeuMonte) storeJeu.getState().arreter();
    const resultat = await synchro.trancher(cote);
    if (resultat === 'echec') {
      fixerErreur("Connexion impossible. Rien n'a changé, réessaie.");
      if (recharger && jeuMonte) storeJeu.getState().demarrer();
    } else if (recharger) { window.location.reload(); return; }
    if (!synchro.choix()) fixerJeuMonte(true);
    fixerOccupe(false);
  }
  if (phase === 'verification') return <p role="status">Vérification de la sauvegarde…</p>;
  const choix = synchro.choix();
  return <>
    {jeuMonte && <Coquille quandDeconnecter={quandDeconnecter} />}
    {choix && <div className={jeuMonte ? 'fixed inset-0 z-50' : undefined}>
      <EcranChoixVersion choix={choix} occupe={occupe} erreur={erreur} quandChoisir={cote => { void choisir(cote); }} />
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
    return <EcranCompte token={token} quandConnecte={jeton => { fixerToken(null); session.memoriser(jeton); }} quandReinitialise={() => { fixerToken(null); session.memoriser(null); }} />;
  }
  return session.jeton ? <PartieConnectee key={session.jeton} jeton={session.jeton} quandDeconnecter={() => { void session.quitter(); }} />
    : <Coquille quandDeconnecter={() => { void session.quitter(); }} />;
}

export default function App() {
  return import.meta.env.VITE_API_URL ? <JeuAvecCompte /> : <Coquille />;
}
