import { mkdir } from 'node:fs/promises';
import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const test = base.extend<{ surveillance: void }>({
  surveillance: [async ({ page }, utiliser) => {
    const erreurs: string[] = [];
    const requetesExternes: string[] = [];
    page.on('console', message => { if (message.type() === 'error') erreurs.push(message.text()); });
    page.on('pageerror', erreur => erreurs.push(erreur.message));
    page.on('request', requete => {
      if (new URL(requete.url()).hostname !== 'localhost') requetesExternes.push(requete.url());
    });
    await utiliser();
    expect.soft(erreurs, 'Erreurs de console ou de page').toEqual([]);
    expect.soft(requetesExternes, 'Requêtes hors de localhost').toEqual([]);
  }, { auto: true }],
});

async function demarrer(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.addInitScript(() => {
    const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'));
    if (!cle || sessionStorage.getItem('capture-prepare')) return;
    sessionStorage.setItem('capture-prepare', '1');
    const enveloppe = JSON.parse(localStorage.getItem(cle)!);
    enveloppe.donnees.inventaire = { pokeball: 5, superball: 2, hyperball: 1, masterball: 3 };
    enveloppe.revision += 1;
    localStorage.setItem(cle, JSON.stringify(enveloppe));
  });
  await page.reload();
  await expect(page.getByRole('button', { name: 'Master Ball ×3' })).toBeVisible();
}

test('capture certaine : équipe, Pokédex, stock et largeur', async ({ page }, informations) => {
  await demarrer(page);
  await page.getByRole('button', { name: 'Master Ball ×3' }).click();
  await page.getByRole('button', { name: 'Capturer', exact: true }).click();
  const annonce = page.getByText(/^.+ est capturé !$/);
  await expect(annonce).toBeVisible();
  const nom = (await annonce.textContent())!.replace(' est capturé !', '');
  await expect(page.getByRole('button', { name: 'Master Ball ×2' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await mkdir('design/captures', { recursive: true });
  await page.evaluate(() => Promise.all([...document.images].map(image => image.decode().catch(() => undefined))));
  const largeur = informations.project.name === 'mobile' ? 390 : 1440;
  await page.screenshot({ path: `design/captures/j-capture-${largeur}.png`, animations: 'disabled' });
  await page.getByRole('button', { name: 'Équipe', exact: true }).click();
  await expect(page.getByText(/· 4 \/ 6$/)).toBeVisible();
  await expect(page.getByRole('button', { name: new RegExp(`^${nom}, niveau`) }).last()).toBeVisible();
  await page.getByRole('button', { name: 'Plus', exact: true }).click();
  await page.getByRole('button', { name: /^Pokédex/ }).click();
  // Un doublon d'un Pokémon de départ ne change pas le Pokédex (comme en V1).
  await expect(page.getByText(['Bulbizarre', 'Salamèche', 'Carapuce'].includes(nom) ? '3 / 151' : '4 / 151')).toBeVisible();
});

test('échec : la Pokéball est consommée', async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0.99999; });
  await demarrer(page);
  await page.getByRole('button', { name: 'Pokéball ×5', exact: true }).click();
  await page.getByRole('button', { name: 'Capturer', exact: true }).click();
  await expect(page.getByText(/s'est échappé !$/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pokéball ×4', exact: true })).toBeVisible();
});

test('arrêt automatique sur chaque nouveau Pokémon, à chaque apparition', async ({ page }) => {
  // Aléa fixé : toujours un Rattata, nouveau tant qu'il n'est pas capturé (comme en V1).
  await page.addInitScript(() => { Math.random = () => 0.1; });
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.clock.runFor(100);
  const message = page.getByText('Nouveau Pokémon ! Auto-attaque arrêtée.', { exact: true });
  await expect(message).toBeVisible();
  const auto = page.getByRole('button', { name: 'Auto-attaque', exact: true });
  await expect(auto).toHaveAttribute('aria-pressed', 'false');
  for (let appui = 0; appui < 200 && !(await page.getByText('Étape 2 sur 10', { exact: true }).isVisible()); appui++) {
    await page.getByRole('button', { name: /^Attaquer / }).click({ force: true });
    await page.clock.runFor(90);
  }
  // La victoire reprend l'auto-attaque, puis l'ennemi suivant (encore nouveau) l'arrête de nouveau.
  await expect(page.getByText('Étape 2 sur 10', { exact: true })).toBeVisible();
  await page.clock.runFor(2000);
  await expect(auto).toHaveAttribute('aria-pressed', 'false');
});

test('réglages conservés au rechargement', async ({ page }) => {
  await demarrer(page);
  await page.getByRole('button', { name: 'Arrêt auto', exact: true }).click();
  await page.getByRole('button', { name: "Réglages de l'arrêt", exact: true }).click();
  await page.getByRole('checkbox', { name: 'Rare', exact: true }).uncheck();
  await page.getByRole('button', { name: 'Fermer', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Arrêt auto', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: "Réglages de l'arrêt", exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Rare', exact: true })).not.toBeChecked();
});

test('boss : capture désactivée avec sa raison', async ({ page }) => {
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await demarrer(page);
  await page.getByRole('button', { name: 'Arrêt auto', exact: true }).click();
  const auto = page.getByRole('button', { name: 'Auto-attaque', exact: true });
  if (await auto.getAttribute('aria-pressed') === 'false') await auto.click();
  for (let appui = 0; appui < 1500; appui++) {
    if (await page.getByRole('status').filter({ hasText: 'Recherche en cours…' }).isVisible()) await page.clock.runFor(2000);
    if (await page.getByText('Étape 10 sur 10', { exact: true }).isVisible()) break;
    await page.getByRole('button', { name: /^Attaquer / }).click({ force: true });
    await page.clock.runFor(90);
  }
  await expect(page.getByText('Étape 10 sur 10', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Capturer', exact: true })).toBeDisabled();
  await expect(page.getByText('Ce Pokémon ne peut pas être capturé.', { exact: true })).toBeVisible();
});
