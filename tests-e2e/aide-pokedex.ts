import type { Locator, Page } from '@playwright/test';
import { telephone } from './aide-carte';

// Grand écran : une liste d'espèces. Téléphone : une grille de boutons « Nom, numéro N, déjà capturé ».
export const casesPokedex = (page: Page): Locator => telephone(page)
  ? page.getByRole('button', { name: /(, numéro \d+, (déjà capturé|vu, pas encore capturé)|^Pokémon inconnu, numéro \d+)$/ })
  : page.getByRole('listitem');

export const caseEspece = (page: Page, nom: string): Locator => telephone(page)
  ? page.getByRole('button', { name: new RegExp(`^${nom}, numéro \\d+, déjà capturé$`) })
  : page.getByRole('listitem').filter({ hasText: nom });
