import { expect, test } from '@playwright/test';

test('le Guide du jeu défile seul, se ferme avec Échap ou la croix et rend le focus', async ({ page }, info) => {
  const erreurs: string[] = [];
  page.on('console', message => { if (message.type() === 'error') erreurs.push(message.text()); });
  page.on('pageerror', erreur => erreurs.push(erreur.message));
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.getByRole('button', { name: 'Plus', exact: true }).click();
  const ouverture = page.getByRole('button', { name: 'Guide du jeu' });
  await ouverture.click();

  const fenetre = page.getByRole('dialog', { name: 'Guide du jeu' });
  await expect(fenetre).toBeVisible();
  const boite = await fenetre.boundingBox();
  const fenetreVue = page.viewportSize()!;
  expect(boite!.height).toBeLessThanOrEqual(fenetreVue.height);
  expect(boite!.width).toBeLessThanOrEqual(fenetreVue.width);

  // Les 11 sections sont là ; en déplier plusieurs force le défilement interne, jamais celui de la page.
  const sections = fenetre.locator('details');
  await expect(sections).toHaveCount(11);
  for (let i = 0; i < 11; i++) await sections.nth(i).locator('summary').evaluate(el => { (el.parentElement as HTMLDetailsElement).open = true; });
  const contenu = fenetre.locator('[data-guide-contenu]');
  const defilable = await contenu.evaluate(el => el.scrollHeight > el.clientHeight && getComputedStyle(el).overflowY === 'auto');
  expect(defilable).toBe(true);
  await contenu.evaluate(el => { el.scrollTop = el.scrollHeight; });
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe('hidden');
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect(fenetre.getByText(/Easter eggs|Renomme en “Daran”/).first()).toBeVisible();

  const croix = fenetre.getByRole('button', { name: 'Fermer le guide' });
  const taille = await croix.boundingBox();
  expect(taille!.width).toBeGreaterThanOrEqual(44);
  expect(taille!.height).toBeGreaterThanOrEqual(44);

  await page.keyboard.press('Escape');
  await expect(fenetre).toBeHidden();
  await expect(ouverture).toBeFocused();

  await ouverture.click();
  await fenetre.getByRole('button', { name: 'Fermer le guide' }).click();
  await expect(fenetre).toBeHidden();
  await expect(ouverture).toBeFocused();

  await ouverture.click();
  await sections.first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: `design/captures/al-guide-${info.project.name}.png` });
  expect(erreurs).toEqual([]);
});
