import { mkdir } from 'node:fs/promises';
import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { ouvrirSac } from './aide-sac';
import { rayon } from './aide-shop';

const test = base.extend<{ surveillance: void }>({
  surveillance: [async ({ page }, utiliser) => {
    const erreurs: string[] = [];
    const requetesExternes: string[] = [];
    page.on('console', message => { if (message.type() === 'error') erreurs.push(message.text()); });
    page.on('pageerror', erreur => erreurs.push(erreur.message));
    page.on('request', requete => {
      if (new URL(requete.url()).hostname !== 'localhost') requetesExternes.push(requete.url());
    });
    await utiliser();
    expect.soft(erreurs, 'Erreurs de console ou de page').toEqual([]);
    expect.soft(requetesExternes, 'Requêtes hors de localhost').toEqual([]);
  }, { auto: true }],
});

async function demarrer(page: Page, argent = 100000) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.addInitScript(argent => {
    const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'));
    if (!cle || sessionStorage.getItem('boutique-prepare')) return;
    sessionStorage.setItem('boutique-prepare', '1');
    const enveloppe = JSON.parse(localStorage.getItem(cle)!);
    enveloppe.donnees.argent = argent;
    enveloppe.donnees.bossVaincus = ['kanto.route-1', 'kanto.foret-de-jade'];
    enveloppe.donnees.inventaire = { bonbon: 5 };
    enveloppe.revision += 1;
    localStorage.setItem(cle, JSON.stringify(enveloppe));
  }, argent);
  await page.reload();
  await page.getByRole('button', { name: 'Shop', exact: true }).click();
  await expect(rayon(page, 'Poké Ball')).toBeVisible();
}

async function capturer(page: Page, nom: string, projet: string) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await mkdir('design/captures', { recursive: true });
  await page.evaluate(() => Promise.all([...document.images].map(i => i.decode().catch(() => undefined))));
  await page.screenshot({ path: `design/captures/l-${nom}-${projet === 'mobile' ? 390 : 1440}.png`, animations: 'disabled' });
}

test('Shop verrouillé sans progression', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Shop', exact: true }).click();
  await expect(page.getByText("Le Shop s'ouvre à la Forêt de Jade.", { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Acheter/ })).toHaveCount(0);
});

test('Pokéball ×2 : prix, sauvegarde, filtre et largeur', async ({ page }, informations) => {
  await demarrer(page);
  const carte = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Pokéball', exact: true }) });
  const prix = Number((await carte.locator('strong').innerText()).replace(/\D/g, ''));
  const solde = `${(100000 - 2 * prix).toLocaleString('fr-FR')} ₽`;
  await carte.getByRole('button', { name: 'Plus', exact: true }).click();
  await carte.getByRole('button', { name: 'Acheter ×2', exact: true }).click();
  await expect(page.getByText(solde).locator('visible=true').first()).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Shop', exact: true }).click();
  await expect(page.getByText(solde).locator('visible=true').first()).toBeVisible();
  await capturer(page, 'shop', informations.project.name);
  const balles = await page.getByRole('article').filter({ has: page.getByRole('group', { name: /^Quantité de .*ball/i }) }).getByRole('heading').allTextContents();
  expect(balles).toContain('Pokéball');
  await rayon(page, 'Poké Ball').click();
  await expect(rayon(page, 'Poké Ball')).toHaveAttribute(informations.project.name === 'pc' ? 'aria-selected' : 'aria-pressed', 'true');
  await expect(page.getByRole('article').getByRole('heading')).toHaveText(balles);
  const sac = await ouvrirSac(page);
  await expect(sac.getByRole('button', { name: 'Pokéball ×2', exact: true })).toBeVisible();
});

test('Protéine unique conservée au rechargement', async ({ page }) => {
  await demarrer(page);
  await rayon(page, 'Accessoires').click();
  const proteine = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Protéine', exact: true }) });
  await proteine.getByRole('button', { name: /^Acheter ×1/ }).click();
  await expect(proteine.getByText('Possédé', { exact: true })).toBeVisible();
  await expect(proteine.getByRole('button', { name: /^Acheter/ })).toHaveCount(0);
  await page.reload();
  await page.getByRole('button', { name: 'Shop', exact: true }).click();
  await rayon(page, 'Accessoires').click();
  await expect(proteine.getByText('Possédé', { exact: true })).toBeVisible();
  await expect(proteine.getByRole('button', { name: /^Acheter/ })).toHaveCount(0);
});

test('Objet trop cher : achat désactivé sans texte superflu', async ({ page }) => {
  await demarrer(page, 0);
  const carte = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Pokéball', exact: true }) });
  await expect(carte.getByRole('button', { name: /^Acheter ×1/ })).toBeDisabled();
  await expect(page.getByText(/manque|panier|Prépare/)).toHaveCount(0);
});

test('Bonbon : annulation puis deux niveaux', async ({ page }, informations) => {
  await demarrer(page);
  const sac = await ouvrirSac(page);
  await sac.getByRole('button', { name: 'Bonbon ×5', exact: true }).click();
  const message = page.getByText(/^Bonbon ×\d+ : touche un Pokémon$/);
  await expect(message).toBeVisible();
  // Téléphone et PC : Fermer rouvre le Sac, là où l'on était.
  await page.getByRole('button', { name: 'Fermer', exact: true }).click();
  await expect(message).toHaveCount(0);
  await expect(sac.getByRole('button', { name: 'Bonbon ×5', exact: true })).toBeVisible();
  await sac.getByRole('button', { name: 'Bonbon ×5', exact: true }).click();
  await expect(message).toBeVisible();
  const bulbizarre = page.getByRole('button', { name: 'Bulbizarre, niveau 5', exact: true });
  await bulbizarre.click();
  const ligne = page.getByRole('listitem').filter({ has: bulbizarre });
  await ligne.locator('button').filter({ hasText: /^\+$/ }).click();
  await expect(ligne.locator('output')).toHaveText('2');
  await ligne.locator('button').filter({ hasText: /^✓$/ }).click();
  // Le mode reste actif après l'application ; le Sac permet de vérifier le stock.
  await page.getByRole('button', { name: 'Équipe', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Bulbizarre, niveau 7', exact: true })).toBeVisible();
  const sacApres = await ouvrirSac(page);
  await expect(sacApres.getByRole('button', { name: 'Bonbon ×3', exact: true })).toBeVisible();
  await capturer(page, 'sac', informations.project.name);
});
