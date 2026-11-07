// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import App from './App';

const mocks = vi.hoisted(() => ({
  ailleurs: false, changer: () => {},
  ouvrir: vi.fn(), reprendre: vi.fn(), arreter: vi.fn(), demarrer: vi.fn(),
  arreterSynchro: vi.fn(), arreterAppareil: vi.fn(),
}));
vi.mock('./Coquille', () => ({ Coquille: () => <p>Jeu monté</p> }));
vi.mock('./compte/session-compte', () => ({ useSessionCompte: () => ({ valide: true, jeton: 'test' }) }));
vi.mock('../core/sauvegarde', () => ({ creerGestionnaire: () => ({ listerParties: () => [{ id: 'test' }],
  partieCourante: () => 'test', chargerPartie: () => ({ donnees: { nom: 'Test', regionCourante: 'kanto' }, ecritLe: '2026-11-04' }),
  chargerRegion: () => ({ donnees: { zoneId: '' } }),
}) }));
vi.mock('./store', () => ({ departNouvellePartie: vi.fn(), storeJeu: {
  getState: () => ({ arreter: mocks.arreter, demarrer: mocks.demarrer }), abonnerSauvegarde: () => () => {},
} }));
vi.mock('./synchro', () => ({ creerSynchro: () => ({
  ouvrir: mocks.ouvrir, suppression: () => null, lireAvis: () => null, etat: () => 'ok', demarrer: vi.fn(), arreter: mocks.arreterSynchro,
}) }));
vi.mock('./appareil', () => ({ creerAppareilActif: ({ quandChange }: { quandChange: () => void }) => {
  mocks.changer = quandChange;
  return { ailleurs: () => mocks.ailleurs, ouvrir: async () => mocks.ailleurs ? 'ailleurs' : 'libre', reprendre: mocks.reprendre,
    demarrer: vi.fn(), arreter: mocks.arreterAppareil };
} }));

beforeEach(() => {
  vi.stubEnv('VITE_API_URL', window.location.origin);
  vi.clearAllMocks();
  mocks.ailleurs = false;
  mocks.ouvrir.mockResolvedValue('rien');
  mocks.reprendre.mockImplementation(async () => { mocks.ailleurs = false; mocks.changer(); return 'ok'; });
});
afterEach(() => { cleanup(); vi.unstubAllEnvs(); });

it('arrête une seule fois le jeu repris ailleurs et ne reprend jamais la main automatiquement', async () => {
  render(<App />);
  await screen.findByText('Jeu monté');
  act(() => { mocks.ailleurs = true; mocks.changer(); });
  expect(mocks.arreter).toHaveBeenCalledTimes(1);
  act(() => mocks.changer());
  expect(mocks.arreter).toHaveBeenCalledTimes(1);
  expect(mocks.arreterSynchro).toHaveBeenCalled();
  expect(mocks.arreterAppareil).toHaveBeenCalled();
  fireEvent(window, new Event('online'));
  expect(mocks.ouvrir).toHaveBeenCalledTimes(1);
  expect(mocks.demarrer).not.toHaveBeenCalled();
  expect(screen.getByRole('heading', { name: 'Partie reprise ailleurs' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Reprendre ici' })).toBeNull();
});

it('garde le jeu arrêté et permet de réessayer si la relecture échoue', async () => {
  mocks.ailleurs = true;
  render(<App />);
  await screen.findByRole('heading', { name: 'Partie ouverte ailleurs' });
  mocks.ouvrir.mockResolvedValueOnce('hors-ligne');
  fireEvent.click(screen.getByRole('button', { name: 'Reprendre ici' }));
  expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Connexion impossible. Réessaie.');
  expect(mocks.demarrer).not.toHaveBeenCalled();
  expect(screen.queryByText('Jeu monté')).toBeNull();
  let terminer!: (etat: string) => void;
  mocks.ouvrir.mockImplementationOnce(() => new Promise(resolve => { terminer = resolve; }));
  fireEvent.click(screen.getByRole('button', { name: 'Reprendre ici' }));
  await waitFor(() => expect(mocks.ouvrir).toHaveBeenCalledTimes(3));
  expect(screen.queryByText('Jeu monté')).toBeNull();
  await act(async () => terminer('rien'));
  await screen.findByText('Jeu monté');
});
