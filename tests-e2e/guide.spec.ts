import { expect, test } from '@playwright/test';

test('le Guide du jeu sur PC : page à deux colonnes, sections au clavier, retour au Menu', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'Sur téléphone, le Guide est une page : voir le test suivant.');
  const erreurs: string[] = [];
  page.on('console', message => { if (message.type() === 'error') erreurs.push(message.text()); });
  page.on('pageerror', erreur => erreurs.push(erreur.message));
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  const ouverture = page.getByRole('button', { name: 'Guide du jeu' });
  await ouverture.click();

  // Sur PC, le Guide est une page dans la zone de contenu, plus une fenêtre.
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1, name: 'Guide du jeu' })).toBeVisible();
  const navigation = page.getByRole('navigation', { name: 'Sections du guide' });
  await expect(navigation.getByRole('button')).toHaveCount(12);
  await expect(page.getByRole('article')).toBeVisible();
  // Rien ne fait défiler la page : le Guide défile dans son cadre.
  const defilements = await page.evaluate(() => ({ page: document.documentElement.scrollHeight - innerHeight, contenu: document.getElementById('contenu')!.scrollHeight - document.getElementById('contenu')!.clientHeight }));
  expect(defilements.page).toBeLessThanOrEqual(0);
  expect(defilements.contenu).toBeLessThanOrEqual(1);
  // Clavier : une autre section remplace l'article, le bouton de la section porte aria-current.
  const quatrieme = navigation.getByRole('button').nth(3);
  await quatrieme.focus();
  await page.keyboard.press('Enter');
  await expect(quatrieme).toHaveAttribute('aria-current', 'true');
  await expect(page.getByRole('article').getByRole('heading', { level: 2 })).toHaveText((await quatrieme.innerText()).trim());
  await page.screenshot({ path: `design/captures/al-guide-${info.project.name}.png` });
  await page.getByRole('button', { name: 'Retour au menu' }).click();
  await expect(ouverture).toBeFocused();
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
  await expect(sections).toHaveCount(12);
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

test('Types : grille PC et listes tactiles', async ({ page }, info) => {
  const mobile = info.project.name === 'mobile';
  test.skip(!mobile && info.project.name !== 'pc');
  const erreurs: string[] = [];
  page.on('console', message => { if (message.type() === 'error') erreurs.push(message.text()); });
  page.on('pageerror', erreur => erreurs.push(erreur.message));
  await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('button', { name: 'Guide du jeu' }).click();
  if (mobile) {
    const section = page.getByRole('main').locator('details').filter({ has: page.locator('summary', { hasText: /^Types$/ }) });
    await section.locator('summary').click();
    const boutons = section.getByRole('button');
    await expect(boutons).toHaveCount(17);
    for (const bouton of await boutons.all()) expect((await bouton.boundingBox())!.height).toBeGreaterThanOrEqual(48);
    await section.getByRole('button', { name: 'Feu', exact: true }).click();
    await expect(section.getByText('Fort contre (×2)', { exact: true }).filter({ visible: true })).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } else {
    await page.getByRole('navigation', { name: 'Sections du guide' }).getByRole('button', { name: 'Types', exact: true }).click();
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.locator('th[scope="col"]')).toHaveCount(17);
    for (const [width, height] of [[1280, 720], [1440, 900], [1920, 1080], [2560, 1440]]) {
      await page.setViewportSize({ width: width!, height: height! });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)).toBeLessThanOrEqual(0);
      expect(await page.evaluate(() => document.getElementById('contenu')!.scrollHeight - document.getElementById('contenu')!.clientHeight)).toBeLessThanOrEqual(1);
      const region = page.getByRole('region', { name: 'Table des types' });
      await page.keyboard.press('Shift');
      await region.focus();
      expect(await region.evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe('none');
      const lignes = page.locator('th[scope="row"]');
      await lignes.first().focus();
      await page.keyboard.press('Tab');
      await expect(lignes.nth(1)).toBeFocused();
      expect(await lignes.nth(1).evaluate(element => element.matches(':focus-visible'))).toBe(true);
      expect(await lignes.nth(1).evaluate(element => getComputedStyle(element.closest('tr')!).outlineStyle)).not.toBe('none');
    }
    await page.setViewportSize({ width: 1440, height: 900 });
  }
  await page.screenshot({ path: `design/captures/s-types-${info.project.name}.png` });
  expect(erreurs).toEqual([]);
});
