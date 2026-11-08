import { expect, test } from '@playwright/test';

test('statistiques depuis Menu sur PC : page à sept cartes, sans défilement de page, retour au Menu', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'Sur téléphone, les statistiques sont une page : voir le test suivant.');
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
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1, name: 'Statistiques' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Pokémon vaincus' })).toContainText('123');
  await expect(page.getByRole('region', { name: 'Argent total' })).toContainText(/4\s567\s₽/);
  await expect(page.getByRole('main').getByRole('region')).toHaveCount(7);
  const defilements = await page.evaluate(() => ({ page: document.documentElement.scrollHeight - innerHeight, contenu: document.getElementById('contenu')!.scrollHeight - document.getElementById('contenu')!.clientHeight }));
  expect(defilements.page).toBeLessThanOrEqual(0);
  expect(defilements.contenu).toBeLessThanOrEqual(1);
  const retour = page.getByRole('button', { name: 'Retour au menu' });
  expect((await retour.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await retour.click();
  await expect(ouverture).toBeFocused();
});

test('statistiques sur téléphone : page, sept cartes, sans défilement horizontal, retour au Menu', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'Page réservée au téléphone.');
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
  const entree = page.getByRole('button', { name: 'Statistiques', exact: true });
  await entree.click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1, name: 'Statistiques' })).toBeFocused();
  await expect(page.getByRole('region', { name: 'Pokémon vaincus' })).toContainText('123');
  await expect(page.getByRole('main').getByRole('region')).toHaveCount(7);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `design/captures/lot5-stats-${info.project.name}.png`, fullPage: true });
  const retour = page.getByRole('button', { name: 'Retour au menu' });
  expect((await retour.boundingBox())!.width).toBeGreaterThanOrEqual(44);
  await retour.click();
  await expect(entree).toBeFocused();
});
