import { mkdir, readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

async function preparer(page: Page, ouvert: boolean) {
  const kanto = JSON.parse(await readFile('data/regions/kanto/zones.json', 'utf8')) as { zones: { ancienId: number; id: string }[] };
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.addInitScript(({ boss, ouvert }) => {
    const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'));
    if (!cle || sessionStorage.getItem('casino-prepare')) return;
    sessionStorage.setItem('casino-prepare', '1');
    const enveloppe = JSON.parse(localStorage.getItem(cle)!);
    Object.assign(enveloppe.donnees, { argent: 50000, jetons: 0, zoneId: 'kanto.tour-pokemon', etape: 1,
      starterId: 1, evenementsJoues: ['kanto.intro'], drapeaux: ['sac-ouvert'],
      equipe: [{ uid: 'casino-starter', numero: 1, sexe: 'male', niveau: 5, xp: 0,
        shiny: false, bonheur: 0, pierreEternelle: false, calcium: 0, favori: false }],
      bossVaincus: [...boss, ...(ouvert ? ['kanto.tour-pokemon'] : [])],
      badges: ['roche', 'cascade', 'foudre'], inventaire: {} });
    delete enveloppe.donnees.evenementEnCours;
    enveloppe.revision += 1;
    localStorage.setItem(cle, JSON.stringify(enveloppe));
  }, { boss: kanto.zones.filter(z => z.ancienId > 0 && z.ancienId < 10).map(z => z.id), ouvert });
  await page.reload();
  await carte(page);
}

async function carte(page: Page) {
  await page.getByRole('button', { name: 'Carte', exact: true }).click();
  await page.getByRole('button', { name: /Céladopole/ }).click();
}

async function ouvrirCasino(page: Page) {
  await page.getByRole('button', { name: 'Casino', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Casino', exact: true })).toBeVisible();
}

const jetons = (page: Page) => page.locator('[aria-label="Tes jetons"] strong');
const lireJetons = async (page: Page) => parseInt((await jetons(page).innerText()).replace(/\D/g, ''), 10);
const statut = (page: Page) => page.getByRole('status');
const argent = (page: Page, montant: string) => expect(page.getByText(new RegExp(`^${montant.replace(' ', '[\\s\\u202f\\u00a0]')} \\$$`))).toBeVisible();

test('Casino fermé tant que la Tour Pokémon n’est pas vaincue, raison accessible', async ({ page }) => {
  await preparer(page, false);
  const bouton = page.getByRole('button', { name: 'Casino', exact: true });
  await expect(bouton).toBeDisabled();
  await expect(page.locator('#carte-casino')).not.toBeEmpty();
  await expect(bouton).toHaveAccessibleDescription(await page.locator('#carte-casino').innerText());
});

test('Casino : jetons, boutique, trois jeux, rechargement et captures', async ({ page }, informations) => {
  await preparer(page, true);
  await ouvrirCasino(page);
  await expect(page.getByText('Argent virtuel uniquement : aucun paiement réel.')).toBeVisible();
  expect(await lireJetons(page)).toBe(0);
  await expect(page.getByRole('button', { name: 'Échanger 50 jetons' })).toBeDisabled();

  // Jetons : 1 000 $ → 50 jetons, cinq fois pour 250 jetons.
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Acheter 50 jetons' }).click();
  expect(await lireJetons(page)).toBe(250);
  await argent(page, '45 000');

  // Boutique : Abra à 250 jetons, le Master Ball reste hors de portée avec la raison.
  await page.getByRole('button', { name: 'Boutique', exact: true }).click();
  const master = page.getByRole('button', { name: /^Obtenir Master Ball/ });
  await expect(master).toBeDisabled();
  await expect(master).toHaveAccessibleDescription(/jetons/i);
  await page.getByRole('button', { name: 'Obtenir Abra' }).click();
  await expect(statut(page)).toContainText('Abra');
  expect(await lireJetons(page)).toBe(0);
  await mkdir('design/captures', { recursive: true });
  const largeur = informations.project.name === 'mobile' ? 390 : 1440;
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.screenshot({ path: `design/captures/v-casino-boutique-${largeur}.png`, animations: 'disabled' });

  // Pile ou face et machine à sous : la mise est débitée, le résultat annoncé (tirage non fixé, bornes vérifiées).
  await page.getByRole('button', { name: 'Acheter 50 jetons' }).click();
  await page.getByRole('button', { name: 'Pile ou face', exact: true }).click();
  await page.getByRole('button', { name: 'Pile', exact: true }).click();
  await page.getByLabel('Mise').fill('10');
  await page.getByRole('button', { name: 'Lancer' }).click();
  await expect(statut(page)).toContainText(/Pile|Face/);
  expect([40, 60]).toContain(await lireJetons(page));
  const apresPile = await lireJetons(page);
  await page.getByRole('button', { name: 'Machine à sous', exact: true }).click();
  await page.getByLabel('Mise').fill('5');
  await page.getByRole('button', { name: 'Lancer' }).click();
  await expect(statut(page)).toContainText(/Perdu|Gagné|Baie/);
  expect(await lireJetons(page)).toBeGreaterThanOrEqual(apresPile - 5);
  await page.screenshot({ path: `design/captures/v-casino-machine-${largeur}.png`, animations: 'disabled' });

  // Blackjack : une main distribuée, puis résolue ; une main en cours survit au rechargement.
  await page.getByRole('button', { name: 'Blackjack', exact: true }).click();
  await page.getByLabel('Mise').fill('4');
  const avantMain = await lireJetons(page);
  await page.getByRole('button', { name: 'Distribuer' }).click();
  const enCours = await page.getByText(/^Main en cours/).isVisible();
  if (enCours) {
    await expect(page.getByText('Main en cours · 4 jetons engagés. Elle sera conservée si tu quittes le casino.')).toBeVisible();
    expect(await lireJetons(page)).toBe(avantMain - 4);
    await page.reload();
    await carte(page);
    await ouvrirCasino(page);
    await expect(page.getByRole('heading', { name: 'Blackjack', exact: true })).toBeVisible();
    await expect(page.getByText(/^Main en cours · 4 jetons engagés/)).toBeVisible();
    await page.screenshot({ path: `design/captures/v-casino-blackjack-${largeur}.png`, animations: 'disabled' });
    await page.getByRole('button', { name: 'Rester' }).click();
  }
  await expect(page.getByText(/^Main en cours/)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Distribuer' })).toBeEnabled();

  // Rechargement : jetons conservés ; échange de 50 jetons contre 1 000 $ quand le solde le permet.
  const avantRecharge = await lireJetons(page);
  await page.reload();
  await carte(page);
  await ouvrirCasino(page);
  expect(await lireJetons(page)).toBe(avantRecharge);
  await page.getByRole('button', { name: 'Retour à la Carte' }).click();
  await expect(page.getByRole('region', { name: 'Zone sélectionnée' })).toBeVisible();
});
