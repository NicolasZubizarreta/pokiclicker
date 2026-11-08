import type { Page } from '@playwright/test';

/** Rayon du Shop : onglet « Rayons » sur PC (1024 px et plus), bouton du groupe « Catégories » sur téléphone. */
export const rayon = (page: Page, nom: string) =>
  page.getByRole('tablist', { name: 'Rayons' }).or(page.getByRole('group', { name: 'Catégories' })).getByText(nom, { exact: true });