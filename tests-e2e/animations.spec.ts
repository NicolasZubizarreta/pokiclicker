import { test, expect } from '@playwright/test';

test('le sprite flotte et se secoue au toucher', async ({ page }) => {
  await page.goto('/');
  const attaque = page.getByRole('button', { name: /^Attaquer / });
  await expect(attaque).toBeVisible();
  const sprite = page.locator('img[alt]:not([alt=""])').filter({ visible: true }).first();
  const animations = (nom: string) => sprite.evaluate((image, nomAnimation) => {
    const secousse = image.closest('div')!;
    const flottement = secousse.parentElement!;
    return {
      flottement: getComputedStyle(flottement).animationName,
      secousses: secousse.getAnimations().filter(animation => (animation.effect?.getTiming().duration ?? 0) === 300).length,
      nom: nomAnimation,
    };
  }, nom);
  expect((await animations('base')).flottement).toBe('flottement');
  await attaque.click();
  expect((await animations('apres')).secousses).toBeGreaterThan(0);
});

test('mouvement réduit : aucune animation de combat', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const attaque = page.getByRole('button', { name: /^Attaquer / });
  await expect(attaque).toBeVisible();
  await attaque.click();
  const total = await page.evaluate(() => document.getAnimations().filter(animation => animation instanceof CSSAnimation
    && ['flottement', 'degats'].includes(animation.animationName)).length);
  expect(total).toBe(0);
});

test('le contexte audio ne naît qu’au premier geste et le Son coupé reste coupé après rechargement', async ({ page }) => {
  await page.addInitScript(() => {
    const fenetre = window as unknown as { __contextes: number; AudioContext: unknown };
    fenetre.__contextes = 0;
    const Original = window.AudioContext;
    fenetre.AudioContext = class extends Original { constructor() { super(); fenetre.__contextes++; } };
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __contextes: number }).__contextes)).toBe(0);
  await page.getByRole('button', { name: /^Attaquer / }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __contextes: number }).__contextes)).toBe(1);
  await page.getByRole('button', { name: 'Plus', exact: true }).click();
  const interrupteur = page.getByRole('switch', { name: /Son/ });
  await expect(interrupteur).toHaveAttribute('aria-checked', 'true');
  await interrupteur.click();
  await expect(interrupteur).toHaveAttribute('aria-checked', 'false');
  await page.reload();
  await page.getByRole('button', { name: 'Plus', exact: true }).click();
  await expect(page.getByRole('switch', { name: /Son/ })).toHaveAttribute('aria-checked', 'false');
});
