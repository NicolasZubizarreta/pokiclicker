import { expect, test } from '@playwright/test';

test('le Guide du jeu défile seul, se ferme avec Échap ou la croix et rend le focus', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'Sur téléphone, le Guide est une page : voir le test suivant.');
  const erreurs: string[] = [];
  page.on('console', message => { if (message.type() === 'error') erreurs.push(message.text()); });
  page.on('pageerror', erreur => erreurs.push(erreur.message));
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  const ouverture = page.getByRole('button', { name: 'Guide du jeu' });
  await ouverture.click();

  const fenetre = page.getByRole('dialog', { name: 'Guide du jeu' });
  await expect(fenetre).toBeVisible();
  const boite = await fenetre.boundingBox();
  const fenetreVue = page.viewportSize()!;
  expect(boite!.height).toBeLessThanOrEqual(fenetreVue.height);
  expect(boite!.width).toBeLessThanOrEqual(fenetreVue.width);

  // Les 11 sections sont là ; en déplier plusieurs force le défilement interne, jamais celui de la page.
  // Le Menu est plus long qu'un écran : le clic fait défiler la page, et le message passager du bandeau (« Nouveau
  // Pokémon ! ») qui s'efface raccourcit la page. On mesure donc juste avant de faire défiler le guide.
  const sections = fenetre.locator('details');
  await expect(sections).toHaveCount(11);
  for (let i = 0; i < 11; i++) await sections.nth(i).locator('summary').evaluate(el => { (el.parentElement as HTMLDetailsElement).open = true; });
  const contenu = fenetre.locator('[data-guide-contenu]');
  const defilable = await contenu.evaluate(el => el.scrollHeight > el.clientHeight && getComputedStyle(el).overflowY === 'auto');
  expect(defilable).toBe(true);
  const defilePage = await page.evaluate(() => window.scrollY);
  await contenu.evaluate(el => { el.scrollTop = el.scrollHeight; });
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe('hidden');
  expect(await page.evaluate(() => window.scrollY)).toBe(defilePage);
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

test('le Guide sur téléphone : page, accordéon à une section ouverte, retour au Menu', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'Page réservée au téléphone.');
  const erreurs: string[] = [];
  page.on('console', message => { if (message.type() === 'error') erreurs.push(message.text()); });
  page.on('pageerror', erreur => erreurs.push(erreur.message));
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  const entree = page.getByRole('button', { name: 'Guide du jeu' });
  await entree.click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1, name: 'Guide du jeu' })).toBeFocused();
  const sections = page.getByRole('main').locator('details');
  await expect(sections).toHaveCount(11);
  await expect(page.getByRole('main').locator('details[open]')).toHaveCount(1);
  await sections.nth(3).locator('summary').click();
  await expect(page.getByRole('main').locator('details[open]')).toHaveCount(1);
  await expect(sections.nth(3)).toHaveAttribute('open', '');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `design/captures/lot5-guide-${info.project.name}.png` });
  await page.getByRole('button', { name: 'Retour au menu' }).click();
  await expect(entree).toBeFocused();
  expect(erreurs).toEqual([]);
});
