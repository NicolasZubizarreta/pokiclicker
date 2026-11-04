// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { reglages } from '../core/reglages';
import { compteInitial, creerGestionnaire, creerStockageMemoire } from '../core/sauvegarde';
import { creerStoreJeu } from './store';
import { creerSynchro } from './synchro';

const arrets: (() => void)[] = [];
beforeEach(() => vi.useFakeTimers());
afterEach(() => { arrets.splice(0).forEach(arret => arret()); vi.useRealTimers(); vi.restoreAllMocks(); });
function preparer(jeton: () => string | null = () => 'secret') {
  const stockage = creerStockageMemoire();
  const horloge = creerHorlogeSimulee();
  const g = creerGestionnaire({ stockage, horloge, genererId: () => 'test' });
  g.ecrireCompte(compteInitial());
  const p = g.creerPartie('Test');
  const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(async () => new Response(JSON.stringify({
    compte: { revision: 10 }, partie: { id: p.id, revision: 20 }, regions: [{ id: 'kanto', revision: 30 }],
  }), { status: 200 }));
  const options = { stockage, horloge, urlApi: `${window.location.origin}/`, jeton, fetch };
  const synchro = creerSynchro(options);
  arrets.push(synchro.arreter);
  const modifier = () => {
    const region = g.chargerRegion(p.id, 'kanto')!;
    g.ecrireRegion(p.id, 'kanto', { ...region.donnees });
  };
  const avancer = async (ms: number) => { horloge.avancer(ms); await vi.advanceTimersByTimeAsync(ms); };
  const corps = (indice = fetch.mock.calls.length - 1) => JSON.parse(fetch.mock.calls[indice]![1]!.body as string);
  const contenu = () => Object.fromEntries(stockage.cles().filter(c => c !== 'pokiclicker:synchro').sort().map(c => [c, stockage.lire(c)]));
  return { stockage, horloge, g, p, fetch, options, synchro, modifier, avancer, corps, contenu };
}

it('envoie au premier tour puis seulement la région modifiée avec sa base serveur', async () => {
  const t = preparer();
  t.synchro.demarrer();
  expect(t.fetch).not.toHaveBeenCalled();
  await t.avancer(45_000);
  expect(t.corps()).toMatchObject({ partieId: t.p.id, compte: { revisionBase: 0 }, partie: { revisionBase: 0 }, regions: [{ revisionBase: 0, enveloppe: { id: 'kanto' } }] });
  await t.avancer(45_000);
  expect(t.fetch).toHaveBeenCalledTimes(1);
  t.modifier();
  await t.avancer(45_000);
  expect(Object.keys(t.corps()).sort()).toEqual(['partieId', 'regions']);
  expect(t.corps().regions[0].revisionBase).toBe(30);
  expect(t.fetch.mock.calls[0]![0]).toBe(`${window.location.origin}/api/sauvegarde`);
  expect(t.fetch.mock.calls[0]![1]).toMatchObject({ method: 'PUT', credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer', headers: { Authorization: 'Bearer secret' } });
});

it('regroupe les immédiats et permet la fermeture sans délai', async () => {
  const t = preparer();
  await t.synchro.envoyerMaintenant();
  t.modifier();
  await t.synchro.envoyerMaintenant();
  await t.synchro.envoyerMaintenant();
  await t.avancer(1999);
  expect(t.fetch).toHaveBeenCalledTimes(1);
  await t.avancer(1);
  expect(t.fetch).toHaveBeenCalledTimes(2);
  t.modifier();
  await t.synchro.envoyerMaintenant({ fermeture: true });
  expect(t.fetch).toHaveBeenCalledTimes(3);
  expect(t.fetch.mock.calls[2]![1]?.keepalive).toBe(true);
});

it('reprend la dernière version après une panne sans modifier le jeu', async () => {
  const t = preparer();
  t.synchro.demarrer();
  const avant = t.contenu();
  t.fetch.mockRejectedValueOnce(new Error('réseau'));
  await expect(t.synchro.envoyerMaintenant()).resolves.toBeUndefined();
  expect(t.synchro.etat()).toBe('hors-ligne');
  expect(t.contenu()).toEqual(avant);
  t.modifier(); t.modifier();
  window.dispatchEvent(new Event('online'));
  await t.avancer(0);
  expect(t.fetch).toHaveBeenCalledTimes(2);
  expect(t.corps().regions[0].enveloppe).toEqual(t.g.chargerRegion(t.p.id, 'kanto'));
});

it.each([409, 401, 400, 403, 404, 413, 422])('bloque après %s et reprend après arrêt et démarrage', async statut => {
  const t = preparer();
  t.synchro.demarrer();
  t.fetch.mockResolvedValueOnce(new Response(null, { status: statut }));
  const avant = t.contenu();
  await t.synchro.envoyerMaintenant();
  expect(t.synchro.etat()).toBe(statut === 409 ? 'conflit' : 'refuse');
  expect(t.contenu()).toEqual(avant);
  expect(t.stockage.lire('pokiclicker:synchro')).toBeNull();
  t.modifier();
  await t.synchro.envoyerMaintenant({ fermeture: true });
  window.dispatchEvent(new Event('online'));
  await t.avancer(90_000);
  expect(t.fetch).toHaveBeenCalledTimes(1);
  t.synchro.arreter(); t.synchro.arreter();
  t.synchro.demarrer();
  await t.avancer(45_000);
  expect(t.fetch).toHaveBeenCalledTimes(2);
});

it('garde la copie envoyée et regroupe les demandes pendant le vol', async () => {
  const t = preparer();
  let terminer!: (reponse: Response) => void;
  t.fetch.mockImplementationOnce(() => new Promise(resolve => { terminer = resolve; }));
  const attente = t.synchro.envoyerMaintenant();
  const corpsInitial = t.fetch.mock.calls[0]![1]!.body;
  const revision = t.g.chargerRegion(t.p.id, 'kanto')!.revision;
  t.modifier();
  const suivante = t.synchro.envoyerMaintenant();
  void t.synchro.envoyerMaintenant();
  expect(t.fetch).toHaveBeenCalledTimes(1);
  expect(t.fetch.mock.calls[0]![1]!.body).toBe(corpsInitial);
  terminer(new Response(JSON.stringify({ regions: [{ id: 'kanto', revision: 50 }] }), { status: 200 }));
  await attente; await suivante;
  expect(t.fetch).toHaveBeenCalledTimes(2);
  expect(t.corps().regions[0]).toMatchObject({ revisionBase: 50, enveloppe: { revision: revision + 1 } });
});

it('ne part pas sans jeton et conserve les révisions après rechargement', async () => {
  const absent = preparer(() => null);
  await absent.synchro.envoyerMaintenant();
  expect(absent.fetch).not.toHaveBeenCalled();
  const t = preparer();
  await t.synchro.envoyerMaintenant();
  t.synchro.arreter();
  const nouvelle = creerSynchro(t.options);
  arrets.push(nouvelle.arreter);
  await nouvelle.envoyerMaintenant();
  expect(t.fetch).toHaveBeenCalledTimes(1);
  t.modifier();
  await nouvelle.envoyerMaintenant();
  expect(t.corps().regions[0].revisionBase).toBe(30);
});

it('ne lance plus de requête après arrêt, y compris un rattrapage', async () => {
  const t = preparer();
  t.synchro.demarrer();
  await t.synchro.envoyerMaintenant();
  t.modifier();
  await t.synchro.envoyerMaintenant();
  t.synchro.arreter();
  window.dispatchEvent(new Event('online'));
  await t.synchro.envoyerMaintenant({ fermeture: true });
  await t.avancer(90_000);
  expect(t.fetch).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);
});

it('produit le même parcours avec et sans synchro', async () => {
  const parcours = [false, true].map(avecSynchro => {
    const t = preparer();
    const compte = compteInitial();
    t.g.ecrireCompte({ ...compte, preferences: { ...compte.preferences,
      arretAuto: { ...reglages.depart.preferences.arretAuto, actif: false } } });
    const store = creerStoreJeu({ stockage: t.stockage, horloge: t.horloge, alea: () => .1, genererId: () => 'test' });
    arrets.push(() => store.getState().arreter());
    store.getState().demarrer();
    if (avecSynchro) {
      t.synchro.demarrer();
      store.abonnerSauvegarde(() => void t.synchro.envoyerMaintenant());
    }
    return { ...t, store };
  });
  for (let tour = 0; tour < 400; tour++) {
    for (const t of parcours) {
      t.store.getState().attaquer(); t.horloge.avancer(100); t.store.getState().tick();
    }
    await vi.advanceTimersByTimeAsync(100);
  }
  const etat = (t: typeof parcours[number]) => {
    const { etape, zone, argent, equipe } = t.store.getState();
    return { etape, zone, argent, equipe };
  };
  expect(etat(parcours[1]!)).toEqual(etat(parcours[0]!));
  expect(parcours[1]!.contenu()).toEqual(parcours[0]!.contenu());
});
