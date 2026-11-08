import { test, expect, type Page, type Locator } from '@playwright/test';

async function verifierSprites(zone: Locator) {
  const images = zone.locator('img[src*="/sprites/"], img[src*="/easter-eggs/"]');
  let nombre = 0;
  for (const image of await images.all()) {
    if (!await image.isVisible()) continue;
    nombre++;
    await image.evaluate((img: HTMLImageElement) => img.decode());
    const mesure = await image.evaluate((img: HTMLImageElement) => {
      const cadre = img.closest('.cadre') ?? img.closest('[role="dialog"], dialog') ?? img.parentElement!;
      const a = img.getBoundingClientRect(), b = cadre.getBoundingClientRect();
      return { fit: getComputedStyle(img).objectFit,
        contenu: a.left >= b.left - 1 && a.top >= b.top - 1 && a.right <= b.right + 1 && a.bottom <= b.bottom + 1,
        ratio: (a.width / a.height) / (img.naturalWidth / img.naturalHeight) };
    });
    expect(mesure.fit).toBe('contain');
    expect(mesure.contenu).toBe(true);
    expect(Math.abs(mesure.ratio - 1)).toBeLessThanOrEqual(0.02);
  }
  expect(nombre).toBeGreaterThan(0);
}

async function preparer(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.addInitScript(() => {
    const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'))!;
    if (sessionStorage.getItem('sprites-prepares')) return;
    sessionStorage.setItem('sprites-prepares', '1');
    const enveloppe = JSON.parse(localStorage.getItem(cle)!);
    const pokemon = (numero: number, surnom?: string) => ({ uid: `sprite-${numero}`, numero, surnom,
      niveau: 16, xp: 0, shiny: false, bonheur: 0, pierreEternelle: false, calcium: 0, sexe: 'male', favori: false });
    enveloppe.donnees.equipe = [pokemon(1, 'Daran'), pokemon(4, 'Gabriel'), pokemon(7, 'DinnerBone'),
      pokemon(10, 'jeb_'), pokemon(13, 'caca'), pokemon(16)];
    enveloppe.donnees.pc = [pokemon(19, 'Daran')];
    enveloppe.donnees.bossVaincus = ['kanto.route-1', 'kanto.foret-de-jade'];
    enveloppe.revision += 1;
    localStorage.setItem(cle, JSON.stringify(enveloppe));
  });
  await page.reload();
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
}

test('les sprites restent entièrement dans leurs cadres', async ({ page }, informations) => {
  test.skip(!['mobile', 'pc'].includes(informations.project.name));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await preparer(page);
  // Les cartes de la ligne d'équipe (la scène de combat est exclue : son ennemi a sa propre règle).
  await verifierSprites(page.locator('.cadre[aria-label$=" DPS"], .rang-equipe'));
  await page.getByRole('button', { name: 'Équipe', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Ton équipe' })).toBeVisible();
  await verifierSprites(page.locator('main'));
  await page.getByRole('button', { name: /^Daran, niveau/ }).first().click();
  if (!await page.locator('dialog[open]').isVisible()) await page.getByRole('button', { name: 'Ouvre la fiche' }).click();
  await expect(page.locator('dialog[open]')).toBeVisible();
  await verifierSprites(page.locator('dialog[open]'));
  await page.keyboard.press('Escape');
  // PC : l'onglet PC (plus de ligne « PC de Léo » dans la page Équipe) ; téléphone : la ligne de la page Équipe.
  if (informations.project.name === 'pc') await page.getByRole('button', { name: 'PC', exact: true }).click();
  else await page.getByRole('button', { name: /PC de Léo/ }).click();
  await expect(page.getByRole('heading', { name: 'PC de Léo' })).toBeVisible();
  await verifierSprites(page.locator('main'));
  if (informations.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await page.getByRole('button', { name: /^Pokédex/ }).click();
    await verifierSprites(page.locator('main'));
    await page.getByRole('button', { name: /déjà capturé/ }).first().click();
    await expect(page.locator('dialog[open]')).toBeVisible();
    await verifierSprites(page.locator('dialog[open]'));
  }
});
