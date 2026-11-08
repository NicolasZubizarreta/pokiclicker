import { expect, type Locator, type Page } from '@playwright/test';
import { telephone } from './aide-carte';

// Téléphone et PC : le Sac est une fenêtre ouverte par le bouton « Sac » du Combat (téléphone) ou de l'Équipe (PC, où la touche S l'ouvre aussi).
export async function ouvrirSac(page: Page): Promise<Locator> {
  await page.getByRole('button', { name: telephone(page) ? 'Combat' : 'Équipe', exact: true }).click();
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
export const invitationChoix = (page: Page, objet: string) => page.getByText(`${objet} : touche un Pokémon`, { exact: true });
