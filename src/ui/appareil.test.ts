// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { creerGestionnaire, creerStockageMemoire } from '../core/sauvegarde';
import { creerAppareilActif } from './appareil';

const arrets: (() => void)[] = [];
beforeEach(() => vi.useFakeTimers());
afterEach(() => { arrets.splice(0).forEach(arret => arret()); vi.useRealTimers(); });
function preparer(partie = true) {
  const stockage = creerStockageMemoire();
  const horloge = creerHorlogeSimulee();
  if (partie) creerGestionnaire({ stockage, horloge, genererId: () => 'test' }).creerPartie('Test');
  const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(async () => Response.json({ actif: true }));
  const quandChange = vi.fn();
  const options = { stockage, horloge, urlApi: `${window.location.origin}/`, jeton: () => 'secret', fetch, quandChange };
  const appareil = creerAppareilActif(options);
  arrets.push(appareil.arreter);
  const corps = () => JSON.parse(fetch.mock.lastCall![1]!.body as string);
  return { ...options, options, appareil, corps };
}
it('stocke et réutilise un UUID, sans date dans la requête protégée', async () => {
  const t = preparer();
  await t.appareil.ouvrir();
  const id = t.stockage.lire('pokiclicker:appareil');
  expect(id).toMatch(/^[0-9a-f-]{36}$/);
  expect(t.corps()).toEqual({ appareilId: id });
  await creerAppareilActif(t.options).ouvrir();
  expect(t.corps()).toEqual({ appareilId: id });
  expect(t.fetch).toHaveBeenLastCalledWith(`${window.location.origin}/api/sauvegarde/parties/test/appareil`, expect.objectContaining({
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer secret' },
    credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer', signal: expect.any(AbortSignal),
  }));
});
it.each([200, 404, 401, 429, 500, 'réseau', 'forme'] as const)('ouvre libre : %s', async issue => {
  const t = preparer();
  if (issue === 'réseau') t.fetch.mockRejectedValue(new Error());
  else t.fetch.mockImplementation(async () => Response.json(issue === 'forme' ? {} : { actif: true }, { status: typeof issue === 'number' ? issue : 200 }));
  expect(await t.appareil.ouvrir()).toBe('libre');
  expect(t.appareil.ailleurs()).toBe(false);
});
it('ouvre ailleurs puis reprend, avec les seules clés autorisées', async () => {
  const t = preparer();
  t.fetch.mockResolvedValueOnce(Response.json({ actif: false }));
  expect(await t.appareil.ouvrir()).toBe('ailleurs');
  expect(t.appareil.ailleurs()).toBe(true);
  expect(t.quandChange).toHaveBeenCalledTimes(1);
  expect(await t.appareil.reprendre()).toBe('ok');
  expect(t.corps()).toEqual({ appareilId: t.stockage.lire('pokiclicker:appareil'), reprendre: true });
  expect(t.appareil.ailleurs()).toBe(false);
  expect(t.quandChange).toHaveBeenCalledTimes(2);
});
it('garde ailleurs si la reprise échoue', async () => {
  const t = preparer();
  t.fetch.mockResolvedValueOnce(Response.json({ actif: false }));
  await t.appareil.ouvrir();
  t.fetch.mockRejectedValue(new Error());
  expect(await t.appareil.reprendre()).toBe('echec');
  expect(t.appareil.ailleurs()).toBe(true);
});
it('ne demande rien sans partie locale', async () => {
  const t = preparer(false);
  expect(await t.appareil.ouvrir()).toBe('libre');
  t.appareil.demarrer();
  await vi.advanceTimersByTimeAsync(60_000);
  expect(t.fetch).not.toHaveBeenCalled();
});
it('bat toutes les 60 secondes après ouverture et cesse après arrêt', async () => {
  const t = preparer();
  t.appareil.demarrer();
  await vi.advanceTimersByTimeAsync(60_000);
  expect(t.fetch).not.toHaveBeenCalled();
  await t.appareil.ouvrir();
  t.appareil.demarrer();
  t.fetch.mockClear();
  await vi.advanceTimersByTimeAsync(60_000);
  expect(t.fetch).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(60_000);
  expect(t.fetch).toHaveBeenCalledTimes(2);
  t.appareil.arreter();
  window.dispatchEvent(new Event('online'));
  await vi.advanceTimersByTimeAsync(60_000);
  expect(t.fetch).toHaveBeenCalledTimes(2);
});
it('ne notifie que les changements et conserve son état lors des erreurs', async () => {
  const t = preparer();
  await t.appareil.ouvrir(); t.appareil.demarrer();
  t.fetch.mockImplementation(async () => Response.json({ actif: false }));
  await vi.advanceTimersByTimeAsync(120_000);
  expect(t.appareil.ailleurs()).toBe(true);
  expect(t.quandChange).toHaveBeenCalledTimes(1);
  t.fetch.mockRejectedValue(new Error());
  await vi.advanceTimersByTimeAsync(60_000);
  expect(t.appareil.ailleurs()).toBe(true);
  t.fetch.mockImplementation(async () => Response.json({ actif: true }));
  window.dispatchEvent(new Event('online'));
  await vi.advanceTimersByTimeAsync(0);
  expect(t.appareil.ailleurs()).toBe(false);
  expect(t.quandChange).toHaveBeenCalledTimes(2);
});
it("n'applique pas un battement parti avant une reprise réussie", async () => {
  const t = preparer();
  await t.appareil.ouvrir(); t.appareil.demarrer();
  let finir!: (r: Response) => void;
  t.fetch.mockImplementationOnce(() => new Promise<Response>(resolve => { finir = resolve; }));
  await vi.advanceTimersByTimeAsync(60_000);
  expect(await t.appareil.reprendre()).toBe('ok');
  finir(Response.json({ actif: false }));
  await vi.advanceTimersByTimeAsync(0);
  expect(t.appareil.ailleurs()).toBe(false);
});
it('ne superpose pas les battements', async () => {
  const t = preparer();
  await t.appareil.ouvrir(); t.appareil.demarrer();
  t.fetch.mockClear().mockImplementation(() => new Promise(() => {}));
  await vi.advanceTimersByTimeAsync(180_000);
  window.dispatchEvent(new Event('online'));
  expect(t.fetch).toHaveBeenCalledTimes(1);
});
