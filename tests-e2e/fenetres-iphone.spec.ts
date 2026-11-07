import { mkdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { reglageArret } from './aide-combat';

// Projet « iphone » (WebKit, iPhone 15, tactile) : toutes les fenêtres s'ouvrent à une taille lisible.
// Retour du test iPhone du 07/11 : les fenêtres s'ouvraient en bande de quelques pixels au bas de l'écran.

async function demarrer(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
}

/** La fenêtre ouverte fait au moins 60 % de l'écran, tient dedans, et son contenu est visible et défilable. */
async function verifierFenetre(page: Page, nom: string, contenuVisible: RegExp) {
  const fenetre = page.locator('dialog[open]').last();
  await expect(fenetre).toBeVisible();
  await expect(fenetre).toContainText(contenuVisible);
  const mesures = await fenetre.evaluate(element => {
    const boite = element.getBoundingClientRect();
    const contenu = element.querySelector<HTMLElement>('.fiche-contenu');
    const zone = contenu?.getBoundingClientRect();
    return {
      hauteurEcran: window.innerHeight, hauteur: boite.height, haut: boite.top, bas: boite.bottom,
      hauteurContenu: zone?.height ?? 0, defilable: contenu ? getComputedStyle(contenu).overflowY : 'absent',
    };
  });
  expect(mesures.hauteur, `${nom} : hauteur de la fenêtre`).toBeGreaterThanOrEqual(Math.floor(mesures.hauteurEcran * 0.6));
  expect(mesures.haut, `${nom} : haut dans l'écran`).toBeGreaterThanOrEqual(0);
  expect(mesures.bas, `${nom} : bas dans l'écran`).toBeLessThanOrEqual(mesures.hauteurEcran);
  expect(mesures.hauteurContenu, `${nom} : hauteur du contenu`).toBeGreaterThanOrEqual(mesures.hauteurEcran * 0.4);
  expect(mesures.defilable, `${nom} : le contenu défile`).toBe('auto');
  await mkdir('design/captures', { recursive: true });
  await page.screenshot({ path: `design/captures/iphone-${nom}.png`, animations: 'disabled' });
}

test.describe('fenêtres sur iPhone (WebKit)', () => {
  test('fiche Pokémon', async ({ page }) => {
    await demarrer(page);
    await page.getByRole('button', { name: 'Équipe', exact: true }).click();
    await page.getByRole('button', { name: /niveau \d+/ }).first().click();
    await verifierFenetre(page, 'fiche-pokemon', /Base/);
  });

  test('Sac', async ({ page }) => {
    await demarrer(page);
    await page.getByRole('button', { name: 'Sac', exact: true }).click();
    await verifierFenetre(page, 'sac', /Ton Sac|Pokéball/);
  });

  test('réglage de l’arrêt auto', async ({ page }) => {
    await demarrer(page);
    await reglageArret(page).click();
    await verifierFenetre(page, 'reglage-arret', /./);
  });

  test('fiche du Pokédex', async ({ page }) => {
    await demarrer(page);
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await page.getByRole('button', { name: /^Pokédex/ }).click();
    await page.getByRole('button', { name: /^Pokémon inconnu, numéro \d+$/ }).first().click();
    await verifierFenetre(page, 'pokedex', /N° \d+/);
  });
});
