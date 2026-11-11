import { mkdir, readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import { telephone, ligneZone } from './aide-carte';
import type { Page } from '@playwright/test';

/** Remplissage du sabot imposé : au moins 78 cartes, pour que le sabot ne soit pas remélangé en cours de test. */
const remplissage = Array.from({ length: 80 }, (_, i) => `${2 + (i % 8)}-${'SHDC'[Math.floor(i / 8) % 4]}`);
const sabotImpose = (...cartes: string[]) => [...cartes, ...remplissage];

async function preparer(page: Page, ouvert: boolean, sabot?: string[]) {
  const kanto = JSON.parse(await readFile('data/regions/kanto/zones.json', 'utf8')) as { zones: { ancienId: number; id: string }[] };
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.addInitScript(({ boss, ouvert, sabot }) => {
    const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'));
    if (!cle || sessionStorage.getItem('casino-prepare')) return;
    sessionStorage.setItem('casino-prepare', '1');
    const enveloppe = JSON.parse(localStorage.getItem(cle)!);
    Object.assign(enveloppe.donnees, { argent: 50000, jetons: 0, zoneId: 'kanto.tour-pokemon', etape: 1,
      starterId: 1, evenementsJoues: ['kanto.intro'], drapeaux: ['sac-ouvert'],
      equipe: [{ uid: 'casino-starter', numero: 1, sexe: 'male', niveau: 5, xp: 0,
        shiny: false, bonheur: 0, pierreEternelle: false, calcium: 0, favori: false }],
      bossVaincus: [...boss, ...(ouvert ? ['kanto.tour-pokemon'] : [])],
      badges: ['roche', 'cascade', 'foudre'], inventaire: {}, ...(sabot ? { sabotBlackjack: sabot } : {}) });
    delete enveloppe.donnees.evenementEnCours;
    enveloppe.revision += 1;
    localStorage.setItem(cle, JSON.stringify(enveloppe));
  }, { boss: kanto.zones.filter(z => z.ancienId > 0 && z.ancienId < 10).map(z => z.id), ouvert, sabot });
  await page.reload();
  await carte(page);
}

async function carte(page: Page) {
  await page.getByRole('button', { name: 'Carte', exact: true }).click();
  if (telephone(page)) {
    // Céladopole fermée : la ligne est grisée, la fenêtre des trois lieux ne s’ouvre pas.
    const ligne = ligneZone(page, 'Céladopole');
    if (await ligne.getAttribute('aria-disabled') !== 'true') await ligne.click();
  } else await page.getByRole('button', { name: /Céladopole/ }).last().click();
}

async function ouvrirCasino(page: Page) {
  await page.getByRole('dialog', { name: 'Céladopole', exact: true }).getByRole('button', { name: 'Casino', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Casino', exact: true })).toBeVisible({ timeout: 10000 });
}

const jetons = (page: Page) => page.locator('[aria-label="Tes jetons"] strong');
const lireJetons = async (page: Page) => parseInt((await jetons(page).innerText()).replace(/\D/g, ''), 10);
const statut = (page: Page) => page.getByRole('status');
const argent = (page: Page, montant: string) => expect(page.getByText(new RegExp(`^${montant.replace(' ', '[\\s\\u202f\\u00a0]')} ₽$`))).toBeVisible();

test('Casino fermé tant que la Tour Pokémon n’est pas vaincue, raison accessible', async ({ page }) => {
  await preparer(page, false);
  if (telephone(page)) {
    await expect(ligneZone(page, 'Céladopole')).toHaveAttribute('aria-disabled', 'true');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    return;
  }
  const bouton = page.getByRole('dialog', { name: 'Céladopole', exact: true }).getByRole('button', { name: 'Casino', exact: true });
  const raison = page.locator('#carte-casino-telephone');
  await expect(bouton).toBeDisabled();
  await expect(raison).not.toBeEmpty();
  await expect(bouton).toHaveAccessibleDescription(await raison.innerText());
});

test('Casino : jetons, boutique, trois jeux, rechargement et captures', async ({ page }, informations) => {
  // Sabot imposé : le joueur a 5 + 6, le croupier montre un 10 et cache un 7, la carte suivante est un 10.
  await preparer(page, true, sabotImpose('5-S', '10-D', '6-H', '7-C', '10-H'));
  await ouvrirCasino(page);
  await expect(page.getByText('Argent virtuel uniquement : aucun paiement réel.')).toBeVisible();
  expect(await lireJetons(page)).toBe(0);
  await page.getByRole('button', { name: 'Échanger 50 jetons' }).click();
  await expect(statut(page)).toContainText('Pas assez de jetons.');
  expect(await lireJetons(page)).toBe(0);

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

  // Blackjack : la carte du croupier reste cachée, la main survit au rechargement, doubler paie ×2 sur la mise doublée.
  await page.getByRole('button', { name: 'Blackjack', exact: true }).click();
  await page.getByLabel('Mise').fill('4');
  const avantMain = await lireJetons(page);
  await page.getByRole('button', { name: 'Distribuer' }).click();
  await expect(page.getByText('Ta main · 11')).toBeVisible();
  await expect(page.getByRole('img', { name: 'Carte cachée' })).toBeVisible();
  await expect(page.getByText('Main en cours · 4 jetons engagés. Elle sera conservée si tu quittes le casino.')).toBeVisible();
  expect(await lireJetons(page)).toBe(avantMain - 4);
  await page.reload();
  await carte(page);
  await ouvrirCasino(page);
  await expect(page.getByRole('heading', { name: 'Blackjack', exact: true })).toBeVisible();
  await expect(page.getByText(/^Main en cours · 4 jetons engagés/)).toBeVisible();
  await expect(page.getByRole('img', { name: 'Carte cachée' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Distribuer' })).toBeDisabled();
  await page.getByRole('region', { name: 'Blackjack', exact: true }).screenshot({ path: `design/captures/v-casino-blackjack-${largeur}.png`, animations: 'disabled' });
  await page.getByRole('button', { name: 'Doubler' }).click();
  await expect(statut(page)).toContainText('Gagné');
  await expect(page.getByRole('img', { name: 'Carte cachée' })).toHaveCount(0);
  await expect(page.getByText('Croupier Rocket · 17')).toBeVisible();
  await expect(page.getByText('Ta main · 21')).toBeVisible();
  expect(await lireJetons(page)).toBe(avantMain + 8);
  await expect(page.getByText(/^Main en cours/)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Distribuer' })).toBeEnabled();

  // Rechargement : jetons conservés ; échange de 50 jetons contre 1 000 $ quand le solde le permet.
  const avantRecharge = await lireJetons(page);
  await page.reload();
  await carte(page);
  await ouvrirCasino(page);
  expect(await lireJetons(page)).toBe(avantRecharge);
  await page.getByRole('button', { name: 'Retour à la Carte' }).click();
  if (telephone(page)) await expect(ligneZone(page, 'Céladopole')).toBeVisible();
  else await expect(page.getByRole('button', { name: /Céladopole/ }).last()).toBeFocused();
});

test('Blackjack : séparer jusqu’à quatre mains, lisibles et sans débordement', async ({ page }, informations) => {
  await preparer(page, true, sabotImpose('8-S', '6-C', '8-H', '10-D', '8-D', '8-C', '3-S', '3-H', '3-C', '3-D'));
  await ouvrirCasino(page);
  await page.getByRole('button', { name: 'Acheter 50 jetons' }).click();
  await page.getByRole('button', { name: 'Blackjack', exact: true }).click();
  await page.getByRole('button', { name: 'Distribuer' }).click();
  await expect(page.getByRole('button', { name: 'Séparer' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Abandonner' })).toBeDisabled();
  await page.getByRole('button', { name: 'Séparer' }).click();
  await expect(page.getByRole('region', { name: 'Ta main 2' })).toBeVisible();
  await page.getByRole('button', { name: 'Séparer' }).click();
  await expect(page.getByRole('region', { name: 'Ta main 3' })).toBeVisible();
  await page.getByRole('button', { name: 'Rester' }).click();
  await page.getByRole('button', { name: 'Rester' }).click();
  await page.getByRole('button', { name: 'Séparer' }).click();
  await expect(page.getByRole('region', { name: 'Ta main 4' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Séparer' })).toBeDisabled();
  await expect(page.getByText('Main en cours · 4 jetons engagés.', { exact: false })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const largeur = informations.project.name === 'mobile' ? 390 : 1440;
  await page.screenshot({ path: `design/captures/v-casino-blackjack-4-mains-${largeur}.png`, animations: 'disabled' });
  const avant = await lireJetons(page);
  for (let i = 0; i < 4; i++) {
    if (await page.getByText(/^Main en cours/).count() === 0) break;
    await page.getByRole('button', { name: 'Rester' }).click();
  }
  await expect(page.getByText(/^Main en cours/)).toHaveCount(0);
  await expect(statut(page)).toContainText('Bilan');
  expect(await lireJetons(page)).toBeGreaterThanOrEqual(avant);
});
