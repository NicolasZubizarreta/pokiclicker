// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { reglages } from '../core/reglages';
import { compteInitial, creerGestionnaire, creerStockageMemoire } from '../core/sauvegarde';
import { creerStoreJeu } from './store';
import { creerSynchro, decider, type Memoire } from './synchro';

const arrets: (() => void)[] = [];
it.each(['autre', 'cet-appareil', null, undefined, 42, 'inconnu'])('liste appareil actif : %s', async appareilActif => {
  const t = preparer();
  const synchro = creerSynchro({ ...t.options, appareilId: () => 'a/b' });
  t.fetch.mockImplementation(async () => new Response(JSON.stringify({ parties: [
    { id: 'distante', nom: 'D', revision: 1, ecritLe: t.p.ecritLe, appareilActif },
  ] })));
  const resultat = await synchro.lister();
  expect(t.fetch.mock.calls[0]![0]).toBe(`${window.location.origin}/api/sauvegarde/parties?appareilId=a%2Fb`);
  expect(resultat.parties.find(p => p.id === 'distante')!.ailleurs).toBe(appareilActif === 'autre');
  expect(resultat.parties.find(p => p.id === t.p.id)!.ailleurs).toBe(false);
});
it.each([null, ''])('liste sans identifiant appareil : %s', async appareilId => {
  const t = preparer();
  versions(t);
  await creerSynchro({ ...t.options, appareilId: () => appareilId }).lister();
  expect(t.fetch.mock.calls[0]![0]).toBe(`${window.location.origin}/api/sauvegarde/parties`);
});
it.each([200, 500])('archive la divergence en un lot avant installation : %s', async status => {
  const t = preparer();
  const { local } = versions(t);
  const avant = t.contenu();
  const repondre = t.fetch.getMockImplementation()!;
  t.fetch.mockImplementation(async (url, options) => String(url).endsWith('/archives')
    ? new Response('{}', { status }) : repondre(url, options));
  expect(await t.synchro.ouvrir()).toBe(status === 200 ? 'charge' : 'hors-ligne');
  const posts = t.fetch.mock.calls.filter(([, o]) => o?.method === 'POST');
  expect(posts).toHaveLength(2);
  expect(posts[0]![0]).toBe(`${window.location.origin}/api/sauvegarde/versions`);
  expect(JSON.parse(posts[0]![1]!.body as string)).toEqual({ niveau: 'compte', objetId: 'local', enveloppe: local.compte });
  expect(posts[1]![0]).toBe(`${window.location.origin}/api/sauvegarde/parties/test/archives`);
  expect(JSON.parse(posts[1]![1]!.body as string)).toEqual({ partie: local.partie, regions: local.regions });
  if (status === 500) expect(t.contenu()).toEqual(avant);
});
it('ne bloque pas une divergence sans region locale', async () => {
  const t = preparer();
  versions(t);
  t.stockage.supprimer(`pokiclicker:region:${t.p.id}:kanto`);
  expect(await t.synchro.ouvrir()).toBe('charge');
  expect(t.fetch.mock.calls.some(([url]) => String(url).endsWith('/archives'))).toBe(false);
});
it('liste les versions dans leur ordre et filtre les elements invalides', async () => {
  const t = preparer();
  const v = { lot: 'recent', origine: 'divergence', remplaceLe: t.p.ecritLe, ecritLe: t.p.ecritLe,
    tempsJeuMs: 12, regionCourante: 'kanto', zoneId: 'bourg', niveauEquipe: 5 };
  const ancien = { ...v, lot: 'ancien', origine: 'restauration', regionCourante: null, zoneId: null, tempsJeuMs: null, niveauEquipe: null };
  t.fetch.mockImplementation(async () => new Response(JSON.stringify({ versions: [v, null, {},
    { ...v, lot: 5 }, { ...v, origine: 'autre' }, { ...v, remplaceLe: null }, { ...v, ecritLe: 5 },
    { ...v, tempsJeuMs: '12' }, { ...v, niveauEquipe: '5' }, { ...v, regionCourante: 42 }, { ...v, zoneId: false }, ancien,
    { ...v, lot: 'absent', regionCourante: undefined, zoneId: undefined },
  ] })));
  expect(await t.synchro.listerVersions('a/b')).toEqual([v, { ...ancien, regionCourante: '', zoneId: '' },
    { ...v, lot: 'absent', regionCourante: '', zoneId: '' }]);
  expect(t.fetch.mock.calls[0]![0]).toBe(`${window.location.origin}/api/sauvegarde/parties/a%2Fb/versions`);
});
it.each(['500', 'reseau', 'forme'])('versions indisponibles : %s', async cause => {
  const t = preparer();
  if (cause === 'reseau') t.fetch.mockRejectedValue(new Error('reseau'));
  else t.fetch.mockResolvedValue(new Response('{}', { status: cause === '500' ? 500 : 200 }));
  expect(await t.synchro.listerVersions(t.p.id)).toBeNull();
});
it.each([200, 404, 500, 0])('restaure une version distante : %s', async status => {
  const t = preparer();
  const synchro = creerSynchro({ ...t.options, appareilId: () => 'appareil' });
  const avant = t.contenu();
  const memoire = t.stockage.lire('pokiclicker:synchro');
  t.fetch.mockImplementation(async () => {
    if (!status) throw new Error('reseau');
    return new Response('{}', { status });
  });
  expect(await synchro.restaurerVersion('a/b', 'lot')).toBe(status === 200 ? 'ok' : status === 404 ? 'introuvable' : 'echec');
  expect(t.fetch).toHaveBeenCalledTimes(1);
  expect(t.fetch.mock.calls[0]![0]).toBe(`${window.location.origin}/api/sauvegarde/parties/a%2Fb/restaurer`);
  expect(t.fetch.mock.calls[0]![1]?.method).toBe('POST');
  expect(t.corps()).toEqual({ appareilId: 'appareil', lot: 'lot' });
  expect(t.contenu()).toEqual(avant);
  expect(t.stockage.lire('pokiclicker:synchro')).toBe(memoire);
});
it.each(['jeton', 'appareil', 'vide'])('refuse de restaurer sans %s', async manque => {
  const t = preparer(() => manque === 'jeton' ? null : 'secret');
  const synchro = creerSynchro({ ...t.options, appareilId: () => manque === 'appareil' ? null : manque === 'vide' ? '' : 'appareil' });
  expect(await synchro.restaurerVersion(t.p.id, 'lot')).toBe('echec');
  expect(t.fetch).not.toHaveBeenCalled();
});
it.each([200, 500])('envoie les modifications avant restauration meme si le PUT echoue : %s', async status => {
  const t = preparer();
  const synchro = creerSynchro({ ...t.options, appareilId: () => 'appareil' });
  let terminer!: (r: Response) => void;
  t.fetch.mockImplementationOnce(() => new Promise(resolve => { terminer = resolve; }));
  const restauration = synchro.restaurerVersion(t.p.id, 'lot');
  expect(t.fetch).toHaveBeenCalledTimes(1);
  expect(t.fetch.mock.calls[0]![1]?.method).toBe('PUT');
  terminer(new Response('{}', { status }));
  expect(await restauration).toBe('ok');
  expect(t.fetch.mock.calls[1]![1]?.method).toBe('POST');
  expect(t.fetch.mock.calls[1]![0]).toBe(`${window.location.origin}/api/sauvegarde/parties/test/restaurer`);
});
it('renomme une partie jamais envoyee sans reseau ni jeton', async () => {
  const t = preparer(() => null);
  expect(await t.synchro.renommerPartie(t.p.id, ' Nouveau ')).toBe('ok');
  expect(t.fetch).not.toHaveBeenCalled();
  expect(t.g.chargerPartie(t.p.id)!.donnees.nom).toBe('Nouveau');
});
it.each(['ok', 'reseau', '404', 'sans-jeton'] as const)('renomme une partie connue : %s', async resultat => {
  const t = preparer(() => resultat === 'sans-jeton' ? null : 'secret');
  const { memoire } = versions(t);
  t.stockage.ecrire('pokiclicker:synchro', JSON.stringify(memoire));
  const synchro = creerSynchro(t.options);
  t.fetch.mockImplementation(async () => {
    expect(t.g.chargerPartie(t.p.id)!.donnees.nom).toBe('Test');
    if (resultat === 'reseau') throw new Error('Reseau');
    return new Response(JSON.stringify({ nom: 'Nouveau' }), { status: resultat === '404' ? 404 : 200 });
  });
  expect(await synchro.renommerPartie(t.p.id, ' Nouveau ')).toBe(resultat === 'ok' ? 'ok' : 'echec');
  if (resultat === 'sans-jeton') expect(t.fetch).not.toHaveBeenCalled();
  else {
    expect(t.fetch).toHaveBeenCalledTimes(1);
    expect(t.fetch.mock.calls[0]![0]).toBe(`${window.location.origin}/api/sauvegarde/parties/test`);
    expect(t.fetch.mock.calls[0]![1]?.method).toBe('PATCH');
    expect(t.corps()).toEqual({ nom: 'Nouveau' });
  }
  expect(t.g.chargerPartie(t.p.id)!.donnees.nom).toBe(resultat === 'ok' ? 'Nouveau' : 'Test');
});
it.each([' ', 'a'.repeat(101)])('refuse un nom invalide : %s', async nom => {
  const t = preparer();
  expect(await t.synchro.renommerPartie(t.p.id, nom)).toBe('nom-invalide');
  expect(t.fetch).not.toHaveBeenCalled();
  expect(t.g.chargerPartie(t.p.id)).toEqual(t.p);
});
it('aligne le nom local sur la liste serveur sans toucher aux parties absentes', async () => {
  const t = preparer();
  versions(t);
  const locale = t.g.renommerPartie(t.p.id, 'Ancien');
  const autre = creerGestionnaire({ stockage: t.stockage, horloge: t.horloge, genererId: () => 'autre' }).creerPartie('Locale');
  await t.synchro.lister();
  expect(t.g.chargerPartie(t.p.id)).toEqual({ ...locale, donnees: { ...locale.donnees, nom: 'Test' } });
  expect(t.g.chargerPartie(autre.id)).toEqual(autre);
});
it.each([
  [false, false, 'rien'], [false, true, 'envoyer'],
  [true, false, 'charger'], [true, true, 'diverge'],
] as const)('décide indépendamment pour le compte (%s, %s)', (sc, lc, verdict) => {
  const t = preparer();
  const { local, serveur, memoire } = versions(t);
  if (sc) serveur.compte.revision++;
  if (lc) local.compte.revision++;
  expect(decider(local, serveur, memoire)).toEqual({ compte: verdict, partie: 'rien' });
});

it('résout le compte seul en conservant la partie locale et sa mémoire', async () => {
  const t = preparer();
  const { serveur, memoire } = versions(t);
  serveur.compte.revision++;
  t.g.ecrireCompte({ ...compteInitial(), diamants: 99 });
  t.modifier();
  t.stockage.ecrire('pokiclicker:synchro', JSON.stringify(memoire));
  const synchro = creerSynchro(t.options);
  const partie = t.g.chargerPartie(t.p.id);
  const region = t.g.chargerRegion(t.p.id, 'kanto');
  expect(await synchro.ouvrir()).toBe('charge');
  expect(t.g.chargerCompte()).toEqual(serveur.compte);
  expect(t.g.chargerPartie(t.p.id)).toEqual(partie);
  expect(t.g.chargerRegion(t.p.id, 'kanto')).toEqual(region);
  const apres = JSON.parse(t.stockage.lire('pokiclicker:synchro')!);
  expect(apres.parties).toEqual(memoire.parties);
  expect(apres.regions).toEqual(memoire.regions);
  const archives = t.fetch.mock.calls.filter(([, o]) => o?.method === 'POST');
  expect(archives).toHaveLength(1);
  expect(JSON.parse(archives[0]![1]!.body as string)).toMatchObject({ niveau: 'compte', objetId: 'local' });
});

it('suspend les PUT en pause puis reprend les envois', async () => {
  const t = preparer();
  let pause = true;
  const synchro = creerSynchro({ ...t.options, enPause: () => pause });
  arrets.push(synchro.arreter);
  await synchro.envoyerMaintenant();
  expect(t.fetch).not.toHaveBeenCalled();
  pause = false;
  await synchro.envoyerMaintenant();
  expect(t.fetch.mock.calls.filter(([, options]) => options?.method === 'PUT')).toHaveLength(1);
});
function versions(t: ReturnType<typeof preparer>) {
  const local = { compte: t.g.chargerCompte()!, partie: t.g.chargerPartie(t.p.id)!, regions: [t.g.chargerRegion(t.p.id, 'kanto')!] };
  const plusTard = '2030-01-01T00:00:00.000Z';
  const serveur = { compte: { ...local.compte, revision: 10, ecritLe: plusTard }, partie: { ...local.partie, revision: 20, ecritLe: plusTard }, regions: [{ ...local.regions[0]!, revision: 30, ecritLe: plusTard }] };
  const memoire: Memoire = { version: 1, compte: { local: 1, serveur: 10 }, parties: { [t.p.id]: { local: 1, serveur: 20 } }, regions: { [`${t.p.id}:kanto`]: { local: 1, serveur: 30 } } };
  const repondre = () => t.fetch.mockImplementation(async (url, options) => {
    if (options?.method === 'DELETE') return new Response('{"ok":true}');
    if (options?.method === 'POST') return new Response('{}');
    if (options?.method === 'PUT') return new Response(JSON.stringify({ compte: { revision: 11 }, partie: { id: t.p.id, revision: 21 }, regions: [{ id: 'kanto', revision: 31 }] }));
    return new Response(JSON.stringify(String(url).endsWith('/parties') ? { parties: [{ id: serveur.partie.id, nom: 'Test', revision: 20, ecritLe: serveur.partie.ecritLe,
      regionCourante: serveur.partie.donnees.regionCourante, zoneId: serveur.regions[0]!.donnees.zoneId, tempsJeuMs: 123 }] }
      : String(url).endsWith('/compte') ? { enveloppe: serveur.compte } : serveur));
  });
  repondre();
  return { local, serveur, memoire, repondre };
}

it.each([
  ['identiques', false, false, false, 'rien'],
  ['local seul', true, false, false, 'envoyer'],
  ['serveur seul', false, true, false, 'charger'],
  ['deux changements', true, true, false, 'diverge'],
  ['identifiants différents', false, false, true, 'diverge'],
] as const)('décide : %s', (_, changeLocal, changeServeur, autreId, resultat) => {
  const t = preparer();
  const { local, serveur, memoire } = versions(t);
  if (changeLocal) local.partie.revision++;
  if (changeServeur) serveur.regions[0]!.revision++;
  if (autreId) local.partie.id = 'autre';
  expect(decider(local, serveur, memoire)).toEqual({ compte: 'rien', partie: resultat });
  expect(decider(local, null, memoire).compte).toBe('rien');
  expect(decider({ compte: null, partie: null, regions: [] }, serveur, { version: 1, parties: {}, regions: {} } )).toEqual({ compte: 'charger', partie: 'charger' });
});

it('ne voit pas de divergence quand le serveur a déjà reçu exactement ce que le local n’a pas pu mémoriser', () => {
  const t = preparer();
  const { local, serveur, memoire } = versions(t);
  // Envoi parti puis page rechargée avant d'avoir mémorisé la réponse : mêmes dates d'écriture des deux côtés.
  local.compte.revision++; local.partie.revision++; local.regions[0]!.revision++;
  serveur.compte.revision++; serveur.partie.revision++; serveur.regions[0]!.revision++;
  serveur.compte.ecritLe = local.compte.ecritLe; serveur.partie.ecritLe = local.partie.ecritLe;
  serveur.regions[0]!.ecritLe = local.regions[0]!.ecritLe;
  expect(decider(local, serveur, memoire)).toEqual({ compte: 'charger', partie: 'charger' });
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

it('résout automatiquement et consomme un seul avis', async () => {
  const t = preparer(); const { serveur } = versions(t);
  expect(await t.synchro.ouvrir()).toBe('charge');
  expect(t.g.chargerPartie(t.p.id)).toEqual(serveur.partie);
  expect(t.synchro.lireAvis()).toContain('gardé en secours');
  expect(t.synchro.lireAvis()).toBeNull();
  await t.synchro.envoyerMaintenant();
  expect(t.fetch.mock.calls.filter(([, o]) => o?.method === 'PUT')).toHaveLength(0);
});

it.each(['réseau', 'forme', 'serveur'])('ouvre sur le local en cas de problème : %s', async cause => {
  const t = preparer();
  if (cause === 'réseau') t.fetch.mockRejectedValue(new Error('Réseau'));
  else t.fetch.mockResolvedValue(new Response('{}', { status: cause === 'serveur' ? 503 : 200 }));
  const avant = t.contenu();
  expect(await t.synchro.ouvrir()).toBe('hors-ligne');
  expect(t.contenu()).toEqual(avant);
});

it('résout après 409 au retour du réseau', async () => {
  const t = preparer(); versions(t);
  t.fetch.mockResolvedValueOnce(new Response('{}', { status: 409 }));
  t.synchro.demarrer();
  await t.synchro.envoyerMaintenant();
  expect(t.synchro.etat()).toBe('divergence');
  window.dispatchEvent(new Event('online'));
  await t.avancer(0);
  expect(t.synchro.etat()).toBe('inactif');
  expect(t.fetch.mock.calls.filter(([, o]) => o?.method === 'PUT')).toHaveLength(1);
});

it('conserve le local hors ligne puis reprend le serveur', async () => {
  const t = preparer(); const v = versions(t);
  t.fetch.mockRejectedValue(new Error('Réseau'));
  expect(await t.synchro.ouvrir()).toBe('hors-ligne');
  t.modifier();
  const avant = t.contenu();
  expect(await t.synchro.resoudre()).toBe('echec');
  expect(t.contenu()).toEqual(avant);
  v.repondre();
  expect(await t.synchro.resoudre()).toBe('charge');
  expect(t.g.chargerPartie(t.p.id)).toEqual(v.serveur.partie);
});

it.each(['ok', 'réponse', 'exception'])('archive avant toute installation : %s', async cause => {
  const t = preparer(); const { serveur } = versions(t);
  const avant = t.contenu();
  const repondre = t.fetch.getMockImplementation()!;
  t.fetch.mockImplementation(async (url, options) => {
    if (options?.method === 'POST') {
      expect(t.contenu()).toEqual(avant);
      if (cause === 'exception') throw new Error('réseau');
      return new Response('{}', { status: cause === 'réponse' ? 503 : 200 });
    }
    return repondre(url, options);
  });
  expect(await t.synchro.ouvrir()).toBe(cause === 'ok' ? 'charge' : 'hors-ligne');
  if (cause === 'ok') {
    expect(t.g.chargerPartie(t.p.id)).toEqual(serveur.partie);
    expect(t.g.chargerCompte()).toEqual(serveur.compte);
    expect(t.g.chargerRegion(t.p.id, 'kanto')).toEqual(serveur.regions[0]);
    expect(t.fetch.mock.calls.filter(([, o]) => o?.method === 'POST')).toHaveLength(2);
  } else {
    expect(t.contenu()).toEqual(avant);
    expect(t.synchro.etat()).toBe('divergence');
    await t.synchro.envoyerMaintenant({ fermeture: true });
    expect(t.fetch.mock.calls.filter(([, o]) => o?.method === 'PUT')).toHaveLength(0);
  }
});

it('ignore une autre partie serveur et conserve toutes les régions et la mémoire locales', async () => {
  const t = preparer();
  const { serveur, memoire } = versions(t);
  serveur.partie.id = 'autre';
  const region = t.g.chargerRegion(t.p.id, 'kanto')!;
  t.g.ecrireRegion(t.p.id, 'johto', { ...region.donnees, regionId: 'johto' });
  t.stockage.ecrire('pokiclicker:synchro', JSON.stringify(memoire));
  const synchro = creerSynchro(t.options);
  const avant = t.contenu();
  expect(await synchro.ouvrir()).toBe('rien');
  expect(synchro.suppression()).toBeNull();
  expect(t.contenu()).toEqual(avant);
  expect(JSON.parse(t.stockage.lire('pokiclicker:synchro')!)).toEqual(memoire);
  expect(t.fetch).toHaveBeenCalledTimes(1);
});

it('archive aussi une région locale absente du serveur quand la partie est la même', async () => {
  const t = preparer();
  const { memoire } = versions(t);
  memoire.parties[t.p.id] = { local: 0, serveur: 19 };
  const region = t.g.chargerRegion(t.p.id, 'kanto')!;
  t.g.ecrireRegion(t.p.id, 'johto', { ...region.donnees, regionId: 'johto' });
  t.stockage.ecrire('pokiclicker:synchro', JSON.stringify(memoire));
  const synchro = creerSynchro(t.options);
  expect(await synchro.ouvrir()).toBe('charge');
  const archives = t.fetch.mock.calls.filter(([url]) => String(url).endsWith('/archives'));
  expect(archives).toHaveLength(1);
  expect(JSON.parse(archives[0]![1]!.body as string).regions).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'johto' })]));
  expect(t.g.chargerRegion(t.p.id, 'johto')).toBeNull();
});

it("envoie la partie courante avec la base connue quand le serveur liste une autre partie", async () => {
  const t = preparer();
  const { serveur, memoire } = versions(t);
  serveur.partie.id = 'autre';
  memoire.parties[t.p.id] = { local: 1, serveur: 3 };
  t.stockage.ecrire('pokiclicker:synchro', JSON.stringify(memoire));
  const synchro = creerSynchro(t.options);
  expect(await synchro.ouvrir()).toBe('rien');
  t.modifier();
  await synchro.envoyerMaintenant();
  expect(t.corps()).toMatchObject({ partieId: t.p.id, regions: [{ revisionBase: 30 }] });
});

it('relit le serveur à chaque résolution', async () => {
  const t = preparer(); const { serveur } = versions(t);
  await t.synchro.ouvrir();
  const avant = t.contenu();
  t.fetch.mockRejectedValueOnce(new Error('Réseau'));
  expect(await t.synchro.resoudre()).toBe('echec');
  expect(t.contenu()).toEqual(avant);
  serveur.partie.revision++;
  expect(await t.synchro.resoudre()).toBe('charge');
  expect(t.g.chargerPartie(t.p.id)?.revision).toBe(21);
});

it('demande la mise à jour du jeu quand le serveur exige un appareil, sans rien renvoyer ensuite', async () => {
  const t = preparer(); versions(t);
  const quandMiseAJourRequise = vi.fn();
  const synchro = creerSynchro({ ...t.options, quandMiseAJourRequise });
  t.fetch.mockResolvedValueOnce(new Response('{"message":"Mets à jour le jeu.","code":"appareil-requis"}', { status: 400 }));
  await synchro.envoyerMaintenant();
  expect(quandMiseAJourRequise).toHaveBeenCalledTimes(1);
  expect(synchro.etat()).toBe('refuse');
  await synchro.envoyerMaintenant();
  expect(t.fetch.mock.calls.filter(([, o]) => o?.method === 'PUT')).toHaveLength(1);
});

it('un 400 ordinaire ne demande pas de mise à jour', async () => {
  const t = preparer(); versions(t);
  const quandMiseAJourRequise = vi.fn();
  const synchro = creerSynchro({ ...t.options, quandMiseAJourRequise });
  t.fetch.mockResolvedValueOnce(new Response('{"message":"Sauvegarde invalide."}', { status: 400 }));
  await synchro.envoyerMaintenant();
  expect(quandMiseAJourRequise).not.toHaveBeenCalled();
  expect(synchro.etat()).toBe('refuse');
});

it('bloque un appareil dépossédé jusqu’à sa reprise', async () => {
  const t = preparer(); versions(t);
  let pause = false;
  const quandAilleurs = vi.fn(() => { pause = true; });
  const synchro = creerSynchro({ ...t.options, appareilId: () => 'appareil', quandAilleurs, enPause: () => pause });
  t.fetch.mockResolvedValueOnce(new Response('{"code":"ailleurs"}', { status: 409 }));
  await synchro.envoyerMaintenant();
  expect(t.corps().appareilId).toBe('appareil');
  expect(synchro.etat()).toBe('ailleurs');
  expect(synchro.enAttente()).toBe(false);
  await synchro.ouvrir();
  await synchro.envoyerMaintenant({ fermeture: true });
  expect(quandAilleurs).toHaveBeenCalledTimes(1);
  expect(t.fetch).toHaveBeenCalledTimes(1);
  pause = false;
  await synchro.ouvrir();
  t.modifier();
  expect(synchro.enAttente()).toBe(true);
  await synchro.envoyerMaintenant({ fermeture: true });
  expect(synchro.enAttente()).toBe(false);
  expect(t.fetch.mock.calls.filter(([, o]) => o?.method === 'PUT')).toHaveLength(2);
  t.g.ecrireCompte(compteInitial());
  await synchro.envoyerMaintenant({ fermeture: true });
  expect(t.corps()).not.toHaveProperty('appareilId');
});
it('liste les résumés serveur et les parties locales non envoyées par date', async () => {
  const t = preparer();
  const { serveur } = versions(t);
  serveur.partie.id = 'distante';
  serveur.partie.ecritLe = '2030-01-01T00:00:00.000Z';
  t.g.choisirPartie(t.p.id);
  t.g.ecrirePartie(t.p.id, { ...t.p.donnees, statistiques: { ...t.p.donnees.statistiques, tempsJeuMs: 456 } });
  const resultat = await t.synchro.lister();
  expect(resultat.horsConnexion).toBe(false);
  expect(resultat.parties).toEqual([
    { id: 'distante', nom: 'Test', regionCourante: 'kanto', zoneId: serveur.regions[0]!.donnees.zoneId,
      tempsJeuMs: 123, ecritLe: serveur.partie.ecritLe, surServeur: true, courante: false, ailleurs: false },
    { id: t.p.id, nom: 'Test', regionCourante: 'kanto', zoneId: t.g.chargerRegion(t.p.id, 'kanto')!.donnees.zoneId,
      tempsJeuMs: 456, ecritLe: t.p.ecritLe, surServeur: false, courante: true, ailleurs: false },
  ]);
  serveur.partie.id = t.p.id;
  expect((await t.synchro.lister()).parties).toHaveLength(1);
});

it.each(['réseau', 'liste', 'champ'])('liste le local hors connexion si %s invalide', async cause => {
  const t = preparer();
  if (cause === 'réseau') t.fetch.mockRejectedValue(new Error('Réseau'));
  else t.fetch.mockResolvedValue(new Response(JSON.stringify(cause === 'liste' ? {} : { parties: [{ id: 123 }] })));
  const resultat = await t.synchro.lister();
  expect(resultat.horsConnexion).toBe(true);
  expect(resultat.parties).toHaveLength(1);
  expect(resultat.parties[0]).toMatchObject({ id: t.p.id, surServeur: false, courante: true });
});

it('tolère les champs de résumé absents et remplace leurs types invalides', async () => {
  const t = preparer();
  t.fetch.mockImplementation(async () => new Response(JSON.stringify({ parties: [
    { id: 'a', nom: 'A', revision: 1, ecritLe: t.p.ecritLe },
    { id: 'b', nom: 'B', revision: 1, ecritLe: t.p.ecritLe, regionCourante: 4, zoneId: false, tempsJeuMs: '4' },
  ] })));
  const resultat = await t.synchro.lister();
  expect(resultat.horsConnexion).toBe(false);
  for (const p of resultat.parties.filter(p => p.surServeur)) {
    expect(p).toMatchObject({ regionCourante: '', zoneId: '', tempsJeuMs: null });
  }
});

it('ouvre une partie locale avec le pointeur seul sans requête de détail', async () => {
  const t = preparer();
  const autre = creerGestionnaire({ ...t.options, genererId: () => 'autre' }).creerPartie('Autre');
  t.g.choisirPartie(t.p.id);
  await t.synchro.envoyerMaintenant();
  t.fetch.mockClear();
  const avant = t.contenu();
  expect(await t.synchro.ouvrirPartie(autre.id)).toBe('ok');
  expect(t.g.partieCourante()).toBe(autre.id);
  expect(t.contenu()).toEqual({ ...avant, 'pokiclicker:courante': autre.id });
  expect(t.fetch).not.toHaveBeenCalled();
});

it('lit et envoie la courante même si une autre partie est plus récente', async () => {
  const t = preparer();
  const { serveur, memoire } = versions(t);
  t.g.choisirPartie(t.p.id);
  t.horloge.avancer(1000);
  creerGestionnaire({ ...t.options, genererId: () => 'recente' }).creerPartie('Récente');
  t.stockage.ecrire('pokiclicker:synchro', JSON.stringify(memoire));
  const synchro = creerSynchro(t.options);
  t.fetch.mockImplementationOnce(async () => new Response(JSON.stringify({ parties: [
    { id: 'recente', nom: 'Récente', revision: 5, ecritLe: '2030-01-01T00:00:00.000Z' },
    { id: t.p.id, nom: 'Test', revision: 20, ecritLe: serveur.partie.ecritLe },
  ] })));
  serveur.partie.revision++;
  expect(await synchro.ouvrir()).toBe('charge');
  expect(t.fetch.mock.calls.some(([url]) => String(url).endsWith(`/parties/${t.p.id}`))).toBe(true);
  expect(t.fetch.mock.calls.some(([url]) => String(url).endsWith('/parties/recente'))).toBe(false);
  t.g.ecrirePartie(t.p.id, { ...serveur.partie.donnees, nom: 'Courante' });
  await synchro.envoyerMaintenant();
  expect(t.corps().partieId).toBe(t.p.id);
});

it.each([false, true])('ouvre une partie distante sans altérer le compte (réseau en échec : %s)', async echec => {
  const t = preparer();
  t.g.ecrireCompte({ ...compteInitial(), diamants: 42, succes: ['test'], skins: ['test'] });
  const { serveur } = versions(t);
  serveur.partie.id = 'distante';
  t.g.choisirPartie(t.p.id);
  await t.synchro.envoyerMaintenant();
  const avant = t.contenu();
  const compte = t.g.chargerCompte()!.donnees;
  if (echec) t.fetch.mockRejectedValue(new Error('Réseau'));
  expect(await t.synchro.ouvrirPartie('distante')).toBe(echec ? 'echec' : 'ok');
  expect(t.g.chargerCompte()!.donnees).toEqual(compte);
  if (echec) expect(t.contenu()).toEqual(avant);
  else {
    expect(t.g.partieCourante()).toBe('distante');
    expect(t.g.chargerPartie('distante')).toEqual(serveur.partie);
    const memoire = JSON.parse(t.stockage.lire('pokiclicker:synchro')!);
    expect(memoire.parties.distante).toEqual({ serveur: 20, local: 20 });
    expect(memoire.regions['distante:kanto']).toEqual({ serveur: 30, local: 30 });
  }
});

it('garde un compte local non envoyé quand on ouvre une partie distante et que l’envoi échoue', async () => {
  const t = preparer();
  const { serveur } = versions(t);
  serveur.partie.id = 'distante';
  t.g.choisirPartie(t.p.id);
  await t.synchro.envoyerMaintenant();
  t.g.ecrireCompte({ ...compteInitial(), diamants: 99, succes: ['local'], skins: ['local'] });
  const compte = t.g.chargerCompte()!;
  const memoire = JSON.parse(t.stockage.lire('pokiclicker:synchro')!).compte;
  const lecture = t.fetch.getMockImplementation()!;
  t.fetch.mockImplementation(async (url, options) => {
    if (options?.method === 'PUT') throw new Error('Réseau');
    return lecture(url, options);
  });
  expect(await t.synchro.ouvrirPartie('distante')).toBe('ok');
  expect(t.g.chargerCompte()).toEqual(compte);
  expect(JSON.parse(t.stockage.lire('pokiclicker:synchro')!).compte).toEqual(memoire);
});

it('envoie la partie quittée avant de créer une nouvelle partie', async () => {
  const t = preparer();
  await t.synchro.envoyerMaintenant();
  t.modifier();
  const ordre: string[] = [];
  t.fetch.mockImplementation(async (url, options) => {
    ordre.push(`${options?.method ?? 'GET'} ${t.g.partieCourante() === t.p.id ? 'ancienne' : 'nouvelle'}`);
    return new Response(JSON.stringify(options?.method === 'PUT'
      ? { compte: { revision: 10 }, partie: { id: t.g.partieCourante(), revision: 21 }, regions: [{ id: 'kanto', revision: 31 }] }
      : { parties: [] }));
  });
  expect(await t.synchro.creerPartie('Suivante', { equipe: [], drapeaux: [] })).toBe('ok');
  expect(ordre.indexOf('PUT ancienne')).toBeGreaterThanOrEqual(0);
  expect(ordre.indexOf('PUT ancienne')).toBeLessThan(ordre.indexOf('PUT nouvelle'));
});

it('ne dit pas « supprimée » quand le serveur refuse pour une partie connue du serveur mais absente en local', async () => {
  const t = preparer();
  t.fetch.mockResolvedValue(new Response('{}', { status: 500 }));
  expect(await t.synchro.supprimerPartie('distante')).toBe('echec');
});

it('valide le nom et le plafond avant de créer puis envoie la nouvelle partie', async () => {
  const t = preparer();
  for (const nom of ['', '  ', 'a'.repeat(101)]) expect(await t.synchro.creerPartie(nom, { equipe: [], drapeaux: [] })).toBe('nom-invalide');
  expect(t.fetch).not.toHaveBeenCalled();
  const v = versions(t);
  t.fetch.mockResolvedValueOnce(new Response(JSON.stringify({ parties: Array.from({ length: 20 }, (_, i) => ({
    id: i === 0 ? t.p.id : `p-${i}`, nom: 'P', revision: 1, ecritLe: t.p.ecritLe,
  })) })));
  expect(await t.synchro.creerPartie('P', { equipe: [], drapeaux: [] })).toBe('plein');
  v.repondre();
  expect(await t.synchro.creerPartie('  Nouvelle  ', { equipe: [], drapeaux: ['nouvelle-partie'] })).toBe('ok');
  const id = t.g.partieCourante()!;
  expect(id).not.toBe(t.p.id);
  expect(t.g.chargerPartie(id)!.donnees.nom).toBe('Nouvelle');
  expect(t.g.chargerRegion(id, 'kanto')!.donnees.drapeaux).toEqual(['nouvelle-partie']);
  expect(t.corps().partieId).toBe(id);
  expect(await t.synchro.creerPartie('Encore', { equipe: [], drapeaux: [] })).toBe('ok');
  expect(t.g.partieCourante()).not.toBe(id);
});

it('garde une nouvelle partie locale si le réseau est indisponible', async () => {
  const t = preparer();
  t.fetch.mockRejectedValue(new Error('Réseau'));
  expect(await t.synchro.creerPartie('Hors ligne', { equipe: [], drapeaux: [] })).toBe('ok');
  expect(t.g.chargerPartie(t.g.partieCourante()!)!.donnees.nom).toBe('Hors ligne');
});

it.each([200, 404, 503, 0])('supprime une partie envoyée seulement après succès serveur (%s)', async status => {
  const t = preparer();
  await t.synchro.envoyerMaintenant();
  const autre = creerGestionnaire({ ...t.options, genererId: () => 'autre' }).creerPartie('Autre');
  t.g.choisirPartie(t.p.id);
  const avant = t.contenu();
  const memoireAvant = t.stockage.lire('pokiclicker:synchro');
  t.fetch.mockImplementation(async (url, options) => {
    expect(options?.method).toBe('DELETE');
    expect(String(url)).toContain(`/parties/${t.p.id}`);
    expect(t.contenu()).toEqual(avant);
    if (!status) throw new Error('Réseau');
    return new Response('{}', { status });
  });
  const succes = status === 200 || status === 404;
  expect(await t.synchro.supprimerPartie(t.p.id)).toBe(succes ? 'ok' : 'echec');
  expect(t.g.chargerPartie(autre.id)).toEqual(autre);
  if (succes) {
    expect(t.g.chargerPartie(t.p.id)).toBeNull();
    expect(t.g.chargerRegion(t.p.id, 'kanto')).toBeNull();
    expect(t.stockage.lire('pokiclicker:courante')).toBeNull();
    const memoire = JSON.parse(t.stockage.lire('pokiclicker:synchro')!);
    expect(memoire.parties[t.p.id]).toBeUndefined();
    expect(memoire.regions[`${t.p.id}:kanto`]).toBeUndefined();
  } else {
    expect(t.contenu()).toEqual(avant);
    expect(t.stockage.lire('pokiclicker:synchro')).toBe(memoireAvant);
  }
});

it.each([true, false])('suspend les envois pendant la suppression et reprend après échec (%s)', async succes => {
  const t = preparer();
  await t.synchro.envoyerMaintenant();
  let terminer!: (r: Response) => void;
  t.fetch.mockImplementationOnce(() => new Promise(resolve => { terminer = resolve; }));
  const suppression = t.synchro.supprimerPartie(t.p.id);
  t.modifier();
  await t.synchro.envoyerMaintenant({ fermeture: true });
  expect(t.fetch.mock.calls.filter(([, o]) => o?.method === 'PUT')).toHaveLength(1);
  terminer(new Response('{}', { status: succes ? 200 : 503 }));
  expect(await suppression).toBe(succes ? 'ok' : 'echec');
  await t.synchro.envoyerMaintenant({ fermeture: true });
  expect(t.fetch.mock.calls.filter(([, o]) => o?.method === 'PUT')).toHaveLength(succes ? 1 : 2);
});

it('supprime localement une partie jamais envoyée même hors connexion', async () => {
  const t = preparer();
  t.fetch.mockRejectedValue(new Error('Réseau'));
  expect(await t.synchro.supprimerPartie(t.p.id)).toBe('ok');
  expect(t.g.chargerPartie(t.p.id)).toBeNull();
});

it.each([409, 404])('attend le choix après suppression ailleurs (%s), puis recrée toutes les régions', async status => {
  const t = preparer();
  await t.synchro.envoyerMaintenant();
  t.modifier();
  for (const regionId of ['johto', 'hoenn']) t.g.ecrireRegion(t.p.id, regionId, { ...t.g.chargerRegion(t.p.id, 'kanto')!.donnees, regionId });
  t.fetch.mockResolvedValueOnce(new Response(JSON.stringify({ conflits: [
    { niveau: 'partie', id: t.p.id, revisionServeur: 0 },
  ] }), { status }));
  const avant = t.contenu();
  await t.synchro.envoyerMaintenant({ fermeture: true });
  expect(t.synchro.suppression()?.id).toBe(t.p.id);
  t.synchro.demarrer();
  await t.avancer(90_000);
  await t.synchro.envoyerMaintenant({ fermeture: true });
  expect(t.fetch.mock.calls.filter(([, o]) => o?.method === 'PUT')).toHaveLength(2);
  t.fetch.mockResolvedValueOnce(new Response(JSON.stringify({ partie: { id: t.p.id, revision: 1 },
    regions: ['kanto', 'johto', 'hoenn'].map(id => ({ id, revision: 1 })) })));
  expect(await t.synchro.resoudreSuppression('garder')).toBe('ok');
  expect(t.fetch.mock.calls.filter(([, o]) => o?.method === 'PUT')).toHaveLength(3);
  expect(t.corps().partie.revisionBase).toBe(0);
  expect(t.corps().regions.map((r: { revisionBase: number; enveloppe: { id: string } }) => [r.enveloppe.id, r.revisionBase]).sort()).toEqual([['hoenn', 0], ['johto', 0], ['kanto', 0]]);
  const memoire = JSON.parse(t.stockage.lire('pokiclicker:synchro')!);
  for (const id of ['kanto', 'johto', 'hoenn']) expect(memoire.regions[`${t.p.id}:${id}`]).toEqual({ serveur: 1, local: t.g.chargerRegion(t.p.id, id)!.revision });
  expect(t.synchro.etat()).toBe('ok');
  expect(t.synchro.suppression()).toBeNull();
  expect(t.contenu()).toEqual(avant);
});

it('envoie toutes les régions d’une partie neuve après le choix local', async () => {
  const t = preparer(); versions(t);
  await t.synchro.ouvrir();
  const nouvelle = creerGestionnaire({ ...t.options, genererId: () => 'nouvelle' }).creerPartie('Nouvelle');
  t.g.choisirPartie(nouvelle.id);
  for (const regionId of ['johto', 'hoenn']) t.g.ecrireRegion(nouvelle.id, regionId, { ...t.g.chargerRegion(nouvelle.id, 'kanto')!.donnees, regionId });
  await t.synchro.envoyerMaintenant({ fermeture: true });
  expect(t.corps().partie.revisionBase).toBe(0);
  expect(t.corps().regions).toHaveLength(3);
});

it('abandonne la partie supprimée sans nouvel envoi', async () => {
  const t = preparer();
  await t.synchro.envoyerMaintenant();
  t.modifier();
  t.fetch.mockImplementation(async (_, options) => new Response(JSON.stringify(options?.method === 'PUT'
    ? { conflits: [{ niveau: 'partie', id: t.p.id, revisionServeur: 0 }] } : { parties: [] }),
  { status: options?.method === 'PUT' ? 409 : 200 }));
  await t.synchro.envoyerMaintenant({ fermeture: true });
  expect(t.fetch.mock.calls.filter(([, o]) => o?.method === 'PUT')).toHaveLength(2);
  expect(t.synchro.etat()).toBe('divergence');
  expect(await t.synchro.resoudreSuppression('abandonner')).toBe('ok');
  expect(t.g.chargerPartie(t.p.id)).toBeNull();
  expect(t.g.chargerRegion(t.p.id, 'kanto')).toBeNull();
  expect(JSON.parse(t.stockage.lire('pokiclicker:synchro')!).parties[t.p.id]).toBeUndefined();
  await t.synchro.envoyerMaintenant({ fermeture: true });
  expect(t.fetch.mock.calls).toHaveLength(2);
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
  expect(t.synchro.etat()).toBe(statut === 409 ? 'divergence' : 'refuse');
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
