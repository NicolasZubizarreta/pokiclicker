import { test, expect } from '@playwright/test';

test('PWA : manifeste, précache, reprise et attaque hors connexion', async ({ page, context }, informations) => {
  const erreurs: string[] = [];
  const externes: string[] = [];
  page.on('console', message => { if (message.type() === 'error') erreurs.push(message.text()); });
  page.on('pageerror', erreur => erreurs.push(erreur.message));
  context.on('request', requete => {
    if (new URL(requete.url()).hostname !== 'localhost') externes.push(requete.url());
  });
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
  await page.goto('/');
  const lien = page.locator('link[rel="manifest"]');
  await expect(lien).toHaveCount(1);
  const reponse = await page.request.get((await lien.getAttribute('href'))!);
  expect(reponse.status()).toBe(200);
  const manifeste = await reponse.json();
  expect(manifeste.display).toBe('standalone');
  for (const taille of ['192x192', '512x512']) {
    const icone = manifeste.icons.find((entree: { sizes: string }) => entree.sizes === taille);
    expect(icone).toBeTruthy();
    expect((await page.request.get(icone.src)).status()).toBe(200);
  }
  await expect.poll(() => page.evaluate(async () => (await navigator.serviceWorker.ready).active?.state)).toBe('activated');
  await expect(page.getByText('Le jeu est prêt hors connexion.')).toBeVisible();
  for (const largeur of [390, 1440]) {
    await page.setViewportSize({ width: largeur, height: largeur === 390 ? 844 : 900 });
    await page.screenshot({ path: informations.outputPath(`pwa-${largeur}.png`), animations: 'disabled' });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Fermer', exact: true }).click();
  // L'horloge suspendue évite que le DPS change l'étape pendant les assertions.
  const attaque = page.getByRole('button', { name: 'Attaque', exact: true });
  for (let clic = 0; clic < 300; clic++) {
    if (await page.getByText('Étape 2 sur 10', { exact: true }).isVisible()) break;
    await attaque.click();
    await page.clock.runFor(90);
  }
  await expect(page.getByText('Étape 2 sur 10', { exact: true })).toBeVisible();
  try {
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Route 1', exact: true })).toBeVisible();
    await expect(page.getByText('Étape 2 sur 10', { exact: true })).toBeVisible();
    await expect(attaque).toBeVisible();
    await attaque.click();
    await page.clock.runFor(100);
    await expect(page.locator('[aria-hidden="true"]').filter({ hasText: /^−/ }).first()).toBeVisible();
    const navigation = await page.goto('/route-inexistante');
    expect(navigation?.status()).toBe(200);
    await expect(page.getByRole('heading', { name: 'Route 1', exact: true })).toBeVisible();
    await expect(attaque).toBeVisible();
    expect(erreurs).toEqual([]);
    expect(externes).toEqual([]);
  } finally { await context.setOffline(false); }
});
