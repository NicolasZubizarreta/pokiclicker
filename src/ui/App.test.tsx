// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import App from './App';
import { ErreurStockage } from '../core/sauvegarde';

const mocks = vi.hoisted(() => ({
  ailleurs: false, changer: () => {},
  ouvrir: vi.fn(), reprendre: vi.fn(), arreter: vi.fn(), demarrer: vi.fn(),
  arreterSynchro: vi.fn(), arreterAppareil: vi.fn(),
  listerLocales: vi.fn(), lister: vi.fn(), creer: vi.fn(), erreurStockage: undefined as unknown,
}));
vi.mock('./Coquille', () => ({ Coquille: () => <p>Jeu monté</p> }));
vi.mock('./compte/session-compte', () => ({ useSessionCompte: () => ({ valide: true, jeton: 'test' }) }));
vi.mock('../core/sauvegarde', async importOriginal => ({ ...await importOriginal<typeof import('../core/sauvegarde')>(), creerGestionnaire: () => ({ listerParties: mocks.listerLocales,
  partieCourante: () => 'test', chargerPartie: () => ({ donnees: { nom: 'Test', regionCourante: 'kanto' }, ecritLe: '2026-11-04' }),
  chargerRegion: () => ({ donnees: { zoneId: '' } }),
}) }));
vi.mock('./store', () => ({ departNouvellePartie: vi.fn(), storeJeu: {
  getState: () => ({ arreter: mocks.arreter, demarrer: mocks.demarrer }), abonnerSauvegarde: () => () => {},
} }));
vi.mock('./synchro', () => ({ creerSynchro: () => ({
  ouvrir: mocks.ouvrir, suppression: () => null, lireAvis: () => null, etat: () => 'ok', demarrer: vi.fn(), arreter: mocks.arreterSynchro,
  lister: mocks.lister, creerPartie: mocks.creer, derniereErreurStockage: () => mocks.erreurStockage,
}) }));
vi.mock('zustand', () => ({ useStore: () => ({}) }));
vi.mock('./compte/ZoneCompte', () => ({ ZoneCompte: ({ erreur, quandCreer }: { erreur: string; quandCreer(nom: string): void }) => <div>
  {erreur && <p role="alert">{erreur}</p>}<button onClick={() => quandCreer('Test')}>Créer</button>
</div> }));
vi.mock('./appareil', () => ({ creerAppareilActif: ({ quandChange }: { quandChange: () => void }) => {
  mocks.changer = quandChange;
  return { ailleurs: () => mocks.ailleurs, ouvrir: async () => mocks.ailleurs ? 'ailleurs' : 'libre', reprendre: mocks.reprendre,
    demarrer: vi.fn(), arreter: mocks.arreterAppareil };
} }));

beforeEach(() => {
  vi.stubEnv('VITE_API_URL', window.location.origin);
  vi.clearAllMocks();
  mocks.ailleurs = false;
  mocks.listerLocales.mockReturnValue([{ id: 'test' }]);
  mocks.lister.mockResolvedValue({ parties: [], horsConnexion: false, illisibles: [] });
  mocks.ouvrir.mockResolvedValue('rien');
  mocks.reprendre.mockImplementation(async () => { mocks.ailleurs = false; mocks.changer(); return 'ok'; });
});
afterEach(() => { cleanup(); vi.unstubAllEnvs(); });

it('affiche une erreur de stockage levée par la liste sans planter', async () => {
  mocks.listerLocales.mockReturnValue([]);
  mocks.lister.mockRejectedValueOnce(new ErreurStockage(new Error()));
  render(<App />);
  expect((await screen.findByRole('alert')).textContent).toContain("Le navigateur empêche l'accès");
});
it('affiche une erreur de stockage pendant la création sans planter', async () => {
  mocks.listerLocales.mockReturnValue([]);
  mocks.erreurStockage = new ErreurStockage(Object.assign(new Error(), { name: 'QuotaExceededError' }));
  mocks.creer.mockResolvedValueOnce('stockage');
  render(<App />);
  fireEvent.click(await screen.findByText('Créer'));
  expect((await screen.findByRole('alert')).textContent).toContain("Ton appareil n'a plus de place");
});

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
