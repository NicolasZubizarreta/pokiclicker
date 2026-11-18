import { expect, type Locator, type Page } from '@playwright/test';

// Le Sac s’ouvre en fenêtre depuis le PC sur tous les écrans.
export async function ouvrirSac(page: Page): Promise<Locator> {
  await page.getByRole('button', { name: 'PC', exact: true }).click();
  await page.getByRole('button', { name: 'Sac', exact: true }).click();
  const sac = page.locator('dialog[open]').getByRole('region', { name: 'Sac', exact: true });
  await expect(sac).toBeVisible();
  return sac;
}

// Ferme la fenêtre du Sac.
export async function fermerSac(page: Page) {
  await page.locator('dialog[open]').getByRole('button', { name: 'Fermer', exact: true }).click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
}

// Message qui invite à toucher un Pokémon une fois l'objet choisi dans le Sac.
export const invitationChoix = (page: Page, objet: string) => page.getByText(new RegExp(`^${objet} ×\\d+ : touche un Pokémon$`));
