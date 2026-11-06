// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import App from '../App';
import { CLE_SESSION } from './session-compte';
import { creerGestionnaire, creerStockageMemoire } from '../../core/sauvegarde';
import * as sauvegardes from '../../core/sauvegarde';
import { creerHorlogeSimulee } from '../../core/clock';
import * as synchronisation from '../synchro';
import { storeJeu } from '../store';

vi.mock('../Coquille', () => ({ Coquille: ({ quandMenuPrincipal }: { quandMenuPrincipal?: () => Promise<boolean> }) => <div>Jeu ouvert{quandMenuPrincipal && <button onClick={() => { void quandMenuPrincipal(); }}>Mes parties</button>}</div> }));
const reseau = vi.fn<typeof fetch>();
const adresseServeur = window.location.origin;
function reponse(donnees: unknown = {}, statut = 200, jeton?: string) {
  return new Response(JSON.stringify(donnees), { status: statut, headers: jeton ? { 'set-auth-token': jeton } : {} });
}
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  localStorage.clear();
  const stockage = creerStockageMemoire();
  creerGestionnaire({ stockage, horloge: creerHorlogeSimulee(), genererId: () => 'test' }).creerPartie('Test');
  stockage.cles().forEach(cle => localStorage.setItem(cle, stockage.lire(cle)!));
  history.replaceState(null, '', '/');
  // Le jeu n'est pas démarré dans ces tests : « Menu principal » exige une sauvegarde réussie.
  const lireEtat = storeJeu.getState.bind(storeJeu);
  // Une copie par état réel, gardée : les spies posés ensuite sur `getState()` restent visibles de l'application.
  const copies = new WeakMap<object, ReturnType<typeof lireEtat>>();
  vi.spyOn(storeJeu, 'getState').mockImplementation(() => {
    const reel = lireEtat();
    if (!copies.has(reel)) copies.set(reel, { ...reel, sauvegarder: () => true });
    return copies.get(reel)!;
  });
  vi.stubEnv('VITE_API_URL', adresseServeur);
  vi.stubGlobal('fetch', reseau);
  reseau.mockReset();
  reseau.mockImplementation(async url => reponse(String(url).endsWith('/api/sauvegarde/parties')
    ? { parties: [] } : String(url).endsWith('/appareil') ? { actif: true } : { session: { id: 'session' } }));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.useRealTimers(); });
function remplir(motDePasse = 'abcdefghij', email = 'joueur@exemple.fr') {
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: motDePasse } });
}
function cliquer(nom: string) { fireEvent.click(screen.getByRole('button', { name: nom })); }
// La déconnexion se fait dans la zone compte : Menu principal, onglet Compte, Se déconnecter.
async function deconnecter() { cliquer('Mes parties'); await screen.findByRole('heading', { name: 'Mes parties' }); cliquer('Compte'); cliquer('Se déconnecter'); }

function simulerParties() {
  const partie = { id: 'test', nom: 'Test', regionCourante: 'kanto', zoneId: '', tempsJeuMs: null, ecritLe: '2026-11-04T12:00:00Z', surServeur: true, courante: true };
  const synchro = { etat: vi.fn().mockReturnValue('ok'), ouvrir: vi.fn().mockResolvedValue('ok'), choix: vi.fn().mockReturnValue(null), arreter: vi.fn(), demarrer: vi.fn(), envoyerMaintenant: vi.fn(),
    lister: vi.fn().mockResolvedValue({ parties: [partie, { ...partie, id: 'autre', nom: 'Autre', courante: false }], horsConnexion: false }),
    ouvrirPartie: vi.fn().mockResolvedValue('ok'), creerPartie: vi.fn().mockResolvedValue('ok'), supprimerPartie: vi.fn().mockResolvedValue('ok') };
  vi.spyOn(synchronisation, 'creerSynchro').mockReturnValue(synchro as unknown as ReturnType<typeof synchronisation.creerSynchro>);
  const recharger = vi.fn();
  const reel = window;
  vi.stubGlobal('window', new Proxy(reel, { get(cible, cle) {
    if (cle === 'location') return { ...cible.location, reload: recharger };
    const valeur = Reflect.get(cible, cle) as unknown;
    return typeof valeur === 'function' ? valeur.bind(cible) : valeur;
  } }));
  localStorage.setItem(CLE_SESSION, 'session-stockee');
  return { synchro, recharger };
}
it('présente la création sans monter le jeu ni ouvrir la synchro d’appareil', async () => {
  localStorage.clear();
  const { synchro } = simulerParties();
  synchro.lister.mockResolvedValue({ parties: [], horsConnexion: false });
  render(<App />);
  await screen.findByText('Crée ta première partie');
  expect(screen.queryByText('Jeu ouvert')).toBeNull();
  expect(screen.queryByText('Retour au jeu')).toBeNull();
  expect(reseau.mock.calls.some(([url]) => String(url).endsWith('/appareil'))).toBe(false);
});
it.each(['ok', 'echec'])('ouvre une autre partie : %s', async resultat => {
  const { synchro, recharger } = simulerParties();
  synchro.ouvrirPartie.mockResolvedValue(resultat);
  const arreter = vi.spyOn(storeJeu.getState(), 'arreter').mockImplementation(() => {});
  const demarrer = vi.spyOn(storeJeu.getState(), 'demarrer').mockImplementation(() => {});
  render(<App />); await screen.findByText('Jeu ouvert'); cliquer('Mes parties');
  await screen.findByText('Autre'); cliquer('Jouer Autre');
  expect(arreter).toHaveBeenCalled();
  expect(synchro.ouvrirPartie).toHaveBeenCalledWith('autre');
  if (resultat === 'ok') await waitFor(() => expect(recharger).toHaveBeenCalledOnce());
  else {
    expect((await screen.findByRole('alert')).textContent).toBe("Connexion impossible. Rien n'a changé, réessaie.");
    expect(demarrer).toHaveBeenCalled(); expect(recharger).not.toHaveBeenCalled();
  }
});
it('crée une partie puis recharge', async () => {
  const { synchro, recharger } = simulerParties();
  render(<App />); await screen.findByText('Jeu ouvert'); cliquer('Mes parties');
  await screen.findByText('Autre');
  cliquer('Nouvelle partie');
  fireEvent.change(screen.getByLabelText('Nom de la partie'), { target: { value: ' Voyage ' } });
  cliquer('Créer la partie');
  await waitFor(() => expect(recharger).toHaveBeenCalledOnce());
  expect(synchro.creerPartie).toHaveBeenCalledWith('Voyage', expect.objectContaining({ equipe: expect.any(Array), drapeaux: expect.any(Object) }));
});
it.each([true, false])('supprime une partie, courante : %s', async courante => {
  const { synchro, recharger } = simulerParties();
  const arreter = vi.spyOn(storeJeu.getState(), 'arreter').mockImplementation(() => {});
  render(<App />); await screen.findByText('Jeu ouvert'); cliquer('Mes parties');
  await screen.findByText('Autre');
  fireEvent.click(screen.getAllByText('Supprimer')[courante ? 0 : 1]!); cliquer('Oui, supprimer');
  expect(synchro.supprimerPartie).toHaveBeenCalledWith(courante ? 'test' : 'autre');
  if (courante) { expect(arreter).toHaveBeenCalled(); await waitFor(() => expect(recharger).toHaveBeenCalledOnce()); }
  else { await waitFor(() => expect(synchro.lister).toHaveBeenCalledTimes(2)); expect(recharger).not.toHaveBeenCalled(); expect(arreter).not.toHaveBeenCalled(); }
});
it.each([
  ['plein', 'Tu as déjà 20 parties. Supprime-en une pour en créer une autre.'],
  ['nom-invalide', 'Donne un nom à ta partie (100 caractères au plus).'],
  ['echec', "La partie n'a pas pu être créée. Réessaie."],
])('explique un refus de création : %s', async (resultat, message) => {
  const { synchro, recharger } = simulerParties();
  synchro.creerPartie.mockResolvedValue(resultat);
  render(<App />); await screen.findByText('Jeu ouvert'); cliquer('Mes parties');
  await screen.findByText('Autre');
  cliquer('Nouvelle partie');
  fireEvent.change(screen.getByLabelText('Nom de la partie'), { target: { value: 'Voyage' } });
  cliquer('Créer la partie');
  expect((await screen.findByRole('alert')).textContent).toBe(message);
  expect(recharger).not.toHaveBeenCalled();
  expect((screen.getByText('Créer la partie') as HTMLButtonElement).disabled).toBe(false);
});
it('relance le jeu et la synchro après un échec de suppression courante', async () => {
  const { synchro, recharger } = simulerParties();
  synchro.supprimerPartie.mockResolvedValue('echec');
  vi.spyOn(storeJeu.getState(), 'arreter').mockImplementation(() => {});
  const demarrer = vi.spyOn(storeJeu.getState(), 'demarrer').mockImplementation(() => {});
  render(<App />); await screen.findByText('Jeu ouvert'); cliquer('Mes parties');
  await screen.findByText('Autre'); synchro.demarrer.mockClear();
  fireEvent.click(screen.getAllByText('Supprimer')[0]!); cliquer('Oui, supprimer');
  expect((await screen.findByRole('alert')).textContent).toBe("Connexion impossible. La partie n'est pas supprimée, réessaie.");
  expect(demarrer).toHaveBeenCalledOnce(); expect(synchro.demarrer).toHaveBeenCalledOnce();
  expect(recharger).not.toHaveBeenCalled();
});

it('attend la reprise de cet appareil avant de monter le jeu', async () => {
  const stockage = creerStockageMemoire();
  creerGestionnaire({ stockage, horloge: creerHorlogeSimulee(), genererId: () => 'test' }).creerPartie('Test');
  stockage.cles().forEach(cle => localStorage.setItem(cle, stockage.lire(cle)!));
  localStorage.setItem(CLE_SESSION, 'session-stockee');
  reseau.mockImplementation(async (url, options) => {
    if (String(url).endsWith('/appareil')) return reponse({ actif: JSON.parse(options!.body as string).reprendre === true });
    if (String(url).endsWith('/api/sauvegarde/parties')) return reponse({ parties: [] });
    if (String(url).includes('/api/sauvegarde')) return reponse({}, 404);
    return reponse({ session: { id: 'session' } });
  });
  render(<App />);
  await screen.findByText(/Cette partie est ouverte sur un autre appareil/);
  expect(screen.queryByText('Jeu ouvert')).toBeNull();
  cliquer('Reprendre ici');
  await screen.findByText('Jeu ouvert');
  const appels = reseau.mock.calls.filter(([url]) => String(url).endsWith('/appareil'));
  expect(appels).toHaveLength(2);
  expect(appels[1]![1]?.method).toBe('POST');
  expect(JSON.parse(appels[1]![1]!.body as string)).toEqual({ appareilId: localStorage.getItem('pokiclicker:appareil'), reprendre: true });
});

it('présente le choix avant de monter le jeu à l’ouverture', async () => {
  const stockage = creerStockageMemoire();
  const g = creerGestionnaire({ stockage, horloge: creerHorlogeSimulee(), genererId: () => 'test' });
  const partie = g.creerPartie('Test');
  const regions = [g.chargerRegion(partie.id, 'kanto')!];
  stockage.cles().forEach(cle => localStorage.setItem(cle, stockage.lire(cle)!));
  localStorage.setItem(CLE_SESSION, 'session-stockee');
  reseau.mockImplementation(async (url, options) => {
    if (String(url).endsWith('/parties')) return reponse({ parties: [{ id: partie.id, nom: 'Test', revision: 1, ecritLe: partie.ecritLe }] });
    if (String(url).endsWith('/parties/test')) return reponse({ partie, regions });
    if (String(url).endsWith('/compte')) return reponse({}, 404);
    if (options?.method === 'PUT') return reponse({ partie: { id: partie.id, revision: 2 }, regions: [{ id: 'kanto', revision: 2 }] });
    return reponse({ session: { id: 'session' } });
  });
  render(<App />);
  await screen.findByRole('heading', { name: 'Deux versions de ta partie' });
  expect(screen.queryByText('Jeu ouvert')).toBeNull();
  cliquer('Garder cet appareil');
  await screen.findByText('Jeu ouvert');
});

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

it('ouvre la dernière partie locale à froid sans aucun réseau, sans message bloquant', async () => {
  localStorage.setItem(CLE_SESSION, 'session-stockee'); reseau.mockRejectedValue(new TypeError());
  const avant = localStorage.getItem('pokiclicker:partie:test');
  expect(avant).not.toBeNull();
  render(<App />);
  await screen.findByText('Jeu ouvert');
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.queryByRole('heading')).toBeNull();
  expect(localStorage.getItem(CLE_SESSION)).toBe('session-stockee');
  expect(localStorage.getItem('pokiclicker:partie:test')).toBe(avant);
});

it('demande de se connecter une première fois quand l’appareil n’a jamais été connecté et n’a pas de réseau', async () => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  render(<App />);
  expect((await screen.findByRole('status')).textContent).toContain('Connecte-toi une première fois');
  expect(screen.queryByText('Jeu ouvert')).toBeNull();
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  fireEvent(window, new Event('online'));
  await waitFor(() => expect(screen.queryByRole('status')).toBeNull());
});

it('explique une session expirée au retour du réseau sans toucher à la partie locale', async () => {
  localStorage.setItem(CLE_SESSION, 'session-stockee'); reseau.mockRejectedValueOnce(new TypeError());
  render(<App />); await screen.findByText('Jeu ouvert');
  const avant = localStorage.getItem('pokiclicker:partie:test');
  expect(avant).not.toBeNull();
  reseau.mockResolvedValueOnce(reponse(null, 401));
  fireEvent(window, new Event('online'));
  await screen.findByRole('heading', { name: 'Connexion' });
  expect(screen.getByRole('status').textContent).toContain('Ta session a expiré');
  expect(localStorage.getItem('pokiclicker:partie:test')).toBe(avant);
});

it('au retour du réseau, une partie reprise ailleurs pendant la coupure passe par l’écran de reprise', async () => {
  localStorage.setItem(CLE_SESSION, 'session-stockee'); reseau.mockRejectedValue(new TypeError());
  render(<App />); await screen.findByText('Jeu ouvert');
  const avant = localStorage.getItem('pokiclicker:partie:test');
  expect(avant).not.toBeNull();
  reseau.mockReset();
  reseau.mockImplementation(async url => reponse(String(url).endsWith('/appareil') ? { actif: false }
    : String(url).endsWith('/api/sauvegarde/parties') ? { parties: [] } : { session: { id: 'session' } }));
  fireEvent(window, new Event('online'));
  await screen.findByText(/Cette partie est ouverte sur un autre appareil/);
  expect(localStorage.getItem('pokiclicker:partie:test')).toBe(avant);
});

it('retente aussi périodiquement', async () => {
  vi.useFakeTimers(); localStorage.setItem(CLE_SESSION, 'session-stockee'); reseau.mockRejectedValueOnce(new TypeError());
  render(<App />);
  await act(async () => { await vi.advanceTimersByTimeAsync(0); });
  expect(screen.getByText('Jeu ouvert')).toBeTruthy();
  await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
  expect(reseau.mock.calls.filter(([url]) => String(url).includes('/api/auth/'))).toHaveLength(2);
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
  reseau.mockRejectedValueOnce(new TypeError()); await deconnecter();
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
  // Une partie en mémoire permet de tester la déconnexion depuis le jeu même sans stockage.
  const gestionnaire = creerGestionnaire({ stockage: creerStockageMemoire(), horloge: creerHorlogeSimulee(), genererId: () => 'memoire' });
  gestionnaire.creerPartie('En mémoire');
  vi.spyOn(sauvegardes, 'creerGestionnaire').mockReturnValue(gestionnaire);
  for (const methode of ['getItem', 'setItem', 'removeItem'] as const) vi.spyOn(Storage.prototype, methode).mockImplementation(() => { throw new Error('Stockage indisponible'); });
  reseau.mockResolvedValueOnce(reponse({}, 200, 'session-memoire'));
  render(<App />); remplir(); cliquer('Se connecter'); await screen.findByText('Jeu ouvert');
  await waitFor(() => expect(reseau.mock.calls.filter(([url]) => String(url).includes('/api/auth/'))).toHaveLength(2));
  fireEvent(window, new StorageEvent('storage', { key: CLE_SESSION }));
  expect(screen.getByText('Jeu ouvert')).toBeTruthy();
  await deconnecter(); await screen.findByRole('heading', { name: 'Connexion' });
  expect(() => fireEvent(window, new StorageEvent('storage', { key: CLE_SESSION }))).not.toThrow();
});
