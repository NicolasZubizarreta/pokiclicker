import { test, expect } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';

const API = 'http://api.test';

// Faux serveur : session valide, aucune partie en ligne, cet appareil est l'appareil actif.
async function brancherFauxServeur(context: BrowserContext) {
  await context.route(`${API}/**`, async route => {
    const requete = route.request();
    const cors = { 'access-control-allow-origin': 'http://localhost:4174', 'access-control-allow-headers': 'authorization,content-type',
      'access-control-allow-methods': 'GET,POST,PUT,OPTIONS', 'access-control-expose-headers': 'set-auth-token' };
    if (requete.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const chemin = new URL(requete.url()).pathname;
    if (chemin === '/api/auth/get-session') return route.fulfill({ json: { session: { id: 's' } }, headers: cors });
    if (chemin === '/api/sauvegarde/parties') return route.fulfill({ json: { parties: [] }, headers: cors });
    if (chemin.endsWith('/appareil')) return route.fulfill({ json: { actif: true }, headers: cors });
    return route.fulfill({ status: 404, json: {}, headers: cors });
  });
}

// Session déjà stockée (appareil connecté une première fois), puis première partie créée par l'écran, comme un joueur.
async function installerAppareilConnecte(page: Page, context: BrowserContext) {
  await context.addInitScript(() => {
    if (localStorage.getItem('pokiclicker.session') || sessionStorage.getItem('graine')) return;
    sessionStorage.setItem('graine', '1');
    localStorage.setItem('pokiclicker.session', 'jeton-stocke');
    localStorage.setItem('pokiclicker-dev:equipe-de-depart', '1');
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Crée ta première partie' })).toBeVisible();
  await page.getByLabel('Nom de la partie').fill('Test');
  await page.getByRole('button', { name: 'Créer la partie' }).click();
}

async function attendreHorsConnexionPret(page: Page) {
  await expect.poll(() => page.evaluate(async () => (await navigator.serviceWorker.ready).active?.state)).toBe('activated');
  // Le toast « prêt hors connexion » disparaît après 6 s : on attend plutôt la fin du précache.
  await expect.poll(() => page.evaluate(async () => {
    const nom = (await caches.keys()).find(n => n.includes('precache'));
    return nom ? (await (await caches.open(nom)).keys()).length : 0;
  })).toBeGreaterThan(5);
}

test('appareil connecté : la dernière partie locale s’ouvre à froid sans réseau', async ({ page, context }, informations) => {
  const erreurs: string[] = [];
  page.on('pageerror', erreur => erreurs.push(erreur.message));
  await brancherFauxServeur(context);
  await installerAppareilConnecte(page, context);
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await attendreHorsConnexionPret(page);
  try {
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByText('Vérification de la sauvegarde…')).toHaveCount(0);
    await page.screenshot({ path: informations.outputPath('hors-connexion-jeu.png'), animations: 'disabled' });
    expect(erreurs).toEqual([]);
  } finally { await context.setOffline(false); }
});

test('appareil jamais connecté : un message demande de se connecter une première fois', async ({ page, context }, informations) => {
  await brancherFauxServeur(context);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();
  await attendreHorsConnexionPret(page);
  try {
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('status').filter({ hasText: 'Connecte-toi une première fois' })).toBeVisible();
    await page.screenshot({ path: informations.outputPath('hors-connexion-jamais-connecte.png'), animations: 'disabled' });
  } finally { await context.setOffline(false); }
});
