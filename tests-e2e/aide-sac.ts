import { expect, type Locator, type Page } from '@playwright/test';
import { telephone } from './aide-carte';

// Grand écran : le Sac est un onglet de l'Équipe. Téléphone : une fenêtre ouverte par le bouton « Sac » du Combat.
export async function ouvrirSac(page: Page): Promise<Locator> {
  if (telephone(page)) {
    await page.getByRole('button', { name: 'Combat', exact: true }).click();
    await page.getByRole('button', { name: 'Sac', exact: true }).click();
    const sac = page.locator('dialog[open]').getByRole('region', { name: 'Sac', exact: true });
    await expect(sac).toBeVisible();
    return sac;
  }
  await page.getByRole('button', { name: 'Équipe', exact: true }).click();
  return page.getByRole('region', { name: 'Sac', exact: true });
}

// Ferme la fenêtre du Sac sur téléphone ; sur grand écran, il n'y a rien à fermer.
export async function fermerSac(page: Page) {
  if (!telephone(page)) return;
  await page.locator('dialog[open]').getByRole('button', { name: 'Fermer', exact: true }).click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
}

// Message qui invite à toucher un Pokémon une fois l'objet choisi dans le Sac.
export const invitationChoix = (page: Page, objet: string) => telephone(page)
  ? page.getByText(`${objet} : touche un Pokémon`, { exact: true })
  : page.getByText('Sélectionne un Pokémon.', { exact: true });
