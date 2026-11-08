import { expect } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';
import type { Enveloppe, DonneesCompte, DonneesPartie, DonneesRegion } from '../src/core/sauvegarde-types';
type Version = { compte: Enveloppe<DonneesCompte>; partie: Enveloppe<DonneesPartie>; regions: Enveloppe<DonneesRegion>[] };
type Partie = { id: string; nom: string; revision: number; ecritLe: string; regionCourante: string };
export async function brancherFauxServeur(context: BrowserContext) {
  const etat = { parties: [] as Partie[], suppressions: [] as string[], inscriptions: 0, oublis: [] as string[], tokens: [] as string[],
    ailleurs: false, refusPut: false, puts: [] as unknown[], version: null as Version | null, reprises: 0, archives: [] as unknown[],
    renommages: [] as { id: string; nom: string }[], ouvertesAilleurs: [] as string[], listesDemandees: [] as (string | null)[],
    versionsArchivees: [] as unknown[], restaurations: [] as unknown[], restauration: 200 };
  await context.route('http://api.test/**', async route => {
    const requete = route.request();
    const chemin = new URL(requete.url()).pathname;
    const methode = requete.method();
    const headers = { 'access-control-allow-origin': 'http://localhost:4175',
      'access-control-allow-headers': 'authorization,content-type', 'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'access-control-expose-headers': 'set-auth-token' };
    const repondre = (json: unknown, status = 200, jeton = false) => route.fulfill({ status, json,
      headers: { ...headers, ...(jeton ? { 'set-auth-token': 'session-test' } : {}) } });
    if (methode === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (chemin === '/api/auth/get-session') return repondre({ session: { id: 's' } });
    if (chemin === '/api/auth/sign-in/email') {
      const corps = requete.postDataJSON();
      return corps.email === 'joueur@exemple.fr' && corps.password === 'abcdefghij'
        ? repondre({}, 200, true) : repondre({ code: 'INVALID_EMAIL_OR_PASSWORD' }, 401);
    }
    if (chemin === '/api/auth/sign-up/email') { etat.inscriptions++; return repondre({}, 200, true); }
    if (chemin === '/api/auth/sign-out') return repondre({});
    if (chemin === '/api/auth/request-password-reset') { etat.oublis.push(requete.postDataJSON().email); return repondre({}); }
    if (chemin === '/api/auth/reset-password') { etat.tokens.push(requete.postDataJSON().token); return repondre({}); }
    if (chemin === '/api/sauvegarde/parties') {
      const appareilId = new URL(requete.url()).searchParams.get('appareilId');
      etat.listesDemandees.push(appareilId);
      const liste = etat.version ? [{ ...etat.version.partie,
        nom: etat.version.partie.donnees.nom, regionCourante: etat.version.partie.donnees.regionCourante }] : etat.parties;
      return repondre({ parties: liste.map(p => appareilId ? { ...p, appareilActif: etat.ouvertesAilleurs.includes(p.id) ? 'autre' : null } : p) });
    }
    if (methode === 'PATCH' && /^\/api\/sauvegarde\/parties\/[^/]+$/.test(chemin)) {
      const id = decodeURIComponent(chemin.split('/').at(-1)!);
      const { nom } = requete.postDataJSON();
      etat.renommages.push({ id, nom });
      etat.parties = etat.parties.map(p => p.id === id ? { ...p, nom } : p);
      return repondre({ ok: true });
    }
    if (methode === 'GET' && /\/parties\/[^/]+\/versions$/.test(chemin)) return repondre({ versions: etat.versionsArchivees });
    if (methode === 'POST' && chemin.endsWith('/restaurer')) {
      etat.restaurations.push(requete.postDataJSON());
      return repondre(etat.restauration === 200 ? { ok: true, partie: { id: 'x', revision: 1 } } : { message: 'Sauvegarde introuvable.' }, etat.restauration);
    }
    if (chemin.endsWith('/appareil') && methode === 'POST') {
      if (requete.postDataJSON().reprendre === true) { etat.reprises++; etat.ailleurs = false; }
      return repondre({ actif: !etat.ailleurs });
    }
    if (chemin.endsWith('/versions') && methode === 'POST') { etat.archives.push(requete.postDataJSON()); return repondre({}); }
    if (methode === 'POST' && /\/parties\/[^/]+\/archives$/.test(chemin)) { etat.archives.push(requete.postDataJSON()); return repondre({ ok: true, lot: 'lot-test' }); }
    if (methode === 'GET' && etat.version) {
      if (chemin === '/api/sauvegarde/compte') return etat.version.compte ? repondre({ enveloppe: etat.version.compte }) : repondre({}, 404);
      if (chemin === `/api/sauvegarde/parties/${etat.version.partie.id}`) return repondre({ partie: etat.version.partie, regions: etat.version.regions });
    }
    if (chemin.startsWith('/api/sauvegarde/parties/') && methode === 'DELETE') {
      const id = decodeURIComponent(chemin.split('/').at(-1)!);
      etat.suppressions.push(id); etat.parties = etat.parties.filter(p => p.id !== id);
      return repondre({});
    }
    if (chemin === '/api/sauvegarde' && methode === 'PUT') {
      const corps = requete.postDataJSON();
      etat.puts.push(corps);
      if (etat.refusPut) return repondre({}, 503);
      if (corps.partie) {
        const p = corps.partie.enveloppe;
        etat.parties = etat.parties.filter(partie => partie.id !== p.id);
        etat.parties.push({ id: p.id, nom: p.donnees.nom, revision: p.revision, ecritLe: p.ecritLe, regionCourante: p.donnees.regionCourante });
      }
      return repondre({ compte: corps.compte && { revision: corps.compte.enveloppe.revision },
        partie: corps.partie && { id: corps.partie.enveloppe.id, revision: corps.partie.enveloppe.revision },
        regions: corps.regions?.map((r: { enveloppe: { id: string; revision: number } }) => ({ id: r.enveloppe.id, revision: r.enveloppe.revision })) });
    }
    return repondre({}, 404);
  });
  return etat;
}

export async function installerSession(context: BrowserContext) {
  await context.addInitScript(() => {
    if (sessionStorage.getItem('graine')) return;
    sessionStorage.setItem('graine', '1');
    localStorage.setItem('pokiclicker.session', 'session-test');
    localStorage.setItem('pokiclicker-dev:equipe-de-depart', '1');
  });
}

export async function remplir(page: Page, password = 'abcdefghij') {
  await page.getByLabel('E-mail', { exact: true }).fill('joueur@exemple.fr');
  await page.getByLabel('Mot de passe', { exact: true }).fill(password);
}

export async function creerPartie(page: Page, context: BrowserContext) {
  await installerSession(context);
  await page.goto('/');
  await page.getByLabel('Nom de la partie').fill('Test');
  await page.getByRole('button', { name: 'Créer la partie', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
}

export async function menuPrincipal(page: Page) {
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('button', { name: /Menu principal/ }).first().click();
}


