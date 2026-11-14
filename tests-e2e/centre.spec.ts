import { mkdir, readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { telephone, ligneZone } from './aide-carte';
import { fermerSac, ouvrirSac } from './aide-sac';

const test = base.extend<{ surveillance: void }>({
  surveillance: [async ({ page }, utiliser) => {
    const erreurs: string[] = [];
    page.on('pageerror', erreur => erreurs.push(erreur.message));
    page.on('console', message => { if (message.type() === 'error') erreurs.push(message.text()); });
    // Exécution sur le build local sans démarrer de serveur ni télécharger de ressource.
    if (process.env.CENTRE_SANS_SERVEUR) {
      const racine = resolve('dist');
      const types: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
        '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
      await page.route('**/*', async route => {
        const url = new URL(route.request().url());
        const chemin = resolve(racine, `.${decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname)}`);
        if (url.hostname !== 'localhost' || !chemin.startsWith(racine + sep)) return route.abort();
        await route.fulfill({ body: await readFile(chemin), contentType: types[extname(chemin)] ?? 'application/octet-stream' });
      });
    }
    await utiliser();
    expect(erreurs).toEqual([]);
  }, { auto: true }],
});

async function preparer(page: Page, ouvert: boolean) {
  const kanto = JSON.parse(await readFile('data/regions/kanto/zones.json', 'utf8')) as { zones: { ancienId: number; id: string }[] };
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.addInitScript(({ boss, ouvert }) => {
    const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'));
    if (!cle || sessionStorage.getItem('centre-prepare')) return;
    sessionStorage.setItem('centre-prepare', '1');
    const enveloppe = JSON.parse(localStorage.getItem(cle)!);
    Object.assign(enveloppe.donnees, { argent: 50000, zoneId: 'kanto.tour-pokemon', etape: 1,
      starterId: 1, evenementsJoues: ['kanto.intro'], drapeaux: ['sac-ouvert'],
      equipe: [{ uid: 'centre-starter', numero: 1, sexe: 'male', niveau: 5, xp: 0,
        shiny: false, bonheur: 0, pierreEternelle: false, calcium: 0, favori: false }],
      bossVaincus: [...boss, ...(ouvert ? ['kanto.tour-pokemon'] : [])],
      badges: ['roche', 'cascade', 'foudre'], inventaire: {} });
    delete enveloppe.donnees.evenementEnCours;
    enveloppe.revision += 1;
    localStorage.setItem(cle, JSON.stringify(enveloppe));
  }, { boss: kanto.zones.filter(z => z.ancienId > 0 && z.ancienId < 10).map(z => z.id), ouvert });
  await page.reload();
  await carte(page);
}

async function carte(page: Page) {
  await page.getByRole('button', { name: 'Carte', exact: true }).click();
  if (telephone(page)) {
    // Céladopole fermée : la ligne est grisée, la fenêtre des trois lieux ne s’ouvre pas.
    const ligne = ligneZone(page, 'Céladopole');
    if (await ligne.getAttribute('aria-disabled') !== 'true') await ligne.click();
  } else await page.getByRole('button', { name: /Céladopole/ }).last().click();
}

const choixCentre = (page: Page) => page.getByRole('dialog', { name: 'Céladopole', exact: true })
  .getByRole('button', { name: 'Centre commercial' });

test('zone 10 : Centre verrouillé et raison accessible', async ({ page }) => {
  await preparer(page, false);
  if (telephone(page)) {
    await expect(ligneZone(page, 'Céladopole')).toHaveAttribute('aria-disabled', 'true');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    return;
  }
  await expect(choixCentre(page)).toBeDisabled();
  await expect(choixCentre(page)).toHaveAccessibleDescription('Bats le boss de Tour Pokémon.');
});

test('Centre : vol, achat, Sac, retour et rechargement', async ({ page }, informations) => {
  await preparer(page, true);
  await choixCentre(page).click();
  await expect(page.getByRole('status')).toHaveText('Vol en cours vers Centre commercial…');
  const titre = page.getByRole('heading', { name: 'Centre commercial', exact: true });
  await expect(titre).toBeVisible({ timeout: 10000 });
  await expect(titre).toBeFocused();
  await expect(page.locator('[data-objet]')).toHaveCount(12);
  // Les messages d'achat sont des pop-up (calque de notifications) : la page elle-même n'a plus de ligne d'état.
  await expect(page.getByRole('status').and(page.locator(':not(output)'))).toHaveCount(0);
  // PC et téléphone : même présentation (« Ton achat », quantité, Acheter), l'objet sélectionné par défaut est Attaque +.
  await page.getByRole('button', { name: 'Plus', exact: true }).click();
  await page.getByRole('button', { name: /^Acheter ×2/ }).click();
  await expect(page.locator('[data-notifications]')).toContainText('Attaque + ×2 acheté.');
  await expect(page.locator('#contenu').getByText(/^32.750.₽$/)).toBeVisible();
  await expect(page.locator('[data-objet="xAttack"]')).toContainText('×2');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.evaluate(() => Promise.all([...document.images].map(i => i.decode().catch(() => undefined))));
  await mkdir('design/captures', { recursive: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `design/captures/u-page-centre-${informations.project.name === 'mobile' ? 390 : 1440}.png`, animations: 'disabled' });
  await page.getByRole('button', { name: 'Retour à la carte' }).click();
  if (telephone(page)) await expect(ligneZone(page, 'Céladopole')).toBeVisible();
  else await expect(page.getByRole('region', { name: 'Zone sélectionnée' })).toHaveCount(0);
  if (telephone(page)) await expect(ligneZone(page, 'Tour Pokémon')).toHaveAccessibleName(/tu es ici/);
  else await expect(page.getByRole('button', { name: /Tour Pokémon.*tu es ici/ })).toBeVisible();
  const sac = await ouvrirSac(page);
  await expect(sac.getByRole('button', { name: 'Attaque + ×2', exact: true })).toBeVisible();
  await fermerSac(page);
  await page.reload();
  await carte(page);
  await choixCentre(page).click();
  await expect(titre).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#contenu').getByText(/^32.750.₽$/)).toBeVisible();
  await expect(page.locator('[data-objet="xAttack"]')).toContainText('×2');
});
