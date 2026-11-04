import { randomUUID } from 'node:crypto';
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
  const synchro = creerSynchro({ ...options, delaiMiniMs: 0 });
  const appareil = creerAppareilActif(options);
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
  return { stockage, horloge, gestionnaire, synchro, appareil, region, jouer, lireServeur,
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

async function provoquerConflit() {
  const t = await synchroniser();
  t.a.jouer(120, 'kanto.route-1', 1);
  t.b.jouer(240, 'kanto.route-2', 4);
  await t.a.synchro.envoyerMaintenant();
  expect(t.a.synchro.etat()).toBe('ok');
  await t.b.synchro.envoyerMaintenant();
  expect(t.b.synchro.etat()).toBe('conflit');
  expect(t.b.synchro.choix()).not.toBeNull();
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

it('permet de reprendre la partie sur un autre appareil actif', async () => {
  const { a, b } = await synchroniser();
  expect(await a.appareil.ouvrir()).toBe('libre');
  expect(await b.appareil.ouvrir()).toBe('ailleurs');
  expect(await b.appareil.reprendre()).toBe('ok');
  expect(b.appareil.ailleurs()).toBe(false);
  expect(await a.appareil.ouvrir()).toBe('ailleurs');
  expect(a.appareil.ailleurs()).toBe(true);
});

it('résout un conflit en gardant cet appareil et archive la version écrasée', async () => {
  const { a, b, id } = await provoquerConflit();
  const ecrasee = a.region();
  expect(await b.synchro.trancher('local')).toBe('ok');
  expect(b.synchro.etat()).toBe('ok');
  expect(b.synchro.choix()).toBeNull();
  await verifierServeur(b, id, b.region());
  const archives = await s.pool.query<{ donnees: DonneesRegion }>(
    "SELECT donnees FROM versions WHERE niveau = 'region' AND objet_id = $1",
    [`${id}:kanto`],
  );
  expect(archives.rows.map(ligne => ligne.donnees)).toContainEqual(ecrasee);
});

it('résout un conflit en récupérant la progression de l’autre appareil', async () => {
  const { a, b, id } = await provoquerConflit();
  expect(await b.synchro.trancher('serveur')).toBe('ok');
  expect(b.synchro.choix()).toBeNull();
  expect(b.region()).toEqual(a.region());
  await verifierServeur(b, id, a.region());
});

it('envoie le dernier état local après une coupure réseau', async () => {
  const { a, id } = await synchroniser();
  a.couper(true);
  a.jouer(100, 'kanto.route-1', 1);
  await a.synchro.envoyerMaintenant();
  expect(a.synchro.etat()).toBe('hors-ligne');
  expect(a.synchro.choix()).toBeNull();
  const avantDernier = a.region();
  a.jouer(500, 'kanto.route-2', 4);
  a.couper(false);
  a.horloge.avancer(60_000);
  await a.synchro.envoyerMaintenant();
  expect(a.synchro.etat()).toBe('ok');
  expect(a.synchro.choix()).toBeNull();
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
