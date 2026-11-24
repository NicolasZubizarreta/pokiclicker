import { expect, type Page } from '@playwright/test';

// Le combat n'a pas les mêmes boutons sur PC et sur téléphone : ces aides acceptent les deux noms.
export const autoAttaque = (page: Page) => page.getByRole('button', { name: /^(Auto-attaque|Attaque auto)$/ });
export const reglageArret = (page: Page) => page.getByRole('button', { name: /^(Réglages de l'arrêt|Réglage de l'arrêt auto)$/ });

/** Plaque de la balle choisie (PC et téléphone) : « <Balle> ×<quantité>, changer de balle ». */
export function balle(page: Page, nom: string, quantite: number) {
  return page.getByRole('button', { name: `${nom} ×${quantite}, changer de balle`, exact: true });
}

// La plaque ouvre la fenêtre « Choisis une balle » : un bouton par balle possédée, sur PC comme sur téléphone.
export async function choisirBalle(page: Page, nom: string, quantite: number) {
  const cible = balle(page, nom, quantite);
  if (await cible.isVisible()) return;
  await page.getByRole('button', { name: /, changer de balle$/ }).click();
  const fenetre = page.getByRole('dialog', { name: 'Choisis une balle' });
  await fenetre.getByRole('button', { name: `${nom} ×${quantite}`, exact: true }).click();
  await expect(fenetre).toBeHidden();
  await expect(cible).toBeVisible();
}
