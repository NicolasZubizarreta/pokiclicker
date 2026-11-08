import { expect, type Page } from '@playwright/test';
import { test as base, verifierEtat } from './aide-etats-pc';
import { brancherFauxServeur, installerSession, creerPartie, menuPrincipal } from './aide-compte';

const test = base.extend<{ serveur: Awaited<ReturnType<typeof brancherFauxServeur>> }>({
  serveur: async ({ context }, utiliser) => { await utiliser(await brancherFauxServeur(context)); },
});

test.beforeEach(async ({ page }, info) => {
  test.skip(info.project.name !== 'bureau', 'États du compte : projet bureau seulement');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  await page.clock.pauseAt(new Date());
});

async function monCompte(page: Page) {
  await menuPrincipal(page);
  await page.getByRole('navigation', { name: 'Zone compte' }).getByRole('button', { name: 'Compte', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Mon compte', exact: true })).toBeVisible();
}

async function memoriserVersion(page: Page, serveur: Awaited<ReturnType<typeof brancherFauxServeur>>) {
  serveur.version = await page.evaluate(() => {
    const enveloppes = Object.entries(localStorage).filter(([cle]) => /^pokiclicker:(compte|partie|region):/.test(cle)).map(([, valeur]) => JSON.parse(valeur));
    return { compte: enveloppes.find(e => e.niveau === 'compte'), partie: enveloppes.find(e => e.niveau === 'partie'), regions: enveloppes.filter(e => e.niveau === 'region') };
  });
}

// La réponse reste retenue jusqu'à la fin des quatre captures, puis est réellement envoyée.
async function retarder(page: Page, url: string, methode = 'GET') {
  let liberer!: () => void;
  const attente = new Promise<void>(resolve => { liberer = resolve; });
  await page.route(url, async route => {
    if (route.request().method() === methode) await attente;
    await route.fallback();
  });
  return liberer;
}

test('États PC : mauvais mot de passe (c-connexion-erreur)', async ({ page, serveur }) => {
  void serveur;
  await page.goto('/');
  await page.getByLabel('E-mail', { exact: true }).fill('joueur@exemple.fr');
  await page.getByLabel('Mot de passe', { exact: true }).fill('incorrect');
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('E-mail ou mot de passe incorrect.');
  await verifierEtat(page, 'c-connexion-erreur');
});

test('États PC : session expirée (c-connexion-session)', async ({ page, context, serveur }) => {
  void serveur;
  await installerSession(context);
  await page.route('http://api.test/api/auth/get-session', async route => {
    if (route.request().method() === 'OPTIONS') return route.fallback();
    await route.fulfill({ json: { session: null }, headers: { 'access-control-allow-origin': '*' } });
  });
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveText('Ta session a expiré. Reconnecte-toi : ta partie sur cet appareil est conservée.');
  await verifierEtat(page, 'c-connexion-session');
});

test('États PC : aucune partie (c-parties-vide)', async ({ page, context, serveur }) => {
  void serveur; await installerSession(context); await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Crée ta première partie', exact: true })).toBeVisible();
  await verifierEtat(page, 'c-parties-vide');
});

test('États PC : liste indisponible après une liste servie (c-parties-hors-ligne)', async ({ page, context, serveur }) => {
  await creerPartie(page, context); await menuPrincipal(page);
  await expect(page.getByRole('article', { name: 'Test', exact: true })).toBeVisible();
  expect(serveur.listesDemandees.length).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Continuer Test', exact: true }).click();
  await page.route('http://api.test/api/sauvegarde/parties?*', route => route.abort());
  await menuPrincipal(page);
  await expect(page.getByRole('status').filter({ hasText: 'Hors connexion : tu vois seulement les parties de cet appareil.' })).toBeVisible();
  await verifierEtat(page, 'c-parties-hors-ligne');
});

for (const confirmer of [false, true]) {
  const id = confirmer ? 'c-restaurer-confirmer' : 'c-restaurer';
  test(`États PC : restauration${confirmer ? ', confirmation' : ', liste'} (${id})`, async ({ page, context, serveur }) => {
    serveur.versionsArchivees = [{ lot: '6f2d9a40-0000-4000-8000-000000000001', origine: 'divergence', remplaceLe: '2026-11-05T09:30:00.000Z', ecritLe: '2026-11-05T09:00:00.000Z', tempsJeuMs: 5_400_000, regionCourante: 'kanto', zoneId: 'route-1', niveauEquipe: 12 }];
    await creerPartie(page, context); await menuPrincipal(page);
    await page.getByRole('button', { name: 'Restaurer une sauvegarde précédente de Test', exact: true }).click();
    const dialogue = page.getByRole('dialog');
    await expect(dialogue).toContainText("Niveau de l'équipe");
    if (confirmer) {
      await dialogue.getByRole('button', { name: /^Restaurer cette version/ }).click();
      await expect(dialogue).toContainText('Cela remplace la sauvegarde actuelle');
    }
    await verifierEtat(page, id);
  });
}

test('États PC : partie ouverte ailleurs (c-ailleurs)', async ({ page, context, serveur }) => {
  await creerPartie(page, context); await memoriserVersion(page, serveur);
  serveur.ailleurs = true; await page.reload();
  await expect(page.getByRole('heading', { name: 'Partie ouverte ailleurs', exact: true })).toBeVisible();
  await verifierEtat(page, 'c-ailleurs');
});

test('États PC : partie reprise ailleurs (c-reprise-ailleurs)', async ({ page, context, serveur }) => {
  await creerPartie(page, context); serveur.ailleurs = true;
  await page.clock.runFor(60_000);
  await expect(page.getByRole('alert')).toContainText('Partie reprise ailleurs');
  await verifierEtat(page, 'c-reprise-ailleurs');
});

test('États PC : partie supprimée ailleurs (c-supprimee)', async ({ page, context, serveur }) => {
  await creerPartie(page, context);
  await expect.poll(() => serveur.puts.length).toBeGreaterThan(0);
  await memoriserVersion(page, serveur);
  const id = serveur.version!.partie.id;
  await page.route('http://api.test/api/sauvegarde', async route => {
    if (route.request().method() !== 'PUT') return route.fallback();
    await route.fulfill({ status: 409, json: { conflits: [{ niveau: 'partie', id, revisionServeur: 0 }] }, headers: { 'access-control-allow-origin': '*' } });
  });
  await page.getByRole('button', { name: /^(Auto-attaque|Attaque auto)$/ }).click();
  await page.clock.runFor(45_000);
  await expect(page.getByRole('heading', { name: 'Partie supprimée ailleurs', exact: true })).toBeVisible();
  await verifierEtat(page, 'c-supprimee');
});

for (const echec of [false, true]) {
  const id = echec ? 'c-deconnexion-echec' : 'c-deconnexion-chargement';
  test(`États PC : déconnexion ${echec ? 'refusée' : 'en cours'} (${id})`, async ({ page, context, serveur }) => {
    await creerPartie(page, context);
    // Le PUT est d'abord refusé : la progression reste en attente, donc la déconnexion doit la sauvegarder.
    serveur.refusPut = true;
    await page.getByRole('button', { name: /^(Auto-attaque|Attaque auto)$/ }).click();
    await monCompte(page);
    serveur.refusPut = echec;
    const liberer = echec ? () => {} : await retarder(page, 'http://api.test/api/sauvegarde', 'PUT');
    try {
      await page.getByRole('button', { name: 'Se déconnecter', exact: true }).click();
      await page.getByRole('dialog').getByRole('button', { name: /^(Sauvegarder et se déconnecter|Se déconnecter)$/ }).click();
      await expect(page.getByRole('alertdialog')).toContainText(echec ? "La sauvegarde n'a pas abouti" : 'Sauvegarde en cours…');
      await verifierEtat(page, id);
    } finally { liberer(); }
  });
}

test('États PC : Mon compte (c-compte)', async ({ page, context, serveur }) => {
  void serveur; await creerPartie(page, context); await monCompte(page);
  await verifierEtat(page, 'c-compte');
});

test('États PC : chargement de la partie en ligne (chargement)', async ({ page, context, serveur }) => {
  await creerPartie(page, context); await memoriserVersion(page, serveur);
  const liberer = await retarder(page, `http://api.test/api/sauvegarde/parties/${serveur.version!.partie.id}`);
  try {
    await page.reload();
    await expect(page.getByRole('status')).toHaveText('Vérification de la sauvegarde…');
    await verifierEtat(page, 'chargement');
  } finally { liberer(); }
});

test('États PC : renommage impossible sans réseau (erreur-reseau)', async ({ page, context, serveur }) => {
  void serveur; await creerPartie(page, context); await menuPrincipal(page);
  await page.route('http://api.test/api/sauvegarde/parties/*', async route => {
    if (route.request().method() === 'PATCH') await route.abort(); else await route.fallback();
  });
  await page.getByRole('button', { name: 'Renommer Test', exact: true }).click();
  await page.getByLabel('Nom de la partie', { exact: true }).fill('Renommée');
  await page.getByLabel('Nom de la partie', { exact: true }).press('Enter');
  await expect(page.getByRole('alert')).toContainText('Connexion impossible.');
  await verifierEtat(page, 'erreur-reseau');
});

test('États PC : partie hors connexion (hors-ligne)', async ({ page, context, serveur }) => {
  void serveur; await creerPartie(page, context);
  await page.route('http://api.test/api/sauvegarde', async route => {
    if (route.request().method() === 'PUT') await route.abort(); else await route.fallback();
  });
  await context.setOffline(true);
  await page.getByRole('button', { name: /^(Auto-attaque|Attaque auto)$/ }).click();
  await page.clock.runFor(45_000);
  await expect(page.getByText('Hors connexion', { exact: true }).first()).toBeVisible();
  await verifierEtat(page, 'hors-ligne', async () => {
    await expect.soft(page.getByText('Hors connexion', { exact: true })).toHaveCount(2);
    for (const message of await page.getByText('Hors connexion', { exact: true }).all()) await expect.soft(message).toBeVisible();
  });
});

test('États PC : conflit à l’envoi, résolution en attente (conflit-sauvegarde)', async ({ page, context, serveur }) => {
  await creerPartie(page, context); await memoriserVersion(page, serveur);
  const liberer = await retarder(page, 'http://api.test/api/sauvegarde/compte');
  await page.route('http://api.test/api/sauvegarde', async route => {
    if (route.request().method() !== 'PUT') return route.fallback();
    await route.fulfill({ status: 409, json: { conflits: [] }, headers: { 'access-control-allow-origin': '*' } });
  });
  try {
    await page.getByRole('button', { name: /^(Auto-attaque|Attaque auto)$/ }).click();
    await page.clock.runFor(45_000);
    await expect(page.getByText('Mise à jour depuis l’autre appareil', { exact: true }).first()).toBeVisible();
    await verifierEtat(page, 'conflit-sauvegarde');
  } finally { liberer(); }
});
