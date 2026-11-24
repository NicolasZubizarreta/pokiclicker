import { expect, test } from '@playwright/test';

test('parcourt arène, centre et Centrale dans les deux sens', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.evaluate(() => {
    const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'))!;
    const enveloppe = JSON.parse(localStorage.getItem(cle)!);
    Object.assign(enveloppe.donnees, {
      zoneId: 'kanto.arene-de-celadopole', etape: 1,
      bossVaincus: ['kanto.tour-pokemon', 'kanto.arene-de-celadopole'],
      annoncesVues: ['sac', 'pc', 'pension', 'centre-commercial', 'casino'],
      tutosVus: ['centre-commercial'],
    });
    enveloppe.revision += 1;
    localStorage.setItem(cle, JSON.stringify(enveloppe));
  });
  await page.reload();
  await page.getByRole('button', { name: 'Suivant : Centre commercial', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Centre commercial', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Suivant : Centrale', exact: true })).toHaveText('Suivant : Centrale');
  await page.getByRole('button', { name: 'Suivant : Centrale', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.getByRole('button', { name: 'Précédent : Centre commercial', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Centre commercial', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /^Précédent : .*Céladopole/ }).click();
  await expect(page.getByRole('button', { name: 'Suivant : Centre commercial', exact: true })).toBeVisible();
});

test('garde Pension verrouillée visible et explique son accès', async ({ page }, informations) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  const bouton = page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('button', { name: 'Pension', exact: true });
  await expect(bouton).toHaveAttribute('aria-disabled', 'true');
  for (const largeur of informations.project.name === 'pc' ? [1440] : [360, 390]) {
    await page.setViewportSize({ width: largeur, height: 900 });
    const navigation = page.getByRole('navigation', { name: 'Navigation principale' });
    for (const nom of ['Pension', 'PC']) {
      const entree = navigation.getByRole('button', { name: nom, exact: true });
      const dimensions = await entree.boundingBox();
      expect(dimensions!.width).toBeGreaterThanOrEqual(44);
      expect(dimensions!.height).toBeGreaterThanOrEqual(44);
      expect(await entree.locator('span').last().evaluate(e => e.getBoundingClientRect().width <= e.parentElement!.getBoundingClientRect().width)).toBe(true);
    }
    if (largeur !== 360) await page.screenshot({ path: informations.outputPath(`navigation-${largeur}.png`) });
  }
  await bouton.click({ force: true });
  const raison = await bouton.getAttribute('aria-describedby');
  await expect(page.getByRole('status').filter({ hasText: await page.locator(`[id="${raison}"]`).textContent() ?? '' })).toBeVisible();
});
