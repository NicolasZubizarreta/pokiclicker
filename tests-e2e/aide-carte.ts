import type { Page } from '@playwright/test';

/** Vrai sous 1024 px : la Carte est alors la version téléphone (liste qui défile, carte non cliquable, vol au toucher). */
export const telephone = (page: Page) => (page.viewportSize()?.width ?? 1440) < 1024;

/** Zone de la liste du téléphone (nom exact, sans le suffixe « (Zone N) »). */
export const ligneZone = (page: Page, nom: string) =>
  page.getByRole('list', { name: 'Zones de Kanto' }).getByRole('button', { name: new RegExp(String.raw`^${nom}( \(Zone \d+\))?(,|$)`) });

/** Voyager vers une zone ouverte : un toucher sur téléphone, repère + « Y aller » sur PC. La Carte doit être ouverte. */
export async function voyagerVers(page: Page, nom: string) {
  if (telephone(page)) { await ligneZone(page, nom).click(); return; }
  await page.locator(`[data-forme="${nom}"]`).first().focus();
  await page.keyboard.press('Enter');
  // Une annonce de déblocage « Y aller » (casino, pension) peut être affichée en même temps : on vise la zone sélectionnée.
  await page.getByRole('region', { name: 'Zone sélectionnée' }).getByRole('button', { name: 'Y aller', exact: true }).click();
}
