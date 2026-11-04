// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import App from '../App';
import { CLE_SESSION } from './session-compte';

vi.mock('../Coquille', () => ({ Coquille: ({ quandDeconnecter }: { quandDeconnecter?: () => void }) => <div>Jeu ouvert{quandDeconnecter && <button onClick={quandDeconnecter}>Se déconnecter</button>}</div> }));
const reseau = vi.fn<typeof fetch>();
const adresseServeur = window.location.origin;
function reponse(donnees: unknown = {}, statut = 200, jeton?: string) {
  return new Response(JSON.stringify(donnees), { status: statut, headers: jeton ? { 'set-auth-token': jeton } : {} });
}
beforeEach(() => {
  localStorage.clear();
  history.replaceState(null, '', '/');
  vi.stubEnv('VITE_API_URL', adresseServeur);
  vi.stubGlobal('fetch', reseau);
  reseau.mockReset();
  reseau.mockResolvedValue(reponse({ session: { id: 'session' } }));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.useRealTimers(); });
function remplir(motDePasse = 'abcdefghij', email = 'joueur@exemple.fr') {
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: motDePasse } });
}
function cliquer(nom: string) { fireEvent.click(screen.getByRole('button', { name: nom })); }

it('inscrit, mémorise le jeton de l’en-tête et ouvre le jeu', async () => {
  reseau.mockResolvedValueOnce(reponse({}, 200, 'session-inscription'));
  render(<App />);
  cliquer('Créer un compte');
  expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Inscription' }));
  remplir();
  cliquer('Créer mon compte');
  await screen.findByText('Jeu ouvert');
  expect(localStorage.getItem(CLE_SESSION)).toBe('session-inscription');
  expect(reseau.mock.calls[0]).toEqual([`${adresseServeur}/api/auth/sign-up/email`, expect.objectContaining({ method: 'POST', body: JSON.stringify({ email: 'joueur@exemple.fr', password: 'abcdefghij', name: 'joueur' }) })]);
});

it('refuse neuf caractères sans appel réseau', () => {
  render(<App />); cliquer('Créer un compte'); remplir('abcdefghi'); cliquer('Créer mon compte');
  expect(screen.getByRole('alert').textContent).toContain('au moins 10 caractères');
  expect(reseau).not.toHaveBeenCalled();
});

it.each(['connu@exemple.fr', 'inconnu@exemple.fr'])('masque les messages du serveur pour %s', async email => {
  reseau.mockResolvedValueOnce(reponse({ code: 'INVALID_EMAIL_OR_PASSWORD', message: 'Texte serveur interdit' }, 401));
  render(<App />); remplir('abcdefghij', email); cliquer('Se connecter');
  expect((await screen.findByRole('alert')).textContent).toBe('E-mail ou mot de passe incorrect.');
});

it('explique la limitation des tentatives', async () => {
  reseau.mockResolvedValueOnce(reponse({}, 429));
  render(<App />); remplir(); cliquer('Se connecter');
  expect((await screen.findByRole('alert')).textContent).toMatch(/trop de tentatives/i);
});

it('explique une coupure réseau sans session', async () => {
  reseau.mockRejectedValueOnce(new TypeError());
  render(<App />); remplir(); cliquer('Se connecter');
  expect((await screen.findByRole('alert')).textContent).toContain('Serveur injoignable');
});

it('valide la session au rechargement avec son en-tête Bearer', async () => {
  localStorage.setItem(CLE_SESSION, 'session-stockee'); render(<App />);
  await screen.findByText('Jeu ouvert');
  expect(reseau).toHaveBeenCalledWith(`${adresseServeur}/api/auth/get-session`, expect.objectContaining({ method: 'GET', headers: { Authorization: 'Bearer session-stockee' } }));
});

it.each([401, 200])('efface une session refusée ou nulle (%s)', async statut => {
  localStorage.setItem(CLE_SESSION, 'session-stockee'); reseau.mockResolvedValueOnce(reponse(null, statut));
  render(<App />); await screen.findByRole('heading', { name: 'Connexion' });
  expect(localStorage.getItem(CLE_SESSION)).toBeNull();
});

it('ouvre hors réseau et retente au retour du réseau', async () => {
  localStorage.setItem(CLE_SESSION, 'session-stockee'); reseau.mockRejectedValueOnce(new TypeError());
  render(<App />); await screen.findByText('Jeu ouvert');
  reseau.mockResolvedValueOnce(reponse(null, 401));
  fireEvent(window, new Event('online'));
  await screen.findByRole('heading', { name: 'Connexion' });
  expect(localStorage.getItem(CLE_SESSION)).toBeNull();
});

it('retente aussi périodiquement', async () => {
  vi.useFakeTimers(); localStorage.setItem(CLE_SESSION, 'session-stockee'); reseau.mockRejectedValueOnce(new TypeError());
  render(<App />);
  await act(async () => { await vi.advanceTimersByTimeAsync(0); });
  expect(screen.getByText('Jeu ouvert')).toBeTruthy();
  await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
  expect(reseau).toHaveBeenCalledTimes(2);
});

it('confirme de manière identique deux demandes et fournit redirectTo', async () => {
  render(<App />); cliquer('Mot de passe oublié');
  for (const email of ['connu@exemple.fr', 'inconnu@exemple.fr']) {
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: email } });
    cliquer('Envoyer le lien');
    expect((await screen.findByRole('status')).textContent).toBe('Si ce compte existe, un lien a été envoyé.');
    expect(reseau).toHaveBeenLastCalledWith(`${adresseServeur}/api/auth/request-password-reset`, expect.objectContaining({ body: JSON.stringify({ email, redirectTo: window.location.origin }) }));
  }
});

it('retire immédiatement le jeton de l’adresse puis réinitialise', async () => {
  history.replaceState(null, '', '/?token=lien-secret&onglet=carte#jeu');
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Nouveau mot de passe' })).toBeTruthy();
  expect(location.search).toBe('?onglet=carte'); expect(location.hash).toBe('#jeu');
  fireEvent.change(screen.getByLabelText('Nouveau mot de passe', { selector: 'input' }), { target: { value: 'abcdefghij' } });
  cliquer('Enregistrer le mot de passe');
  await screen.findByRole('heading', { name: 'Connexion' });
  expect(screen.getByRole('status').textContent).toBe('Mot de passe modifié. Connecte-toi.');
  expect(reseau).toHaveBeenCalledWith(`${adresseServeur}/api/auth/reset-password`, expect.objectContaining({ body: JSON.stringify({ newPassword: 'abcdefghij', token: 'lien-secret' }) }));
});

it('explique un lien invalide et permet d’en redemander un', async () => {
  history.replaceState(null, '', '/?token=invalide'); reseau.mockResolvedValueOnce(reponse({ code: 'INVALID_TOKEN' }, 400));
  render(<App />);
  fireEvent.change(screen.getByLabelText('Nouveau mot de passe', { selector: 'input' }), { target: { value: 'abcdefghij' } });
  cliquer('Enregistrer le mot de passe');
  expect((await screen.findByRole('alert')).textContent).toContain('invalide ou expiré');
  cliquer('Demander un nouveau lien');
  expect(screen.getByRole('heading', { name: 'Mot de passe oublié' })).toBeTruthy();
});

it('reconnaît aussi le retour d’un lien déjà expiré côté serveur', () => {
  history.replaceState(null, '', '/?error=INVALID_TOKEN'); render(<App />);
  expect(screen.getByRole('alert').textContent).toContain('invalide ou expiré');
  cliquer('Demander un nouveau lien');
  expect(screen.getByRole('heading', { name: 'Mot de passe oublié' })).toBeTruthy();
});

it('déconnecte sans toucher à la sauvegarde locale, même sans réseau', async () => {
  localStorage.setItem(CLE_SESSION, 'session-stockee'); localStorage.setItem('pokiclicker.sauvegarde', 'partie intacte');
  render(<App />); await screen.findByText('Jeu ouvert');
  reseau.mockRejectedValueOnce(new TypeError()); cliquer('Se déconnecter');
  await screen.findByRole('heading', { name: 'Connexion' });
  expect(reseau).toHaveBeenLastCalledWith(`${adresseServeur}/api/auth/sign-out`, expect.objectContaining({ method: 'POST', headers: expect.objectContaining({ Authorization: 'Bearer session-stockee' }) }));
  expect(localStorage.getItem(CLE_SESSION)).toBeNull();
  expect(localStorage.getItem('pokiclicker.sauvegarde')).toBe('partie intacte');
});

it('ouvre directement sans serveur et ne lit pas la session', () => {
  vi.stubEnv('VITE_API_URL', ''); render(<App />);
  expect(screen.getByText('Jeu ouvert')).toBeTruthy(); expect(reseau).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: 'Se déconnecter' })).toBeNull();
});

it('réagit à la déconnexion dans un autre onglet', async () => {
  localStorage.setItem(CLE_SESSION, 'session-stockee'); render(<App />); await screen.findByText('Jeu ouvert');
  localStorage.removeItem(CLE_SESSION);
  fireEvent(window, new StorageEvent('storage', { key: CLE_SESSION }));
  await screen.findByRole('heading', { name: 'Connexion' });
});

it('garde la session en mémoire si le stockage est indisponible', async () => {
  for (const methode of ['getItem', 'setItem', 'removeItem'] as const) vi.spyOn(Storage.prototype, methode).mockImplementation(() => { throw new Error('Stockage indisponible'); });
  reseau.mockResolvedValueOnce(reponse({}, 200, 'session-memoire'));
  render(<App />); remplir(); cliquer('Se connecter'); await screen.findByText('Jeu ouvert');
  await waitFor(() => expect(reseau).toHaveBeenCalledTimes(2));
  fireEvent(window, new StorageEvent('storage', { key: CLE_SESSION }));
  expect(screen.getByText('Jeu ouvert')).toBeTruthy();
  cliquer('Se déconnecter'); await screen.findByRole('heading', { name: 'Connexion' });
  expect(() => fireEvent(window, new StorageEvent('storage', { key: CLE_SESSION }))).not.toThrow();
});
