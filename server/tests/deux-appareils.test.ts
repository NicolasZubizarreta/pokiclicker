import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { creerHorlogeSimulee } from '../../src/core/clock';
import { compteInitial, creerGestionnaire, creerStockageMemoire, type DonneesRegion } from '../../src/core/sauvegarde';
import { creerAppareilActif } from '../../src/ui/appareil';
import { creerSynchro } from '../../src/ui/synchro';
import { support } from './support.js';

const s = support();

function creerAppareil(token: string, ip: string) {
  const stockage = creerStockageMemoire();
  const horloge = creerHorlogeSimulee();
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: randomUUID });
  let coupure = false;
  const fetch: typeof globalThis.fetch = async (entree, init) => {
    if (coupure) throw new TypeError('réseau coupé');
    const headers = new Headers(init?.headers);
    headers.set('origin', s.origin);
    headers.set('x-forwarded-for', ip);
    return s.runtime.app.request(String(entree), { ...init, headers });
  };
  const options = { stockage, horloge, fetch, jeton: () => token, urlApi: 'http://localhost:3000' };
  const appareil = creerAppareilActif(options);
  const synchro = creerSynchro({ ...options, delaiMiniMs: 0,
    appareilId: () => appareil.id(), quandAilleurs: () => appareil.signalerAilleurs() });
  const region = () => {
    const id = gestionnaire.partieCourante();
    if (!id) throw new Error('Aucune partie courante');
    const region = gestionnaire.chargerRegion(id, 'kanto');
    if (!region) throw new Error('Région absente');
    return region.donnees;
  };
  function jouer(argent: number, zoneId: string, numero: number) {
    const id = gestionnaire.partieCourante();
    if (!id) throw new Error('Aucune partie courante');
    horloge.avancer(1000);
    gestionnaire.ecrireRegion(id, 'kanto', {
      ...region(), argent, zoneId,
      equipe: [{ uid: randomUUID(), numero, niveau: 5, xp: 0, shiny: false,
        bonheur: 0, pierreEternelle: false, calcium: 0, sexe: 'male', favori: false }],
    });
  }
  async function lireServeur(id: string) {
    return fetch(`http://localhost:3000/api/sauvegarde/parties/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  return { stockage, horloge, gestionnaire, synchro, appareil, region, jouer, lireServeur, fetch, token,
    couper: (valeur: boolean) => { coupure = valeur; } };
}

async function preparer() {
  const { token } = await s.signup();
  const a = creerAppareil(token, '192.0.2.101');
  const b = creerAppareil(token, '192.0.2.102');
  a.gestionnaire.ecrireCompte(compteInitial());
  const partie = a.gestionnaire.creerPartie('Aventure commune');
  a.gestionnaire.choisirPartie(partie.id);
  return { a, b, id: partie.id };
}

async function synchroniser() {
  const t = await preparer();
  await t.a.synchro.envoyerMaintenant();
  expect(t.a.synchro.etat()).toBe('ok');
  expect(await t.b.synchro.ouvrir()).toBe('charge');
  return t;
}

async function verifierServeur(a: ReturnType<typeof creerAppareil>, id: string, attendue: DonneesRegion) {
  const reponse = await a.lireServeur(id);
  expect(reponse.status).toBe(200);
  expect(await reponse.json()).toMatchObject({ regions: [{ id: 'kanto', donnees: attendue }] });
}

it('transmet une progression identique au deuxième appareil', async () => {
  const { a, b } = await preparer();
  a.jouer(350, 'kanto.route-1', 7);
  expect(b.stockage.cles()).not.toContain('pokiclicker:compte');
  await a.synchro.envoyerMaintenant();
  expect(a.synchro.etat()).toBe('ok');
  expect(await b.synchro.ouvrir()).toBe('charge');
  expect(b.gestionnaire.partieCourante()).toBe(a.gestionnaire.partieCourante());
  expect(b.region()).toEqual(a.region());
});

it('retrouve sur le deuxième appareil les diamants, succès et skins du compte', async () => {
  const { a, b } = await preparer();
  a.gestionnaire.ecrireCompte({ ...compteInitial(), diamants: 15, succes: ['premiers-pas'], skins: ['rouge'] });
  await a.synchro.envoyerMaintenant();
  expect(a.synchro.etat()).toBe('ok');
  expect(await b.synchro.ouvrir()).toBe('charge');
  expect(b.gestionnaire.chargerCompte()?.donnees).toMatchObject({ diamants: 15, succes: ['premiers-pas'], skins: ['rouge'] });
});

it('permet de reprendre la partie sur un autre appareil actif', async () => {
  const { a, b } = await synchroniser();
  expect(await a.appareil.ouvrir()).toBe('libre');
  expect(await b.appareil.ouvrir()).toBe('ailleurs');
  expect(await b.appareil.reprendre()).toBe('ok');
  expect(b.appareil.ailleurs()).toBe(false);
  expect(await a.appareil.ouvrir()).toBe('ailleurs');
  expect(a.appareil.ailleurs()).toBe(true);
});

it('reprend exactement la sauvegarde sur le deuxième appareil', async () => {
  const { a, b, id } = await synchroniser();
  a.jouer(350, 'kanto.route-1', 7);
  const premier = a.region().equipe[0];
  if (!premier) throw new Error('Équipe absente');
  const cartes = ['C', 'D', 'S', 'H'].flatMap(couleur =>
    ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'].map(rang => `${rang}-${couleur}`));
  a.gestionnaire.ecrireRegion(id, 'kanto', {
    ...a.region(),
    equipe: [premier, { ...premier, uid: randomUUID(), numero: 4 }],
    evenementEnCours: { id: 'x', etape: 2, file: ['a', 'b'] },
    blackjackEnCours: { mise: 10, paquet: cartes.slice(4), joueur: cartes.slice(0, 2), croupier: cartes.slice(2, 4) },
    chronos: { finRepousse: 1200, finSuperRepousse: 2400, finBoostAttaque: 3600,
      finBoostAttaqueSpeciale: 4800, rechargeFauchage: 6000 },
  });
  a.gestionnaire.ecrireCompte({ ...compteInitial(), diamants: 15, succes: ['premiers-pas'], skins: ['rouge'] });
  expect(await a.appareil.ouvrir()).toBe('libre');
  await a.synchro.envoyerMaintenant();
  expect(a.synchro.etat()).toBe('ok');
  expect(await b.appareil.ouvrir()).toBe('ailleurs');
  expect(await b.appareil.reprendre()).toBe('ok');
  expect(await b.synchro.ouvrir()).toBe('charge');
  expect(b.region()).toEqual(a.region());
  expect(b.gestionnaire.chargerPartie(id)?.donnees).toEqual(a.gestionnaire.chargerPartie(id)?.donnees);
  expect(b.gestionnaire.chargerCompte()?.donnees).toEqual(a.gestionnaire.chargerCompte()?.donnees);
});

it('bloque les envois de l’appareil dépossédé sans modifier le serveur', async () => {
  const { a, b, id } = await synchroniser();
  expect(await a.appareil.ouvrir()).toBe('libre');
  expect(await b.appareil.ouvrir()).toBe('ailleurs');
  expect(await b.appareil.reprendre()).toBe('ok');
  const avant = await (await a.lireServeur(id)).json();
  a.jouer(900, 'kanto.route-2', 1);
  await a.synchro.envoyerMaintenant();
  expect(a.synchro.etat()).toBe('ailleurs');
  expect(a.appareil.ailleurs()).toBe(true);
  expect(await (await a.lireServeur(id)).json()).toEqual(avant);
  await a.synchro.envoyerMaintenant();
  expect(a.synchro.etat()).toBe('ailleurs');
  expect(await (await a.lireServeur(id)).json()).toEqual(avant);
});

it('archive la divergence hors ligne puis installe la sauvegarde serveur', async () => {
  const { a, b, id } = await synchroniser();
  expect(await a.appareil.ouvrir()).toBe('libre');
  expect(await b.appareil.ouvrir()).toBe('ailleurs');
  b.couper(true);
  b.jouer(240, 'kanto.route-2', 4);
  const locale = b.region();
  a.jouer(120, 'kanto.route-1', 1);
  await a.synchro.envoyerMaintenant();
  expect(a.synchro.etat()).toBe('ok');
  const avant = await (await a.lireServeur(id)).json();
  b.couper(false);
  expect(await b.appareil.reprendre()).toBe('ok');
  expect(await b.synchro.ouvrir()).toBe('charge');
  expect(b.region()).toEqual(a.region());
  expect(b.gestionnaire.chargerPartie(id)?.donnees).toEqual(a.gestionnaire.chargerPartie(id)?.donnees);
  expect(b.gestionnaire.chargerCompte()?.donnees).toEqual(a.gestionnaire.chargerCompte()?.donnees);
  const archives = await s.pool.query<{ donnees: DonneesRegion }>(
    "SELECT donnees FROM versions WHERE niveau = 'region' AND objet_id = $1",
    [`${id}:kanto`],
  );
  expect(archives.rows.map(ligne => ligne.donnees)).toContainEqual(locale);
  expect(b.synchro.lireAvis()).toEqual(expect.stringMatching(/\S/));
  expect(b.synchro.lireAvis()).toBeNull();
  expect(await (await a.lireServeur(id)).json()).toEqual(avant);
  await verifierServeur(b, id, a.region());
});

it('accepte un ancien client sans appareilId pour une nouvelle partie', async () => {
  const { a, b } = await synchroniser();
  expect(await a.appareil.ouvrir()).toBe('libre');
  const partie = b.gestionnaire.creerPartie('Ancien client');
  // Ce cas prouve la compatibilité sur une autre partie, pas sur la partie active.
  const reponse = await b.fetch('http://localhost:3000/api/sauvegarde', {
    method: 'PUT', headers: { Authorization: `Bearer ${b.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ partieId: partie.id,
      partie: { revisionBase: 0, enveloppe: partie },
      regions: [{ revisionBase: 0, enveloppe: b.gestionnaire.chargerRegion(partie.id, 'kanto') }] }),
  });
  expect(reponse.status).toBe(200);
});

it('migre côté client une partie et une région au format v1', async () => {
  const { a, b, id } = await preparer();
  const fixture = (nom: string) => JSON.parse(readFileSync(new URL(
    `../../src/core/migrations/__fixtures__/${nom}-v1.json`, import.meta.url), 'utf8'));
  const partie = { ...fixture('partie'), id };
  partie.donnees.regionsDebloquees = ['kanto'];
  const region = fixture('region');
  // La fixture de migration contient volontairement un champ inconnu, refusé au chargement.
  delete region.donnees.futur;
  // Les enveloppes restent en v1 : les migrations sont attendues au chargement client.
  const reponse = await a.fetch('http://localhost:3000/api/sauvegarde', {
    method: 'PUT', headers: { Authorization: `Bearer ${a.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ appareilId: a.appareil.id(), partieId: id,
      compte: { revisionBase: 0, enveloppe: a.gestionnaire.chargerCompte() },
      partie: { revisionBase: 0, enveloppe: partie }, regions: [{ revisionBase: 0, enveloppe: region }] }),
  });
  expect(reponse.status).toBe(200);
  expect(await b.synchro.ouvrir()).toBe('charge');
  const chargee = b.gestionnaire.chargerPartie(id);
  const chargeeRegion = b.gestionnaire.chargerRegion(id, 'kanto');
  expect(chargee?.version).toBe(a.gestionnaire.chargerPartie(id)?.version);
  expect(chargeeRegion?.version).toBe(a.gestionnaire.chargerRegion(id, 'kanto')?.version);
  expect(chargee?.version).toBeGreaterThan(1);
  expect(chargeeRegion?.version).toBeGreaterThan(1);
  expect(chargee?.donnees.pcGlobal[0]).toMatchObject({ sexe: expect.any(String), favori: false });
  expect(chargeeRegion?.donnees.equipe[0]).toMatchObject({ sexe: expect.any(String), favori: false });
  expect(chargeeRegion?.donnees).toMatchObject({
    pc: [], ameliorations: [], jalonsRecus: [], starterId: null, jetons: 0,
    chronos: a.region().chronos,
    pension: { parents: [], oeufs: [], emplacementsOeuf: 1 },
  });
});

it('envoie le dernier état local après une coupure réseau', async () => {
  const { a, id } = await synchroniser();
  a.couper(true);
  a.jouer(100, 'kanto.route-1', 1);
  await a.synchro.envoyerMaintenant();
  expect(a.synchro.etat()).toBe('hors-ligne');
  const avantDernier = a.region();
  a.jouer(500, 'kanto.route-2', 4);
  a.couper(false);
  a.horloge.avancer(60_000);
  await a.synchro.envoyerMaintenant();
  expect(a.synchro.etat()).toBe('ok');
  expect(a.region()).not.toEqual(avantDernier);
  await verifierServeur(a, id, a.region());
});

it('supprime une partie pour les deux appareils et conserve les autres parties', async () => {
  const { a, b, id } = await synchroniser();
  const autre = a.gestionnaire.creerPartie('Autre aventure');
  a.gestionnaire.choisirPartie(autre.id);
  await a.synchro.envoyerMaintenant();
  expect(a.synchro.etat()).toBe('ok');
  expect(await a.synchro.supprimerPartie(id)).toBe('ok');
  expect((await b.lireServeur(id)).status).toBe(404);
  expect((await b.lireServeur(autre.id)).status).toBe(200);
  const liste = await b.synchro.lister();
  expect(liste.horsConnexion).toBe(false);
  expect(liste.parties.filter(p => p.surServeur).map(p => p.id)).toEqual([autre.id]);
});
