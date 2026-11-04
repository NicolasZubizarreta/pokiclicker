import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { connecter, demanderReinitialisation, ErreurCompte, inscrire, reinitialiser } from './api-compte';

type Etat = 'connexion' | 'inscription' | 'oubli' | 'nouveau';
const titres = { connexion: 'Connexion', inscription: 'Inscription', oubli: 'Mot de passe oublié', nouveau: 'Nouveau mot de passe' };
const boutons = { connexion: 'Se connecter', inscription: 'Créer mon compte', oubli: 'Envoyer le lien', nouveau: 'Enregistrer le mot de passe' };
const secondaire = 'min-h-11 p-2 text-lien underline';

function useHorsReseau() {
  const [hors, fixerHors] = useState(() => navigator.onLine === false);
  useEffect(() => {
    const maj = () => fixerHors(navigator.onLine === false);
    window.addEventListener('online', maj);
    window.addEventListener('offline', maj);
    return () => { window.removeEventListener('online', maj); window.removeEventListener('offline', maj); };
  }, []);
  return hors;
}

export function EcranCompte({ token, sessionExpiree = false, quandConnecte, quandReinitialise }: {
  token: string | null; sessionExpiree?: boolean; quandConnecte: (jeton: string) => void; quandReinitialise: () => void;
}) {
  const horsReseau = useHorsReseau();
  const [etat, fixerEtat] = useState<Etat>(token !== null ? 'nouveau' : 'connexion');
  const [email, fixerEmail] = useState('');
  const [motDePasse, fixerMotDePasse] = useState('');
  const [erreur, fixerErreur] = useState(token === '' ? 'Ce lien est invalide ou expiré. Demande un nouveau lien.' : '');
  const [message, fixerMessage] = useState('');
  const [envoi, fixerEnvoi] = useState(false);
  const titre = useRef<HTMLHeadingElement>(null);
  useEffect(() => { titre.current?.focus(); }, [etat]);

  function changer(nouveau: Etat) {
    fixerEtat(nouveau);
    fixerErreur('');
    fixerMessage('');
    fixerMotDePasse('');
  }

  async function envoyer(evenement: FormEvent) {
    evenement.preventDefault();
    if (envoi) return;
    fixerErreur('');
    fixerMessage('');
    if ((etat === 'inscription' || etat === 'nouveau') && motDePasse.length < 10) {
      fixerErreur('Choisis un mot de passe d’au moins 10 caractères.');
      return;
    }
    fixerEnvoi(true);
    try {
      if (etat === 'oubli') {
        await demanderReinitialisation(email.trim());
        fixerMessage('Si ce compte existe, un lien a été envoyé.');
      } else if (etat === 'nouveau') {
        await reinitialiser(motDePasse, token ?? '');
        quandReinitialise();
        changer('connexion');
        fixerMessage('Mot de passe modifié. Connecte-toi.');
      } else {
        const jeton = await (etat === 'inscription' ? inscrire : connecter)(email.trim(), motDePasse);
        fixerMotDePasse('');
        quandConnecte(jeton);
      }
    } catch (cause) {
      fixerErreur(cause instanceof ErreurCompte ? cause.message : 'La demande a échoué. Réessaie plus tard.');
    } finally { fixerEnvoi(false); }
  }

  return <main data-theme="dark" className="min-h-dvh bg-fond text-texte font-texte p-4 lg:p-8 grid content-center">
    <section className="cadre bg-surface p-4 lg:p-8 w-full max-w-(--breakpoint-md) mx-auto" aria-labelledby="titre-compte">
      <h1 id="titre-compte" ref={titre} tabIndex={-1} className="font-titre text-2xl mb-4">{titres[etat]}</h1>
      {horsReseau && <p role="status" className="mb-4">{etat === 'connexion' || etat === 'inscription'
        ? "Pas de réseau. Connecte-toi une première fois avec une connexion internet : ensuite, ta partie s'ouvre aussi sans réseau."
        : 'Pas de réseau. Cette étape demande une connexion internet.'}</p>}
      {sessionExpiree && etat === 'connexion' && <p role="status" className="mb-4">Ta session a expiré. Reconnecte-toi : ta partie sur cet appareil est conservée.</p>}
      <form onSubmit={envoyer} className="grid gap-4">
        {etat !== 'nouveau' && <label className="grid gap-2">E-mail
          <input type="email" required autoComplete={etat === 'connexion' ? 'username' : 'email'} value={email}
            onChange={e => fixerEmail(e.target.value)} className="bg-surface-2 text-base min-h-11 p-2 w-full" />
        </label>}
        {etat !== 'oubli' && <label className="grid gap-2">{etat === 'nouveau' ? 'Nouveau mot de passe' : 'Mot de passe'}
          <input type="password" required autoComplete={etat === 'connexion' ? 'current-password' : 'new-password'} value={motDePasse}
            onChange={e => fixerMotDePasse(e.target.value)} className="bg-surface-2 text-base min-h-11 p-2 w-full" />
        </label>}
        {(etat === 'nouveau' || etat === 'inscription') && <p>Choisis au moins 10 caractères.</p>}
        {erreur && <p role="alert">{erreur}</p>}
        {message && <p role="status">{message}</p>}
        <button disabled={envoi} className="min-h-11 p-2 bg-action text-action-texte hover:bg-action-survol disabled:bg-surface-2 disabled:text-texte-doux">{envoi ? 'Envoi en cours…' : boutons[etat]}</button>
      </form>
      <nav aria-label="Accès au compte" className="flex flex-wrap gap-2 mt-4">
        {etat !== 'connexion' && <button disabled={envoi} className={secondaire} onClick={() => changer('connexion')}>Retour à la connexion</button>}
        {etat === 'connexion' && <button disabled={envoi} className={secondaire} onClick={() => changer('inscription')}>Créer un compte</button>}
        {(etat === 'connexion' || etat === 'nouveau') && <button disabled={envoi} className={secondaire} onClick={() => changer('oubli')}>{etat === 'nouveau' ? 'Demander un nouveau lien' : 'Mot de passe oublié'}</button>}
      </nav>
    </section>
  </main>;
}
