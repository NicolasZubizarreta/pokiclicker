// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import App from './App';

const mocks = vi.hoisted(() => ({
  ailleurs: false, changer: () => {},
  ouvrir: vi.fn(), reprendre: vi.fn(), arreter: vi.fn(), demarrer: vi.fn(),
}));
vi.mock('./Coquille', () => ({ Coquille: () => <p>Jeu monté</p> }));
vi.mock('./compte/session-compte', () => ({ useSessionCompte: () => ({ valide: true, jeton: 'test' }) }));
vi.mock('../core/sauvegarde', () => ({ creerGestionnaire: () => ({ listerParties: () => [{ id: 'test' }] }) }));
vi.mock('./store', () => ({ departNouvellePartie: vi.fn(), storeJeu: {
  getState: () => ({ arreter: mocks.arreter, demarrer: mocks.demarrer }), abonnerSauvegarde: () => () => {},
} }));
vi.mock('./synchro', () => ({ creerSynchro: () => ({
  ouvrir: mocks.ouvrir, choix: () => null, demarrer: vi.fn(), arreter: vi.fn(),
}) }));
vi.mock('./appareil', () => ({ creerAppareilActif: ({ quandChange }: { quandChange: () => void }) => {
  mocks.changer = quandChange;
  return { ailleurs: () => mocks.ailleurs, ouvrir: async () => 'libre', reprendre: mocks.reprendre,
    demarrer: vi.fn(), arreter: vi.fn() };
} }));

beforeEach(() => {
  vi.stubEnv('VITE_API_URL', window.location.origin);
  vi.clearAllMocks();
  mocks.ailleurs = false;
  mocks.ouvrir.mockResolvedValue('rien');
  mocks.reprendre.mockImplementation(async () => { mocks.ailleurs = false; mocks.changer(); return 'ok'; });
});
afterEach(() => { cleanup(); vi.unstubAllEnvs(); });

it('arrête une seule fois le jeu ouvert ailleurs et attend la relecture avant de reprendre', async () => {
  render(<App />);
  await screen.findByText('Jeu monté');
  act(() => { mocks.ailleurs = true; mocks.changer(); });
  expect(mocks.arreter).toHaveBeenCalledTimes(1);
  act(() => mocks.changer());
  expect(mocks.arreter).toHaveBeenCalledTimes(1);
  let terminer!: (etat: string) => void;
  mocks.ouvrir.mockImplementationOnce(() => new Promise(resolve => { terminer = resolve; }));
  fireEvent.click(screen.getByRole('button', { name: 'Reprendre ici' }));
  await waitFor(() => expect(mocks.ouvrir).toHaveBeenCalledTimes(2));
  expect(mocks.demarrer).not.toHaveBeenCalled();
  expect(screen.getByRole('heading', { name: 'Partie ouverte ailleurs' })).toBeTruthy();
  await act(async () => terminer('rien'));
  expect(mocks.demarrer).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('heading', { name: 'Partie ouverte ailleurs' })).toBeNull();
});

it('garde le jeu arrêté et permet de réessayer si la relecture échoue', async () => {
  render(<App />);
  await screen.findByText('Jeu monté');
  act(() => { mocks.ailleurs = true; mocks.changer(); });
  mocks.ouvrir.mockResolvedValueOnce('hors-ligne');
  fireEvent.click(screen.getByRole('button', { name: 'Reprendre ici' }));
  expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Connexion impossible. Réessaie.');
  expect(mocks.demarrer).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Reprendre ici' }));
  await waitFor(() => expect(mocks.demarrer).toHaveBeenCalledTimes(1));
});
