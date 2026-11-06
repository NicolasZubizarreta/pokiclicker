import { test as base, expect } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';

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
  const etat = { parties: [] as Partie[], suppressions: [] as string[], inscriptions: 0, oublis: [] as string[], tokens: [] as string[] };
  await context.route('http://api.test/**', async route => {
    const requete = route.request();
    const chemin = new URL(requete.url()).pathname;
    const methode = requete.method();
    const headers = { 'access-control-allow-origin': 'http://localhost:4175',
      'access-control-allow-headers': 'authorization,content-type', 'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
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
    if (chemin === '/api/sauvegarde/parties') return repondre({ parties: etat.parties });
    if (chemin.endsWith('/appareil')) return repondre({ actif: true });
    if (chemin.startsWith('/api/sauvegarde/parties/') && methode === 'DELETE') {
      const id = decodeURIComponent(chemin.split('/').at(-1)!);
      etat.suppressions.push(id); etat.parties = etat.parties.filter(p => p.id !== id);
      return repondre({});
    }
    if (chemin === '/api/sauvegarde' && methode === 'PUT') {
      const corps = requete.postDataJSON();
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
  await page.getByRole('button', { name: /Menu principal/ }).click();
  await expect(page.getByRole('navigation', { name: 'Zone compte' }).getByRole('button', { name: 'Parties', exact: true })).toHaveAttribute('aria-current', 'page');
  await page.getByRole('article', { name: 'Test', exact: true }).getByRole('button', { name: 'Continuer Test' }).click();
  await expect(page.getByRole('navigation', { name: 'Zone compte' })).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Navigation principale' })).toBeVisible();
  await page.getByRole('button', { name: 'Combat', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
});
