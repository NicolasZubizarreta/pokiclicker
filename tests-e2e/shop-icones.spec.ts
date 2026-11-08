import { readFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { telephone } from './aide-carte';
import { rayon } from './aide-shop';

// Retour du test iPhone du 07/11 : la CT Fauchage s'affichait avec l'icône générique. Chaque objet du Shop doit avoir
// sa vraie icône ; seuls les objets sans image fournie (Chaussures de sport) gardent l'icône de repli.
const REPLI_ATTENDU = ['runningShoes'];

test('Shop : toutes les catégories sans icône de repli, sauf les objets en attente d’image (390 px)', async ({ page }) => {
  test.skip(!telephone(page), 'Mise en page téléphone');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  const zonesIds: string[] = JSON.parse(readFileSync('data/regions/kanto/zones.json', 'utf8')).zones.map((zone: { id: string }) => zone.id);
  await page.addInitScript((zonesIds: string[]) => {
    const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'));
    if (!cle || sessionStorage.getItem('shop-icones-prepare')) return;
    sessionStorage.setItem('shop-icones-prepare', '1');
    const enveloppe = JSON.parse(localStorage.getItem(cle)!);
    enveloppe.donnees.argent = 10_000_000;
    enveloppe.donnees.bossVaincus = zonesIds;
    enveloppe.revision += 1;
    localStorage.setItem(cle, JSON.stringify(enveloppe));
  }, zonesIds);
  await page.reload();
  await page.getByRole('button', { name: 'Shop', exact: true }).click();
  await mkdir('design/captures', { recursive: true });
  const repli: string[] = [];
  for (const categorie of ['Poké Ball', 'Objets', 'Accessoires']) {
    await rayon(page, categorie).click();
    await expect(page.getByRole('article').first()).toBeVisible();
    await page.evaluate(() => Promise.all([...document.images].map(image => image.decode().catch(() => undefined))));
    repli.push(...await page.locator('article[data-objet]:has([data-icone-repli])').evaluateAll(cartes => cartes.map(c => c.getAttribute('data-objet')!)));
    // Toute image affichée est réellement chargée.
    const cassees = await page.locator('article[data-objet] img').evaluateAll(images => (images as HTMLImageElement[]).filter(i => !i.naturalWidth).length);
    expect(cassees, `${categorie} : image non chargée`).toBe(0);
    if (categorie === 'Accessoires') {
      const fauchage = page.locator('article[data-objet="falseSwipe"]');
      await fauchage.scrollIntoViewIfNeeded();
      await expect(fauchage.locator('svg[role="img"]')).toBeVisible();
      await page.screenshot({ path: 'design/captures/shop-accessoires-390.png', animations: 'disabled' });
    }
  }
  expect(repli.sort()).toEqual(REPLI_ATTENDU);
});
