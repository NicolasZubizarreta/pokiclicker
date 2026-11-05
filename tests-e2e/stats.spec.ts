import { expect, test } from '@playwright/test';

test('statistiques depuis Menu : sauvegarde, défilement interne et fermeture', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.evaluate(() => {
    const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'))!;
    const enveloppe = JSON.parse(localStorage.getItem(cle)!);
    enveloppe.donnees.statistiques = { eliminations: 123, argentTotalGagne: 4567 };
    enveloppe.donnees.zoneId = 'kanto.bourg-palette';
    localStorage.setItem(cle, JSON.stringify(enveloppe));
  });
  await page.reload();
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  const ouverture = page.getByRole('button', { name: 'Statistiques', exact: true });
  await ouverture.click();
  const fenetre = page.getByRole('dialog', { name: 'Statistiques' });
  await expect(fenetre).toBeVisible();
  await expect(fenetre.getByRole('region', { name: 'Pokémon vaincus' })).toContainText('123');
  await expect(fenetre.getByRole('region', { name: 'Argent total' })).toContainText(/4\s567 \$/);
  await expect(fenetre.getByRole('region')).toHaveCount(7);
  const boite = (await fenetre.boundingBox())!;
  expect(boite.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  expect(boite.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  // Le Menu est plus long qu'un écran de téléphone : le clic a pu faire défiler la page avant l'ouverture.
  const defilePage = await page.evaluate(() => window.scrollY);
  const contenu = fenetre.locator('[data-stats-contenu]');
  expect(await contenu.evaluate(el => el.scrollHeight > el.clientHeight && getComputedStyle(el).overflowY === 'auto')).toBe(true);
  const croix = fenetre.getByRole('button', { name: 'Fermer les statistiques' });
  const avant = (await croix.boundingBox())!;
  expect(avant.width).toBeGreaterThanOrEqual(44);
  expect(avant.height).toBeGreaterThanOrEqual(44);
  await contenu.evaluate(el => { el.scrollTop = el.scrollHeight; });
  expect((await croix.boundingBox())!.y).toBe(avant.y);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe('hidden');
  expect(await page.evaluate(() => window.scrollY)).toBe(defilePage);
  expect(await fenetre.evaluate(el => el.getAnimations({ subtree: true }).length)).toBe(0);
  await page.keyboard.press('Escape');
  await expect(fenetre).toBeHidden();
  await expect(ouverture).toBeFocused();
  await ouverture.click();
  await croix.click();
  await expect(fenetre).toBeHidden();
  await expect(ouverture).toBeFocused();
});
