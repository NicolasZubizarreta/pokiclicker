export class ErreurCompte extends Error {
  constructor(public statut: number, public code?: string) {
    super(statut === 429 ? 'Trop de tentatives. Réessaie plus tard.'
      : code === 'INVALID_EMAIL_OR_PASSWORD' ? 'E-mail ou mot de passe incorrect.'
      : code === 'USER_ALREADY_EXISTS' || code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL' ? 'Ce compte existe déjà. Connecte-toi.'
      : code === 'PASSWORD_TOO_SHORT' ? 'Choisis un mot de passe d’au moins 10 caractères.'
      : code === 'INVALID_TOKEN' || code === 'TOKEN_EXPIRED' ? 'Ce lien est invalide ou expiré. Demande un nouveau lien.'
      : code === 'INVALID_EMAIL' ? 'Vérifie ton adresse e-mail.'
      : statut === 0 ? 'Serveur injoignable. Vérifie ta connexion et réessaie.'
      : 'La demande a échoué. Réessaie plus tard.');
  }
}

async function requete(route: string, corps?: object, jeton?: string) {
  try {
    const reponse = await fetch(`${import.meta.env.VITE_API_URL?.replace(/\/$/, '')}/api/auth/${route}`, {
      method: corps ? 'POST' : 'GET',
      headers: { ...(corps ? { 'Content-Type': 'application/json' } : {}),
        ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}) },
      body: corps ? JSON.stringify(corps) : undefined,
      credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(8000),
    });
    const donnees: unknown = await reponse.json().catch(() => null);
    if (!reponse.ok) {
      const code = donnees && typeof donnees === 'object' && 'code' in donnees && typeof donnees.code === 'string' ? donnees.code : undefined;
      throw new ErreurCompte(reponse.status, code);
    }
    return { donnees, jeton: reponse.headers.get('set-auth-token') };
  } catch (erreur) {
    throw erreur instanceof ErreurCompte ? erreur : new ErreurCompte(0);
  }
}

async function authentifier(route: string, corps: object) {
  const resultat = await requete(route, corps);
  if (!resultat.jeton) throw new ErreurCompte(502);
  return resultat.jeton;
}

export const inscrire = (email: string, password: string) => authentifier('sign-up/email', { email, password, name: email.split('@')[0] });
export const connecter = (email: string, password: string) => authentifier('sign-in/email', { email, password });
export const deconnecter = (jeton: string) => requete('sign-out', {}, jeton);
export async function lireSession(jeton: string) {
  const { donnees } = await requete('get-session', undefined, jeton);
  return !!(donnees && typeof donnees === 'object' && 'session' in donnees && donnees.session);
}
export const demanderReinitialisation = (email: string) => requete('request-password-reset', { email, redirectTo: window.location.origin });
export const reinitialiser = (newPassword: string, token: string) => requete('reset-password', { newPassword, token });
