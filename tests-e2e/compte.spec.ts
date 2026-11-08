import { test as base, expect } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';
import type { Enveloppe, DonneesCompte, DonneesPartie, DonneesRegion } from '../src/core/sauvegarde-types';

type Version = { compte: Enveloppe<DonneesCompte>; partie: Enveloppe<DonneesPartie>; regions: Enveloppe<DonneesRegion>[] };
type Partie = { id: string; nom: string; revision: number; ecritLe: string; regionCourante: string };
const test = base.extend<{ serveur: Awaited<ReturnType<typeof brancherFauxServeur>> }>({
  serveur: async ({ context, page }, use) => {
    const erreurs: string[] = [];
    page.on('pageerror', erreur => erreurs.push(erreur.message));
    await use(await brancherFauxServeur(context));
    expect(erreurs, 'Erreurs JavaScript pendant le parcours').toEqual([]);
  },
});

async function brancherFauxServeur(context: BrowserContext) {
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

async function installerSession(context: BrowserContext) {
  await context.addInitScript(() => {
    if (sessionStorage.getItem('graine')) return;
    sessionStorage.setItem('graine', '1');
    localStorage.setItem('pokiclicker.session', 'session-test');
    localStorage.setItem('pokiclicker-dev:equipe-de-depart', '1');
  });
}

async function remplir(page: Page, password = 'abcdefghij') {
  await page.getByLabel('E-mail', { exact: true }).fill('joueur@exemple.fr');
  await page.getByLabel('Mot de passe', { exact: true }).fill(password);
}

async function creerPartie(page: Page, context: BrowserContext) {
  await installerSession(context);
  await page.goto('/');
  await page.getByLabel('Nom de la partie').fill('Test');
  await page.getByRole('button', { name: 'Créer la partie', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
}

async function menuPrincipal(page: Page) {
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('button', { name: /Menu principal/ }).first().click();
}

test('Reprise ici sans choix : la version serveur remplace la partie locale', async ({ page, context, serveur }) => {
  await creerPartie(page, context);
  serveur.version = await page.evaluate(() => {
    const enveloppes = Object.entries(localStorage).filter(([cle]) => /^pokiclicker:(compte|partie|region):/.test(cle))
      .map(([, valeur]) => JSON.parse(valeur));
    return { compte: enveloppes.find(e => e.niveau === 'compte'), partie: enveloppes.find(e => e.niveau === 'partie'),
      regions: enveloppes.filter(e => e.niveau === 'region') };
  });
  serveur.version.partie.revision += 100;
  serveur.version.partie.donnees.nom = 'Voyage serveur';
  serveur.ailleurs = true;
  serveur.puts = [];
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('deux-versions-vues')) sessionStorage.setItem('deux-versions-vues', 'non');
    new MutationObserver(() => {
      if (document.body?.textContent?.includes('Deux versions')) sessionStorage.setItem('deux-versions-vues', 'oui');
    }).observe(document, { childList: true, subtree: true, characterData: true });
  });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Partie ouverte ailleurs', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Attaquer / })).toHaveCount(0);
  expect(serveur.puts).toEqual([]);
  await page.getByRole('button', { name: 'Reprendre ici', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  expect(serveur.reprises).toBe(1);
  expect(await page.evaluate(() => sessionStorage.getItem('deux-versions-vues'))).toBe('non');
  await expect(page.getByText(/Deux versions/)).toHaveCount(0);
  expect(await page.evaluate(id => JSON.parse(localStorage.getItem(`pokiclicker:partie:${id}`)!).donnees.nom, serveur.version.partie.id)).toBe('Voyage serveur');
  expect(await page.evaluate(() => localStorage.getItem('pokiclicker.session'))).toBe('session-test');
  await menuPrincipal(page);
  await expect(page.getByRole('article', { name: 'Voyage serveur', exact: true })).toBeVisible();
});

test('Partie reprise ailleurs : arrêt des envois et accès aux parties sans retour au jeu', async ({ page, context, serveur }) => {
  await page.clock.install();
  await creerPartie(page, context);
  serveur.ailleurs = true;
  await page.clock.runFor(60_000);
  await expect(page.getByRole('alert')).toContainText('Partie reprise ailleurs');
  serveur.puts = [];
  const stockage = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage).filter(([cle]) => cle.startsWith('pokiclicker:partie:'))));
  expect(Object.keys(stockage)).toHaveLength(1);
  await page.clock.runFor(120_000);
  expect(serveur.puts).toEqual([]);
  expect(await page.evaluate(() => Object.fromEntries(Object.entries(localStorage).filter(([cle]) => cle.startsWith('pokiclicker:partie:'))))).toEqual(stockage);
  expect(await page.evaluate(() => localStorage.getItem('pokiclicker.session'))).toBe('session-test');
  await page.getByRole('button', { name: 'Voir mes parties', exact: true }).click();
  await expect(page.getByRole('navigation', { name: 'Zone compte' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Retour au jeu/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Continuer / })).toHaveCount(0);
});

test('Déconnexion : envoi en échec, rester connecté puis envoi réussi', async ({ page, context, serveur }) => {
  await creerPartie(page, context);
  serveur.refusPut = true;
  serveur.puts = [];
  await page.getByRole('button', { name: /^(Auto-attaque|Attaque auto)$/ }).click();
  await menuPrincipal(page);
  await page.getByRole('navigation', { name: 'Zone compte' }).getByRole('button', { name: 'Compte', exact: true }).click();
  await page.getByRole('button', { name: 'Se déconnecter', exact: true }).click();
  await page.getByRole('dialog', { name: 'Se déconnecter ?' }).getByRole('button', { name: 'Sauvegarder et se déconnecter', exact: true }).click();
  const echec = page.getByRole('alertdialog');
  await expect(echec).toContainText("La sauvegarde n'a pas abouti");
  await expect(echec.getByRole('button')).toHaveText(['Réessayer', 'Rester connecté']);
  await expect(page.getByRole('button', { name: 'Se déconnecter quand même', exact: true })).toHaveCount(0);
  expect(serveur.puts.length).toBeGreaterThan(0);
  expect(serveur.puts).toEqual(expect.arrayContaining([expect.objectContaining({ appareilId: expect.any(String) })]));
  expect(await page.evaluate(() => localStorage.getItem('pokiclicker.session'))).toBe('session-test');
  expect(await page.evaluate(() => Object.keys(localStorage).some(cle => cle.startsWith('pokiclicker:partie:')))).toBe(true);
  await echec.getByRole('button', { name: 'Rester connecté', exact: true }).click();
  await expect(echec).toHaveCount(0);
  serveur.refusPut = false;
  serveur.puts = [];
  let terminerEnvoi!: () => void;
  const envoi = new Promise<void>(resolve => { terminerEnvoi = resolve; });
  await page.route('http://api.test/api/sauvegarde', async route => {
    if (route.request().method() === 'PUT') await envoi;
    await route.fallback();
  });
  await page.getByRole('button', { name: 'Se déconnecter', exact: true }).click();
  await page.getByRole('button', { name: 'Sauvegarder et se déconnecter', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Sauvegarde en cours…');
  terminerEnvoi();
  await expect(page.getByRole('heading', { name: 'Connexion', exact: true })).toBeVisible();
  expect(serveur.puts.length).toBeGreaterThan(0);
  expect(await page.evaluate(() => localStorage.getItem('pokiclicker.session'))).toBeNull();
});

async function ouvrirZone(page: Page, context: BrowserContext, serveur: Awaited<ReturnType<typeof brancherFauxServeur>>) {
  serveur.parties = ['Voyage', 'Autre'].map((nom, i) => ({ id: `p${i}`, nom, revision: 1, ecritLe: '2026-11-04T12:00:00Z', regionCourante: 'kanto' }));
  await installerSession(context);
  await page.goto('/');
  await expect(page.getByRole('article')).toHaveCount(2);
}

test('Connexion : champs vides signalés près du champ', async ({ page, serveur }) => {
  void serveur;
  await page.goto('/');
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  const champ = page.getByLabel('E-mail', { exact: true });
  await expect(champ).toHaveAttribute('aria-invalid', 'true');
  await expect(champ).toHaveAccessibleDescription(await page.getByRole('alert').innerText());
});

test('Connexion : mauvais mot de passe puis connexion réussie', async ({ page, serveur }) => {
  void serveur;
  await page.goto('/'); await remplir(page, 'incorrect');
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('E-mail ou mot de passe incorrect.');
  await expect(page.getByLabel('Mot de passe', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  await remplir(page);
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Crée ta première partie' })).toBeVisible();
});

test('Inscription : création du compte réussie', async ({ page, serveur }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Créer un compte', exact: true }).click();
  await remplir(page); await page.getByRole('button', { name: 'Créer mon compte' }).click();
  await expect(page.getByRole('heading', { name: 'Crée ta première partie' })).toBeVisible();
  expect(serveur.inscriptions).toBe(1);
  expect(await page.evaluate(() => localStorage.getItem('pokiclicker.session'))).toBe('session-test');
});

test('Oubli du mot de passe : lien envoyé', async ({ page, serveur }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Mot de passe oublié', exact: true }).click();
  await page.getByLabel('E-mail').fill('joueur@exemple.fr');
  await page.getByRole('button', { name: 'Envoyer le lien' }).click();
  await expect(page.getByRole('status')).toHaveText('Si ce compte existe, un lien a été envoyé.');
  expect(serveur.oublis).toEqual(['joueur@exemple.fr']);
});

test('Nouveau mot de passe : jeton du lien de réinitialisation', async ({ page, serveur }) => {
  await page.goto('/?token=jeton-reinitialisation');
  await page.getByRole('textbox', { name: 'Nouveau mot de passe', exact: true }).fill('nouveaumotdepasse');
  await page.getByRole('button', { name: 'Enregistrer le mot de passe' }).click();
  await expect(page.getByRole('status')).toHaveText('Mot de passe modifié. Connecte-toi.');
  await expect(page.getByRole('heading', { name: 'Connexion', exact: true })).toBeVisible();
  expect(serveur.tokens).toEqual(['jeton-reinitialisation']);
});

test('Clavier ouvert : champ visible et connexion cliquable après défilement', async ({ page, serveur }) => {
  void serveur;
  await page.setViewportSize({ width: 390, height: 420 }); await page.goto('/'); await remplir(page);
  const champ = page.getByLabel('Mot de passe', { exact: true }); await champ.focus();
  await expect(champ).toBeInViewport();
  const bouton = page.getByRole('button', { name: 'Se connecter', exact: true });
  await bouton.scrollIntoViewIfNeeded(); await expect(bouton).toBeInViewport(); await bouton.click();
  await expect(page.getByRole('heading', { name: 'Crée ta première partie' })).toBeVisible();
});

test('Zone compte : navigation, focus, cibles tactiles et largeurs sans débordement', async ({ page, context, serveur }, info) => {
  await ouvrirZone(page, context, serveur);
  const nav = page.getByRole('navigation', { name: 'Zone compte' });
  await expect(nav.getByRole('button')).toHaveText(['Parties', 'Compte', 'Réglages']);
  for (const width of info.project.name === 'telephone' ? [360, 390, 430] : [1440]) {
    await page.setViewportSize({ width, height: info.project.name === 'telephone' ? 844 : 900 });
    for (const [onglet, titre] of [['Compte', 'Mon compte'], ['Réglages', 'Réglages'], ['Parties', 'Mes parties']]) {
      await nav.getByRole('button', { name: onglet, exact: true }).click();
      await expect(nav.getByRole('button', { name: onglet, exact: true })).toHaveAttribute('aria-current', 'page');
      await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
      await expect(page.getByRole('heading', { level: 1, name: titre, exact: true })).toBeFocused();
      for (const bouton of await nav.getByRole('button').all()) expect((await bouton.boundingBox())!.height).toBeGreaterThanOrEqual(48);
      if (onglet === 'Parties') for (const bouton of await page.getByRole('button', { name: /^(Jouer|Supprimer) / }).all()) {
        expect((await bouton.boundingBox())!.height).toBeGreaterThanOrEqual(48);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${onglet}, ${width}px`).toBe(true);
    }
  }
});

test('Création : nom vide refusé puis partie créée sur le serveur', async ({ page, context, serveur }) => {
  await ouvrirZone(page, context, serveur);
  await page.getByRole('button', { name: 'Nouvelle partie', exact: true }).click();
  await page.getByRole('button', { name: 'Créer la partie', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Donne un nom à ta partie.');
  await expect(page.getByLabel('Nom de la partie')).toHaveAttribute('aria-invalid', 'true');
  expect(serveur.parties).toHaveLength(2);
  await page.getByLabel('Nom de la partie').fill('Nouvelle aventure');
  await page.getByRole('button', { name: 'Créer la partie', exact: true }).click();
  await expect.poll(() => serveur.parties.some(p => p.nom === 'Nouvelle aventure')).toBe(true);
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
});

test('Suppression : annulation, Échap, retour du focus puis confirmation réelle', async ({ page, context, serveur }) => {
  await ouvrirZone(page, context, serveur);
  const bouton = page.getByRole('button', { name: 'Supprimer Autre', exact: true });
  const dialogue = page.getByRole('dialog');
  for (const annuler of ['bouton', 'clavier']) {
    await bouton.click(); await expect(dialogue).toBeVisible();
    await expect(dialogue).toHaveAttribute('aria-modal', 'true');
    expect(await dialogue.evaluate(d => d.matches(':modal'))).toBe(true);
    if (annuler === 'bouton') await dialogue.getByRole('button', { name: 'Annuler' }).click();
    else await page.keyboard.press('Escape');
    await expect(dialogue).toHaveCount(0); await expect(bouton).toBeFocused();
    expect(serveur.suppressions).toEqual([]);
  }
  await bouton.click(); await dialogue.getByRole('button', { name: 'Oui, supprimer' }).click();
  await expect(page.getByRole('article', { name: 'Autre', exact: true })).toHaveCount(0);
  expect(serveur.suppressions).toEqual(['p1']); expect(serveur.parties.map(p => p.nom)).toEqual(['Voyage']);
});

test('Déconnexion : retour à Connexion et session retirée', async ({ page, context, serveur }) => {
  await ouvrirZone(page, context, serveur);
  await page.getByRole('navigation', { name: 'Zone compte' }).getByRole('button', { name: 'Compte', exact: true }).click();
  await page.getByRole('button', { name: 'Se déconnecter', exact: true }).click();
  const dialogue = page.getByRole('dialog', { name: 'Se déconnecter ?', exact: true });
  await expect(dialogue).toBeVisible();
  await dialogue.getByRole('button', { name: 'Se déconnecter', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Connexion', exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('pokiclicker.session'))).toBeNull();
});

test('Menu principal : onglet Parties puis Continuer ramène au jeu', async ({ page, context, serveur }) => {
  void serveur;
  await installerSession(context); await page.goto('/');
  await page.getByLabel('Nom de la partie').fill('Test');
  await page.getByRole('button', { name: 'Créer la partie', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('button', { name: /Menu principal/ }).first().click();
  await expect(page.getByRole('navigation', { name: 'Zone compte' }).getByRole('button', { name: 'Parties', exact: true })).toHaveAttribute('aria-current', 'page');
  await page.getByRole('article', { name: 'Test', exact: true }).getByRole('button', { name: 'Continuer Test' }).click();
  await expect(page.getByRole('navigation', { name: 'Zone compte' })).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Navigation principale' })).toBeVisible();
  await page.getByRole('button', { name: 'Combat', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
});

test('Renommer : crayon, nom vide refusé, nom enregistré sur le serveur', async ({ page, context, serveur }) => {
  await creerPartie(page, context);
  await menuPrincipal(page);
  const crayon = page.getByRole('button', { name: 'Renommer Test', exact: true });
  expect((await crayon.boundingBox())!.height).toBeGreaterThanOrEqual(48);
  await crayon.click();
  await page.getByLabel('Nom de la partie').fill('   ');
  await page.getByRole('button', { name: 'Valider', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Donne un nom');
  expect(serveur.renommages).toEqual([]);
  await page.getByLabel('Nom de la partie').fill('Voyage à Johto');
  await page.getByRole('button', { name: 'Valider', exact: true }).click();
  await expect(page.getByRole('article', { name: 'Voyage à Johto', exact: true })).toBeVisible();
  expect(serveur.renommages).toHaveLength(1);
  expect(serveur.renommages[0]?.nom).toBe('Voyage à Johto');
  await expect(page.getByRole('button', { name: 'Renommer Voyage à Johto', exact: true })).toBeFocused();
});

test('Ouverte ailleurs : repère affiché sur la carte puis disparu après la reprise', async ({ page, context, serveur }) => {
  await creerPartie(page, context);
  serveur.parties.push({ id: 'autre-partie', nom: 'Sur le téléphone', revision: 1, ecritLe: '2026-11-04T12:00:00Z', regionCourante: 'kanto' });
  serveur.ouvertesAilleurs = ['autre-partie'];
  await menuPrincipal(page);
  const carte = page.getByRole('article', { name: 'Sur le téléphone', exact: true });
  await expect(carte.getByText('Ouverte ailleurs', { exact: true })).toBeVisible();
  await expect(page.getByRole('article', { name: 'Test', exact: true }).getByText('Ouverte ailleurs')).toHaveCount(0);
  expect(serveur.listesDemandees.at(-1)).toBeTruthy();
  serveur.ouvertesAilleurs = [];
  await page.reload();
  await menuPrincipal(page);
  await expect(page.getByRole('article', { name: 'Sur le téléphone', exact: true })).toBeVisible();
  await expect(page.getByText('Ouverte ailleurs')).toHaveCount(0);
});

test('Restauration : liste des versions, confirmation explicite puis restauration', async ({ page, context, serveur }) => {
  serveur.versionsArchivees = [{ lot: '6f2d9a40-0000-4000-8000-000000000001', origine: 'divergence', remplaceLe: '2026-11-05T09:30:00.000Z',
    ecritLe: '2026-11-05T09:00:00.000Z', tempsJeuMs: 5_400_000, regionCourante: 'kanto', zoneId: 'route-1', niveauEquipe: 12 }];
  await creerPartie(page, context);
  await menuPrincipal(page);
  await page.getByRole('button', { name: 'Restaurer une sauvegarde précédente de Test', exact: true }).click();
  const dialogue = page.getByRole('dialog');
  await expect(dialogue).toContainText("Niveau de l'équipe");
  await expect(dialogue).toContainText('12');
  await dialogue.getByRole('button', { name: /^Restaurer cette version/ }).click();
  await expect(dialogue).toContainText('Cela remplace la sauvegarde actuelle');
  await expect(dialogue).toContainText("rien n'est perdu");
  expect(serveur.restaurations).toEqual([]);
  await dialogue.getByRole('button', { name: 'Retour', exact: true }).click();
  await dialogue.getByRole('button', { name: /^Restaurer cette version/ }).click();
  await dialogue.getByRole('button', { name: 'Oui, restaurer', exact: true }).click();
  await expect.poll(() => serveur.restaurations.length).toBe(1);
  expect(serveur.restaurations[0]).toMatchObject({ lot: '6f2d9a40-0000-4000-8000-000000000001' });
  expect((serveur.restaurations[0] as { appareilId: string }).appareilId).toBeTruthy();
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
});

test('Restauration : sauvegarde disparue entre-temps', async ({ page, context, serveur }) => {
  serveur.versionsArchivees = [{ lot: '6f2d9a40-0000-4000-8000-000000000002', origine: 'restauration', remplaceLe: '2026-11-05T09:30:00.000Z',
    ecritLe: '2026-11-05T09:00:00.000Z', tempsJeuMs: null, regionCourante: 'kanto', zoneId: '', niveauEquipe: null }];
  serveur.restauration = 404;
  await creerPartie(page, context);
  await menuPrincipal(page);
  await page.getByRole('button', { name: 'Restaurer une sauvegarde précédente de Test', exact: true }).click();
  const dialogue = page.getByRole('dialog');
  await dialogue.getByRole('button', { name: /^Restaurer cette version/ }).click();
  await dialogue.getByRole('button', { name: 'Oui, restaurer', exact: true }).click();
  await expect(dialogue.getByRole('alert')).toContainText("n'existe plus");
});
