import { afterEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ query: vi.fn(), end: vi.fn(), on: vi.fn(), serve: vi.fn(),
  createApp: vi.fn(), journal: vi.fn(), readConfig: vi.fn() }));
vi.mock('pg', () => ({ Pool: class {
  query = mocks.query; end = mocks.end; on = mocks.on;
} }));
vi.mock('@hono/node-server', () => ({ serve: mocks.serve }));
vi.mock('../src/app.js', () => ({ createApp: mocks.createApp }));
vi.mock('../src/config.js', () => ({ readConfig: mocks.readConfig }));
vi.mock('../src/journal.js', () => ({ journal: mocks.journal,
  messageNettoye: (error: unknown) => error instanceof Error ? error.message : 'Erreur inconnue.' }));

const rejets = process.listeners('unhandledRejection');
const interruptions = process.listeners('SIGINT');
const terminaisons = process.listeners('SIGTERM');
afterEach(() => {
  for (const listener of process.listeners('unhandledRejection')) if (!rejets.includes(listener)) process.removeListener('unhandledRejection', listener);
  for (const listener of process.listeners('SIGINT')) if (!interruptions.includes(listener)) process.removeListener('SIGINT', listener);
  for (const listener of process.listeners('SIGTERM')) if (!terminaisons.includes(listener)) process.removeListener('SIGTERM', listener);
  vi.restoreAllMocks(); vi.useRealTimers();
});

function preparer() {
  vi.resetModules(); vi.resetAllMocks(); vi.useFakeTimers();
  mocks.readConfig.mockReturnValue({ databaseURL: 'postgres://localhost/test', port: 3000, avertissements: ['Proxy à vérifier.'] });
  mocks.createApp.mockReturnValue({ app: { fetch: vi.fn() } });
  mocks.serve.mockReturnValue({ close: vi.fn() });
  mocks.end.mockResolvedValue(undefined);
}

test('démarrage : reprise de la base puis écoute, erreurs pool et rejets journalisés', async () => {
  preparer();
  mocks.query.mockRejectedValueOnce(new Error('Base indisponible.')).mockResolvedValue({ rows: [] });
  const chargement = import('../src/index.js');
  await vi.waitFor(() => expect(mocks.query).toHaveBeenCalledOnce());
  expect(mocks.serve).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1000);
  await chargement;
  expect(mocks.query).toHaveBeenCalledTimes(2);
  expect(mocks.serve).toHaveBeenCalledOnce();
  expect(mocks.journal).toHaveBeenCalledWith('configuration-avertissement', { message: 'Proxy à vérifier.' });
  const erreurPool = mocks.on.mock.calls.find(([evt]) => evt === 'error')![1];
  expect(() => erreurPool(new Error('Connexion perdue.'))).not.toThrow();
  expect(mocks.journal).toHaveBeenCalledWith('pool-erreur', expect.objectContaining({ message: 'Connexion perdue.' }));
  const rejet = process.listeners('unhandledRejection').find(listener => !rejets.includes(listener))!;
  rejet(new Error('Rejet contrôlé.'), Promise.resolve());
  expect(mocks.journal).toHaveBeenCalledWith('rejet-non-gere', expect.objectContaining({ message: 'Rejet contrôlé.' }));
});

test('démarrage : dix essais, attentes croissantes, fermeture et sortie 1', async () => {
  preparer();
  mocks.query.mockRejectedValue(new Error('Base indisponible.'));
  const sortie = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('Sortie contrôlée.'); });
  const chargement = expect(import('../src/index.js')).rejects.toThrow('Sortie contrôlée.');
  await vi.advanceTimersByTimeAsync(0);
  expect(mocks.query).toHaveBeenCalledOnce();
  for (let attente = 1; attente <= 9; attente++) {
    await vi.advanceTimersByTimeAsync(attente * 1000 - 1);
    expect(mocks.query).toHaveBeenCalledTimes(attente);
    await vi.advanceTimersByTimeAsync(1);
    expect(mocks.query).toHaveBeenCalledTimes(attente + 1);
  }
  await chargement;
  expect(mocks.end).toHaveBeenCalledOnce();
  expect(sortie).toHaveBeenCalledWith(1);
  expect(mocks.serve).not.toHaveBeenCalled();
});
