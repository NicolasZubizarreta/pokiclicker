import { useEffect, useRef, useState } from 'react';
import type { FormEvent, InputHTMLAttributes, ReactNode } from 'react';
import { connecter, demanderReinitialisation, ErreurCompte, inscrire, reinitialiser } from './api-compte';
import { IconeAlerte, IconeOeil, IconeValide } from './icones-compte';
import '../Plaques.css';
import './Compte.css';
import './ComptePC.css';
import { useTelephone } from '../useTelephone';

type Etat = 'connexion' | 'inscription' | 'oubli' | 'nouveau';
const titres = { connexion: 'Connexion', inscription: 'Inscription', oubli: 'Mot de passe oublié', nouveau: 'Nouveau mot de passe' };
const boutons = { connexion: 'Se connecter', inscription: 'Créer mon compte', oubli: 'Envoyer le lien', nouveau: 'Enregistrer le mot de passe' };
const secondaire = 'compte-lien min-h-12';
type Erreur = { texte: string; champ: 'email' | 'motDePasse' | 'formulaire' };

function Champ({ id, libelle, aide, erreur, children, ...saisie }: InputHTMLAttributes<HTMLInputElement> & {
  id: string; libelle: string; aide?: string; erreur?: string; children?: ReactNode;
}) {
  const description = [aide && `${id}-aide`, erreur && `${id}-erreur`].filter(Boolean).join(' ');
  return <div className={`compte-champ${erreur ? ' en-erreur' : ''}`}>
    <label htmlFor={id}>{libelle}</label>
    <div className="zone-saisie">
      <input {...saisie} id={id} required aria-invalid={erreur ? 'true' : undefined} aria-describedby={description || undefined} />
      {children}
    </div>
    {aide && <p id={`${id}-aide`} className="aide">{aide}</p>}
    {erreur && <p id={`${id}-erreur`} role="alert" className="compte-message erreur"><IconeAlerte /><span>{erreur}</span></p>}
  </div>;
}

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
  const [erreur, fixerErreur] = useState<Erreur | null>(token === '' ? { texte: 'Ce lien est invalide ou expiré. Demande un nouveau lien.', champ: 'formulaire' } : null);
  const [visible, fixerVisible] = useState(false);
  const [message, fixerMessage] = useState('');
  const [envoi, fixerEnvoi] = useState(false);
  const titre = useRef<HTMLHeadingElement>(null);
  useEffect(() => { titre.current?.focus(); }, [etat]);

  function changer(nouveau: Etat) {
    fixerEtat(nouveau);
    fixerErreur(null);
    fixerVisible(false);
    fixerMessage('');
    fixerMotDePasse('');
  }

  async function envoyer(evenement: FormEvent) {
    evenement.preventDefault();
    if (envoi) return;
    fixerErreur(null);
    fixerMessage('');
    // Pas de bulle native (formulaire noValidate) : le message s'affiche près du champ et se lit au lecteur d'écran.
    if (etat !== 'nouveau' && !email.trim()) { fixerErreur({ texte: 'Entre ton adresse e-mail.', champ: 'email' }); return; }
    if (etat !== 'oubli' && etat !== 'nouveau' && !motDePasse) { fixerErreur({ texte: 'Entre ton mot de passe.', champ: 'motDePasse' }); return; }
    if ((etat === 'inscription' || etat === 'nouveau') && motDePasse.length < 10) {
      fixerErreur({ texte: 'Choisis un mot de passe d’au moins 10 caractères.', champ: 'motDePasse' });
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
      let champ: Erreur['champ'] = 'formulaire';
      if (cause instanceof ErreurCompte && cause.statut !== 429) {
        if (etat !== 'nouveau' && ['INVALID_EMAIL', 'USER_ALREADY_EXISTS', 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL'].includes(cause.code ?? '')) champ = 'email';
        if (etat !== 'oubli' && ['INVALID_EMAIL_OR_PASSWORD', 'PASSWORD_TOO_SHORT'].includes(cause.code ?? '')) champ = 'motDePasse';
      }
      fixerErreur({ texte: cause instanceof ErreurCompte ? cause.message : 'La demande a échoué. Réessaie plus tard.', champ });
    } finally { fixerEnvoi(false); }
  }

return <main data-theme="dark" className={`${useTelephone() ? '' : 'compte-pc auth-pc '}compte-page bg-fond text-texte font-texte p-4 lg:p-8 grid content-start lg:min-h-dvh lg:content-center`}>
    <section className="w-full max-w-(--breakpoint-md) mx-auto" aria-labelledby="titre-compte">
      <div className="compte-marque"><b className="font-titre text-region-accent">PokiClicker</b><span className="text-texte-doux">Ton aventure Pokémon, sur tous tes appareils</span></div>
      <form noValidate onSubmit={envoyer} className="compte-formulaire cadre bg-surface">
      <h1 id="titre-compte" ref={titre} tabIndex={-1} className="font-titre text-xl font-bold">{titres[etat]}</h1>
      {horsReseau && <p role="status" className="compte-message alerte"><IconeAlerte /><span>{etat === 'connexion' || etat === 'inscription'
        ? "Pas de réseau. Connecte-toi une première fois avec une connexion internet : ensuite, ta partie s'ouvre aussi sans réseau."
        : 'Pas de réseau. Cette étape demande une connexion internet.'}</span></p>}
      {sessionExpiree && etat === 'connexion' && <p role="status" className="compte-message alerte"><IconeAlerte /><span>Ta session a expiré. Reconnecte-toi : ta partie sur cet appareil est conservée.</span></p>}
        {etat !== 'nouveau' && <Champ id="email" libelle="E-mail" type="email"
          autoComplete={etat === 'connexion' ? 'username' : 'email'} value={email}
          onChange={e => fixerEmail(e.target.value)} erreur={erreur?.champ === 'email' ? erreur.texte : undefined} />}
        {etat !== 'oubli' && <Champ id="motDePasse" libelle={etat === 'nouveau' ? 'Nouveau mot de passe' : 'Mot de passe'}
          type={visible ? 'text' : 'password'} autoComplete={etat === 'connexion' ? 'current-password' : 'new-password'} value={motDePasse}
          onChange={e => fixerMotDePasse(e.target.value)} erreur={erreur?.champ === 'motDePasse' ? erreur.texte : undefined}
          aide={etat === 'nouveau' || etat === 'inscription' ? 'Au moins 10 caractères.' : undefined}>
          <button type="button" className="plaque min-h-12" aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} aria-pressed={visible} onClick={() => fixerVisible(!visible)}><IconeOeil /></button>
        </Champ>}
        {erreur?.champ === 'formulaire' && <p role="alert" className="compte-message erreur"><IconeAlerte /><span>{erreur.texte}</span></p>}
        {message && <p role="status" className="compte-message succes"><IconeValide /><span>{message}</span></p>}
        <button disabled={envoi} className="plaque plaque-action min-h-14 w-full">{envoi ? 'Envoi en cours…' : boutons[etat]}</button>
      </form>
      <nav aria-label="Accès au compte" className="compte-liens mt-4">
        {etat !== 'connexion' && <button disabled={envoi} className={secondaire} onClick={() => changer('connexion')}>Retour à la connexion</button>}
        {etat === 'connexion' && <button disabled={envoi} className={secondaire} onClick={() => changer('inscription')}>Créer un compte</button>}
        {(etat === 'connexion' || etat === 'nouveau') && <button disabled={envoi} className={secondaire} onClick={() => changer('oubli')}>{etat === 'nouveau' ? 'Demander un nouveau lien' : 'Mot de passe oublié'}</button>}
      </nav>
    </section>
  </main>;
}
