import { mkdir } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

async function ouvrirEquipe(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.getByRole('button', { name: 'Équipe', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Ton équipe', level: 1 })).toBeVisible();
}

async function renommer(page: Page, ancien: string, nouveau: string) {
  await page.getByRole('button', { name: new RegExp(`^${ancien}, niveau`, 'i') }).first().click();
  const fiche = page.locator('dialog[open]').first();
  if (!(await fiche.isVisible())) await page.getByRole('button', { name: 'Ouvre la fiche' }).click();
  await expect(fiche).toBeVisible();
  await fiche.getByRole('button', { name: `Renommer ${ancien}` }).click();
  await fiche.getByRole('textbox').fill(nouveau);
  await fiche.getByRole('textbox').press('Enter');
  await expect(fiche.getByRole('heading', { level: 2 }).first()).toContainText(nouveau);
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
}

const sprite = (page: Page, nom: string) => page.getByRole('button', { name: new RegExp(`^${nom}, niveau`, 'i') }).first().locator('img').first();

test('Easter eggs : chaque nom déclencheur change le sprite, le surnom suivant l’efface, le rechargement garde l’effet', async ({ page }, informations) => {
  await ouvrirEquipe(page);
  await renommer(page, 'Bulbizarre', 'jeb_');
  await renommer(page, 'Salamèche', 'DinnerBone');
  await renommer(page, 'Carapuce', 'caca');
  await expect(sprite(page, 'jeb_')).toHaveClass(/ee-arc-en-ciel/);
  await expect(sprite(page, 'DinnerBone')).toHaveClass(/ee-retourne/);
  await expect(sprite(page, 'caca')).toHaveClass(/ee-caca/);
  await mkdir('design/captures', { recursive: true });
  const largeur = informations.project.name === 'mobile' ? 390 : 1440;
  await page.screenshot({ path: `design/captures/w-easter-eggs-${largeur}.png`, animations: 'disabled' });

  await page.reload();
  await page.getByRole('button', { name: 'Équipe', exact: true }).click();
  await expect(sprite(page, 'jeb_')).toHaveClass(/ee-arc-en-ciel/);
  await expect(sprite(page, 'DinnerBone')).toHaveClass(/ee-retourne/);
  await expect(sprite(page, 'caca')).toHaveClass(/ee-caca/);

  // Grumm retourne aussi ; Daran remplace le sprite par la photo du stade ; Bjorn et Gabriel ne font rien.
  await renommer(page, 'DinnerBone', 'grumm');
  await expect(sprite(page, 'grumm')).toHaveClass(/ee-retourne/);
  await renommer(page, 'jeb_', 'Daran');
  await expect(sprite(page, 'Daran')).toHaveAttribute('src', /easter-eggs\/daran-stade-1\.webp$/);
  await renommer(page, 'caca', 'Bjorn');
  await expect(sprite(page, 'Bjorn')).not.toHaveClass(/ee-/);
  await expect(sprite(page, 'Bjorn')).toHaveAttribute('src', /sprites\/pokemon\/7\.png$/);
  await renommer(page, 'Bjorn', 'Gabriel');
  await expect(sprite(page, 'Gabriel')).not.toHaveClass(/ee-/);

  // Un autre surnom efface l'effet.
  await renommer(page, 'grumm', 'Flammèche');
  await expect(sprite(page, 'Flammèche')).not.toHaveClass(/ee-/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test('Easter eggs : mouvement réduit, jeb_ garde une couleur fixe', async ({ page }) => {
  await ouvrirEquipe(page);
  await renommer(page, 'Bulbizarre', 'jeb_');
  const animation = await sprite(page, 'jeb_').evaluate(image => getComputedStyle(image).animationName);
  expect(animation).toBe('none');
});
