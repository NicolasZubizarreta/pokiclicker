// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { reglages } from '../core/reglages';
import { compteInitial, creerGestionnaire, creerStockageMemoire } from '../core/sauvegarde';
import { creerStoreJeu } from './store';
import { creerSynchro, decider, type Memoire } from './synchro';

const arrets: (() => void)[] = [];
function versions(t: ReturnType<typeof preparer>) {
  const local = { compte: t.g.chargerCompte()!, partie: t.g.chargerPartie(t.p.id)!, regions: [t.g.chargerRegion(t.p.id, 'kanto')!] };
  const serveur = { compte: { ...local.compte, revision: 10 }, partie: { ...local.partie, revision: 20 }, regions: [{ ...local.regions[0]!, revision: 30 }] };
  const memoire: Memoire = { version: 1, compte: { local: 1, serveur: 10 }, parties: { [t.p.id]: { local: 1, serveur: 20 } }, regions: { [`${t.p.id}:kanto`]: { local: 1, serveur: 30 } } };
  const repondre = () => t.fetch.mockImplementation(async (url, options) => {
    if (options?.method === 'POST') return new Response('{}');
    if (options?.method === 'PUT') return new Response(JSON.stringify({ compte: { revision: 11 }, partie: { id: t.p.id, revision: 21 }, regions: [{ id: 'kanto', revision: 31 }] }));
    return new Response(JSON.stringify(String(url).endsWith('/parties') ? { parties: [{ id: serveur.partie.id, nom: 'Test', revision: 20, ecritLe: serveur.partie.ecritLe }] }
      : String(url).endsWith('/compte') ? { enveloppe: serveur.compte } : serveur));
  });
  repondre();
  return { local, serveur, memoire, repondre };
}

it.each([
  ['identiques', false, false, false, 'rien'],
  ['local seul', true, false, false, 'rien'],
  ['serveur seul', false, true, false, 'charger'],
  ['deux changements', true, true, false, 'choisir'],
  ['identifiants différents', false, false, true, 'choisir'],
] as const)('décide : %s', (_, changeLocal, changeServeur, autreId, resultat) => {
  const t = preparer();
  const { local, serveur, memoire } = versions(t);
  if (changeLocal) local.partie.revision++;
  if (changeServeur) serveur.regions[0]!.revision++;
  if (autreId) local.partie.id = 'autre';
  expect(decider(local, serveur, memoire)).toBe(resultat);
  expect(decider(local, null, memoire)).toBe('rien');
  expect(decider({ compte: null, partie: null, regions: [] }, serveur, { version: 1, parties: {}, regions: {} })).toBe('charger');
});

it.each([true, false])('charge sans envoi (appareil neuf : %s)', async neuf => {
  const t = preparer();
  const { serveur, memoire } = versions(t);
  serveur.partie.revision++;
  if (neuf) t.stockage.cles().forEach(cle => t.stockage.supprimer(cle));
  else t.stockage.ecrire('pokiclicker:synchro', JSON.stringify(memoire));
  const synchro = creerSynchro(t.options);
  expect(await synchro.ouvrir()).toBe('charge');
  expect(t.g.chargerPartie(t.p.id)).toEqual(serveur.partie);
  expect(JSON.parse(t.stockage.lire('pokiclicker:synchro')!).parties[t.p.id]).toEqual({ local: 21, serveur: 21 });
  expect(t.fetch.mock.calls.every(([, options]) => options?.method === 'GET')).toBe(true);
});

it('présente le choix et garde cet appareil avec les bases serveur', async () => {
  const t = preparer(); versions(t);
  const quandChange = vi.fn();
  const synchro = creerSynchro({ ...t.options, quandChange });
  expect(await synchro.ouvrir()).toBe('choix');
  expect(synchro.choix()?.local.regionId).toBe('kanto');
  expect(quandChange).toHaveBeenCalledTimes(1);
  await synchro.envoyerMaintenant();
  expect(t.fetch).toHaveBeenCalledTimes(3);
  expect(await synchro.trancher('local')).toBe('ok');
  expect(t.corps()).toMatchObject({ compte: { revisionBase: 10 }, partie: { revisionBase: 20 }, regions: [{ revisionBase: 30 }] });
  expect(synchro.choix()).toBeNull();
  expect(quandChange).toHaveBeenCalledTimes(2);
});

it.each(['réseau', 'forme', 'serveur'])('ouvre sur le local en cas de problème : %s', async cause => {
  const t = preparer();
  if (cause === 'réseau') t.fetch.mockRejectedValue(new Error('Réseau'));
  else t.fetch.mockResolvedValue(new Response('{}', { status: cause === 'serveur' ? 503 : 200 }));
  const avant = t.contenu();
  expect(await t.synchro.ouvrir()).toBe('hors-ligne');
  expect(t.contenu()).toEqual(avant);
});

it('prépare le choix après 409 et retente la lecture sans nouvel envoi', async () => {
  const t = preparer();
  const v = versions(t);
  t.fetch.mockResolvedValueOnce(new Response('{}', { status: 409 })).mockRejectedValueOnce(new Error('Réseau'));
  t.synchro.demarrer();
  await t.synchro.envoyerMaintenant();
  expect(t.synchro.etat()).toBe('conflit');
  expect(t.synchro.choix()).toBeNull();
  v.repondre();
  await t.avancer(45_000);
  expect(t.synchro.choix()).not.toBeNull();
  t.modifier();
  await t.synchro.envoyerMaintenant({ fermeture: true });
  expect(t.fetch.mock.calls.filter(([, o]) => o?.method === 'PUT')).toHaveLength(1);
});

it.each([true, false])('archive avant installation (échec : %s)', async echec => {
  const t = preparer();
  const { serveur } = versions(t);
  await t.synchro.ouvrir();
  const avant = t.contenu();
  const ecrire = vi.spyOn(t.stockage, 'ecrire');
  t.fetch.mockImplementation(async (_, options) => {
    expect(options?.method).toBe('POST');
    expect(t.contenu()).toEqual(avant);
    expect(ecrire).not.toHaveBeenCalled();
    return new Response('{}', { status: echec ? 503 : 200 });
  });
  expect(await t.synchro.trancher('serveur')).toBe(echec ? 'echec' : 'ok');
  if (echec) {
    expect(t.contenu()).toEqual(avant);
    expect(t.synchro.choix()).not.toBeNull();
  } else {
    expect(t.g.chargerPartie(t.p.id)).toEqual(serveur.partie);
    expect(t.g.chargerCompte()).toEqual(serveur.compte);
    expect(t.g.chargerRegion(t.p.id, 'kanto')).toEqual(serveur.regions[0]);
    expect(JSON.parse(t.stockage.lire('pokiclicker:synchro')!).regions[`${t.p.id}:kanto`]).toEqual({ local: 30, serveur: 30 });
    expect(t.synchro.choix()).toBeNull();
  }
});

it('archive toutes les régions de la partie écartée avec son identifiant puis supprime sa mémoire', async () => {
  const t = preparer();
  const { serveur, memoire } = versions(t);
  serveur.partie.id = 'autre';
  const region = t.g.chargerRegion(t.p.id, 'kanto')!;
  t.g.ecrireRegion(t.p.id, 'johto', { ...region.donnees, regionId: 'johto' });
  t.stockage.ecrire('pokiclicker:synchro', JSON.stringify(memoire));
  const synchro = creerSynchro(t.options);
  expect(await synchro.ouvrir()).toBe('choix');
  expect(await synchro.trancher('serveur')).toBe('ok');
  const archives = t.fetch.mock.calls.filter(([, o]) => o?.method === 'POST').map(([, o]) => JSON.parse(o!.body as string));
  expect(archives.map(a => [a.niveau, a.objetId])).toEqual([
    ['compte', 'local'], ['partie', t.p.id], ['region', `${t.p.id}:kanto`], ['region', `${t.p.id}:johto`],
  ]);
  expect(t.g.chargerPartie(t.p.id)).toBeNull();
  expect(t.g.chargerRegion(t.p.id, 'johto')).toBeNull();
  expect(t.g.chargerPartie('autre')).toEqual(serveur.partie);
  const apres = JSON.parse(t.stockage.lire('pokiclicker:synchro')!);
  expect(apres.parties[t.p.id]).toBeUndefined();
  expect(apres.regions[`${t.p.id}:kanto`]).toBeUndefined();
});

it('archive aussi une région locale absente du serveur quand la partie est la même', async () => {
  const t = preparer();
  const { memoire } = versions(t);
  memoire.parties[t.p.id] = { local: 0, serveur: 19 };
  const region = t.g.chargerRegion(t.p.id, 'kanto')!;
  t.g.ecrireRegion(t.p.id, 'johto', { ...region.donnees, regionId: 'johto' });
  t.stockage.ecrire('pokiclicker:synchro', JSON.stringify(memoire));
  const synchro = creerSynchro(t.options);
  expect(await synchro.ouvrir()).toBe('choix');
  expect(await synchro.trancher('serveur')).toBe('ok');
  const archives = t.fetch.mock.calls.filter(([, o]) => o?.method === 'POST').map(([, o]) => JSON.parse(o!.body as string).objetId);
  expect(archives).toContain(`${t.p.id}:johto`);
  expect(t.g.chargerRegion(t.p.id, 'johto')).toBeNull();
});

it("garde cet appareil avec la base connue quand le serveur liste une autre partie", async () => {
  const t = preparer();
  const { serveur, memoire } = versions(t);
  serveur.partie.id = 'autre';
  memoire.parties[t.p.id] = { local: 1, serveur: 3 };
  t.stockage.ecrire('pokiclicker:synchro', JSON.stringify(memoire));
  const synchro = creerSynchro(t.options);
  expect(await synchro.ouvrir()).toBe('choix');
  expect(await synchro.trancher('local')).toBe('ok');
  expect(t.corps()).toMatchObject({ partie: { revisionBase: 3 } });
});

it('relit un choix périmé et conserve le local si cette lecture échoue', async () => {
  const t = preparer();
  const { serveur, repondre } = versions(t);
  await t.synchro.ouvrir();
  const avant = t.contenu();
  t.horloge.avancer(60_001);
  t.fetch.mockRejectedValueOnce(new Error('Réseau'));
  expect(await t.synchro.trancher('serveur')).toBe('echec');
  expect(t.contenu()).toEqual(avant);
  serveur.partie.revision++;
  repondre();
  expect(await t.synchro.trancher('serveur')).toBe('ok');
  expect(t.g.chargerPartie(t.p.id)?.revision).toBe(21);
});

it('représente le choix si garder cet appareil reçoit encore un 409', async () => {
  const t = preparer(); versions(t);
  await t.synchro.ouvrir();
  t.fetch.mockResolvedValueOnce(new Response('{}', { status: 409 }));
  expect(await t.synchro.trancher('local')).toBe('echec');
  expect(t.synchro.choix()).not.toBeNull();
  expect(t.synchro.etat()).toBe('conflit');
});
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

it.each([401, 400, 403, 404, 413, 422])('bloque après %s et reprend après arrêt et démarrage', async statut => {
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
