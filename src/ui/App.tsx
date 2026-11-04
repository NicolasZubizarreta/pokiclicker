import { Coquille } from './Coquille';
import { useEffect, useState } from 'react';
import { EcranCompte } from './compte/EcranCompte';
import { useSessionCompte } from './compte/session-compte';
import { creerHorlogeSysteme } from '../core/clock';
import { storeJeu } from './store';
import { creerStockageLocal } from './stockage-local';
import { creerSynchro } from './synchro';

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
  // Envoi de la partie au serveur (ticket D) : seulement connecté, le jeu local reste la source du jeu.
  const jeton = session.valide ? session.jeton : null;
  useEffect(() => {
    if (!jeton) return;
    const synchro = creerSynchro({ stockage: creerStockageLocal(), horloge: creerHorlogeSysteme(),
      urlApi: import.meta.env.VITE_API_URL ?? '', jeton: () => jeton });
    synchro.demarrer();
    const desabonner = storeJeu.abonnerSauvegarde(fermeture => { void synchro.envoyerMaintenant({ fermeture }); });
    return () => { desabonner(); synchro.arreter(); };
  }, [jeton]);
  if (token !== null || !session.valide) {
    if (token === null && session.attente) return <p role="status">Vérification du compte…</p>;
    return <EcranCompte token={token} quandConnecte={jeton => { fixerToken(null); session.memoriser(jeton); }} quandReinitialise={() => { fixerToken(null); session.memoriser(null); }} />;
  }
  return <Coquille quandDeconnecter={() => { void session.quitter(); }} />;
}

export default function App() {
  return import.meta.env.VITE_API_URL ? <JeuAvecCompte /> : <Coquille />;
}
