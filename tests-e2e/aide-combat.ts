import { expect, type Page } from '@playwright/test';

// Le combat n'a pas les mêmes boutons sur PC et sur téléphone : ces aides acceptent les deux noms.
export const autoAttaque = (page: Page) => page.getByRole('button', { name: /^(Auto-attaque|Attaque auto)$/ });
export const reglageArret = (page: Page) => page.getByRole('button', { name: /^(Réglages de l'arrêt|Réglage de l'arrêt auto)$/ });
const plaqueBalle = (page: Page) => page.getByRole('button', { name: /^Balle choisie : / });

export function balle(page: Page, nom: string, quantite: number) {
  return page.getByRole('button', { name: new RegExp(`^(${nom} ×${quantite}|Balle choisie : ${nom}, ×${quantite}\\. Toucher pour changer)$`) });
}

// PC : un bouton par balle. Téléphone : une plaque qui passe à la balle suivante à chaque toucher.
export async function choisirBalle(page: Page, nom: string, quantite: number) {
  const cible = balle(page, nom, quantite);
  const plaque = plaqueBalle(page);
  if (await plaque.count() === 0) { await cible.click(); return; }
  for (let essai = 0; essai < 4 && !(await cible.isVisible()); essai++) await plaque.click();
  await expect(cible).toBeVisible();
}
