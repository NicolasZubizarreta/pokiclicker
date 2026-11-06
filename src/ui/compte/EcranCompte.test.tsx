// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { EcranCompte } from './EcranCompte';

const reseau = vi.fn();
beforeEach(() => {
  vi.stubGlobal('fetch', reseau);
  vi.stubEnv('VITE_API_URL', window.location.origin);
  reseau.mockReset();
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

function ouvrir(token: string | null = null) {
  render(<EcranCompte token={token} quandConnecte={vi.fn()} quandReinitialise={vi.fn()} />);
}
function remplir(mot = 'abcdefghij') {
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'test@example.fr' } });
  fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: mot } });
}
function echouer(code: string, statut = 401) {
  reseau.mockImplementation(async () => new Response(JSON.stringify({ code }), { status: statut }));
}
async function verifierChamp(libelle: string) {
  const alerte = await screen.findByRole('alert');
  const champ = screen.getByLabelText(libelle);
  expect(champ.getAttribute('aria-invalid')).toBe('true');
  expect(champ.getAttribute('aria-describedby')?.split(' ')).toContain(alerte.id);
  expect(champ.closest('.compte-champ')?.contains(alerte)).toBe(true);
  expect(screen.getAllByRole('alert')).toHaveLength(1);
  expect(alerte.querySelector('svg')?.textContent).toBe('');
}

it('place le mauvais mot de passe près du champ et ne garde qu’une alerte', async () => {
  echouer('INVALID_EMAIL_OR_PASSWORD');
  ouvrir(); remplir();
  fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));
  await verifierChamp('Mot de passe');
  fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));
  await verifierChamp('Mot de passe');
});
it('signale un champ vide près du champ, sans appel réseau ni bulle native', async () => {
  ouvrir();
  expect(document.querySelector('form')?.noValidate).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));
  await verifierChamp('E-mail');
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'test@example.fr' } });
  fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));
  await verifierChamp('Mot de passe');
  expect(reseau).not.toHaveBeenCalled();
});
it('refuse neuf caractères sans réseau et conserve l’aide associée', async () => {
  ouvrir();
  fireEvent.click(screen.getByRole('button', { name: 'Créer un compte' }));
  remplir('123456789');
  fireEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }));
  await verifierChamp('Mot de passe');
  const aide = screen.getByText('Au moins 10 caractères.');
  expect(screen.getByLabelText('Mot de passe').getAttribute('aria-describedby')?.split(' ')).toContain(aide.id);
  expect(reseau).not.toHaveBeenCalled();
});
it('associe un compte existant à l’e-mail', async () => {
  echouer('USER_ALREADY_EXISTS', 422);
  ouvrir();
  fireEvent.click(screen.getByRole('button', { name: 'Créer un compte' }));
  remplir();
  fireEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }));
  await verifierChamp('E-mail');
});
it('présente 429 au niveau du formulaire', async () => {
  echouer('TOO_MANY_REQUESTS', 429);
  ouvrir(); remplir();
  fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));
  const alerte = await screen.findByRole('alert');
  expect(alerte.closest('.compte-champ')).toBeNull();
  expect(document.querySelector('[aria-invalid="true"]')).toBeNull();
  expect(screen.getAllByRole('alert')).toHaveLength(1);
});
it('bascule l’œil et réinitialise sa visibilité au changement d’écran', () => {
  ouvrir();
  const champ = screen.getByLabelText('Mot de passe');
  expect(champ.getAttribute('type')).toBe('password');
  fireEvent.click(screen.getByRole('button', { name: 'Afficher le mot de passe' }));
  expect(champ.getAttribute('type')).toBe('text');
  const oeil = screen.getByRole('button', { name: 'Masquer le mot de passe' });
  expect(oeil.getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(oeil);
  expect(champ.getAttribute('type')).toBe('password');
  expect(screen.getByRole('button', { name: 'Afficher le mot de passe' }).getAttribute('aria-pressed')).toBe('false');
  fireEvent.click(screen.getByRole('button', { name: 'Afficher le mot de passe' }));
  fireEvent.click(screen.getByRole('button', { name: 'Créer un compte' }));
  expect(screen.getByLabelText('Mot de passe').getAttribute('type')).toBe('password');
});
it('offre de grandes cibles et focalise le titre à chaque transition', () => {
  ouvrir('jeton');
  expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Nouveau mot de passe' }));
  expect(screen.getByRole('button', { name: 'Enregistrer le mot de passe' }).className).toContain('min-h-14');
  for (const [lien, titre] of [
    ['Demander un nouveau lien', 'Mot de passe oublié'],
    ['Retour à la connexion', 'Connexion'],
    ['Créer un compte', 'Inscription'],
    ['Retour à la connexion', 'Connexion'],
    ['Mot de passe oublié', 'Mot de passe oublié'],
  ]) {
    const bouton = screen.getByRole('button', { name: lien });
    expect(bouton.className).toContain('min-h-12');
    fireEvent.click(bouton);
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: titre }));
  }
});
