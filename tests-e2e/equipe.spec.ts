import { mkdir } from 'node:fs/promises';
import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

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

async function ouvrirEquipe(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.getByRole('button', { name: 'Équipe', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Ton équipe', level: 1 })).toBeVisible();
  await page.evaluate(() => Promise.all([...document.images].map(image => image.decode().catch(() => undefined))));
}

async function ouvrirFiche(page: Page, nom: RegExp) {
  await page.getByRole('button', { name: nom }).first().click();
  const fiche = page.locator('dialog[open]').first();
  if (!(await fiche.isVisible())) await page.getByRole('button', { name: 'Ouvre la fiche' }).click();
  await expect(fiche).toBeVisible();
  return fiche;
}

test('Équipe : six cases, fiche en fenêtre et captures', async ({ page }, informations) => {
  await ouvrirEquipe(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await expect(page.getByText('Emplacement libre')).toHaveCount(3);
  await mkdir('design/captures', { recursive: true });
  const largeur = informations.project.name === 'mobile' ? 390 : 1440;
  await page.screenshot({ path: `design/captures/h-equipe-${largeur}.png`, animations: 'disabled' });
  const fiche = await ouvrirFiche(page, /^Bulbizarre, niveau/);
  await expect(fiche.getByRole('heading', { level: 2 }).first()).toContainText('Bulbizarre');
  const hauteurFenetre = await page.evaluate(() => window.innerHeight);
  const boite = (await fiche.boundingBox())!;
  if (informations.project.name === 'mobile') expect(boite.height).toBeLessThanOrEqual(hauteurFenetre / 2 + 1);
  await page.screenshot({ path: `design/captures/h-fiche-${largeur}.png`, animations: 'disabled' });
  // Le fond ne défile pas ; Échap ferme et rend le focus à la carte d'origine.
  const defilement = await page.evaluate(() => window.scrollY);
  await page.mouse.move(boite.x + boite.width / 2, boite.y + boite.height / 2);
  await page.mouse.wheel(0, 300);
  expect(await page.evaluate(() => window.scrollY)).toBe(defilement);
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  expect(await page.evaluate(() => window.scrollY)).toBe(defilement);
});

test('Équipe : renommer, favori et reprise après rechargement', async ({ page }) => {
  await ouvrirEquipe(page);
  let fiche = await ouvrirFiche(page, /^Salamèche, niveau/);
  await expect(fiche.getByRole('textbox')).toHaveCount(0);
  await fiche.getByRole('button', { name: 'Renommer Salamèche' }).click();
  const champ = fiche.getByRole('textbox');
  await expect(champ).toBeFocused();
  await expect(champ).toHaveValue('Salamèche');
  await champ.fill('Nom beaucoup trop long');
  await champ.press('Enter');
  await expect(fiche.getByRole('alert')).toContainText('1 à 12 caractères');
  // Échap annule l'édition sans fermer la fiche ni changer le nom.
  await champ.press('Escape');
  await expect(fiche.getByRole('textbox')).toHaveCount(0);
  await expect(fiche).toBeVisible();
  await expect(fiche.getByRole('heading', { level: 2 }).first()).toContainText('Salamèche');
  await fiche.getByRole('button', { name: 'Renommer Salamèche' }).click();
  await champ.fill('Flammèche');
  await champ.press('Enter');
  await expect(fiche.getByRole('heading', { level: 2 }).first()).toContainText('Flammèche');
  await expect(fiche.getByRole('button', { name: 'Renommer Flammèche' })).toBeFocused();
  await fiche.getByRole('button', { name: 'Ajoute aux favoris' }).click();
  await expect(fiche.getByRole('button', { name: 'Retire des favoris' })).toHaveAttribute('aria-pressed', 'true');
  // Relâcher demande une confirmation, « Annuler » garde le Pokémon.
  await fiche.getByRole('button', { name: 'Relâcher' }).click();
  const confirmation = page.locator('dialog[open]').last();
  await expect(confirmation).toContainText('Veux-tu vraiment relâcher');
  await confirmation.getByRole('button', { name: 'Annuler' }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  // Les actions s'enregistrent tout de suite : rechargement.
  await page.reload();
  await page.getByRole('button', { name: 'Équipe', exact: true }).click();
  fiche = await ouvrirFiche(page, /^Flammèche, niveau/);
  await expect(fiche.getByRole('button', { name: 'Retire des favoris' })).toHaveAttribute('aria-pressed', 'true');
});

test('Équipe : le clic droit propose le résumé', async ({ page }, informations) => {
  test.skip(informations.project.name === 'mobile', 'Clic droit à la souris : profil PC.');
  await ouvrirEquipe(page);
  await page.getByRole('button', { name: /^Carapuce, niveau/ }).first().click({ button: 'right' });
  await page.getByRole('menuitem', { name: 'Résumé' }).click();
  await expect(page.locator('dialog[open]').first()).toContainText('Carapuce');
});
