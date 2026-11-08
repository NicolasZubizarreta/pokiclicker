import { test, expect } from '@playwright/test';
import { ouvrirSac } from './aide-sac';

test.beforeEach(async ({ page }) => {
  const instant = new Date('2026-10-25T12:00:00Z');
  await page.clock.install({ time: new Date(instant.getTime() - 1000) });
  await page.clock.pauseAt(instant);
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.evaluate(() => {
    const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'))!;
    const sauvegarde = JSON.parse(localStorage.getItem(cle)!);
    sauvegarde.donnees.equipe = [1, 4].map(numero => ({ uid: `persistant-${numero}`, numero, niveau: 16, xp: 0,
      shiny: false, bonheur: 0, pierreEternelle: false, calcium: 0, sexe: 'male', favori: false }));
    sauvegarde.donnees.inventaire = { bonbon: 3, shinyToken: 2 };
    sauvegarde.donnees.bossVaincus = ['kanto.route-1'];
    sauvegarde.revision += 1;
    localStorage.setItem(cle, JSON.stringify(sauvegarde));
  });
  await page.reload();
});

test('applications successives, annulation, fermeture, navigation et épuisement', async ({ page }) => {
  await (await ouvrirSac(page)).getByRole('button', { name: 'Bonbon ×3', exact: true }).click();
  for (const [index, nom] of ['Bulbizarre', 'Salamèche'].entries()) {
    const carte = page.getByRole('button', { name: `${nom}, niveau 16`, exact: true });
    await carte.click();
    await page.getByRole('button', { name: 'Valider', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: 'touche un Pokémon' })).toHaveText(`Bonbon ×${2 - index} : touche un Pokémon`);
    await expect(page.getByRole('button', { name: `${nom}, niveau 17`, exact: true })).toBeFocused();
  }
  await page.getByRole('button', { name: 'Bulbizarre, niveau 17', exact: true }).click();
  await page.getByRole('button', { name: 'Annuler', exact: true }).click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Fermer', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Ton Sac' })).toBeVisible();
  await page.getByRole('button', { name: 'Bonbon ×1', exact: true }).click();
  await page.getByRole('button', { name: 'Combat', exact: true }).click();
  await page.getByRole('button', { name: 'Équipe', exact: true }).click();
  await expect(page.getByText(/touche un Pokémon/)).toHaveCount(0);
  await (await ouvrirSac(page)).getByRole('button', { name: 'Bonbon ×1', exact: true }).click();
  await page.getByRole('button', { name: 'Bulbizarre, niveau 17', exact: true }).click();
  await page.getByRole('button', { name: 'Valider', exact: true }).click();
  await expect(page.getByText(/touche un Pokémon/)).toHaveCount(0);
  await expect(page.locator('[data-notifications]')).toContainText('Plus de Bonbon.');
});

test('dimensions calculées des confirmations et des sélecteurs', async ({ page }, informations) => {
  for (const largeur of informations.project.name === 'pc' ? [1024, 1280, 1440, 1920, 2560] : [390]) {
    await page.setViewportSize({ width: largeur, height: 900 });
    for (const objet of ['Jeton Shiny ×2', 'Bonbon ×3']) {
      await (await ouvrirSac(page)).getByRole('button', { name: objet, exact: true }).click();
      await page.getByRole('button', { name: 'Bulbizarre, niveau 16', exact: true }).click();
      const groupe = page.getByRole('group', { name: objet.startsWith('Jeton') ? 'Utiliser Jeton Shiny sur Bulbizarre ?' : 'Quantité', exact: true });
      const dimensions = await groupe.getByRole('button').evaluateAll(boutons => boutons.map(b => {
        const style = getComputedStyle(b);
        return { largeur: parseFloat(style.width), hauteur: parseFloat(style.height), padding: style.padding, flex: style.flex };
      }));
      for (const dimension of dimensions) {
        expect(Math.abs(dimension.largeur - dimension.hauteur)).toBeLessThanOrEqual(1);
        expect(dimension.largeur).toBeGreaterThanOrEqual(48);
        expect(dimension.largeur).toBeCloseTo(dimensions[0]!.largeur, 0);
      }
      await groupe.getByRole('button', { name: 'Annuler', exact: true }).click();
      await page.getByRole('button', { name: 'Fermer', exact: true }).click();
      await page.getByRole('dialog', { name: 'Ton Sac' }).getByRole('button', { name: 'Fermer', exact: true }).click();
    }
  }
});
