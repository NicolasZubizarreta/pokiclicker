import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import zones from '../data/regions/kanto/zones.json' with { type: 'json' };

const bossAvantLigue = zones.zones.slice(1, 21).map(zone => zone.id);

const instant = new Date('2026-10-25T12:00:00Z');
const noms = [
  'Olga (Lokhlass)', 'Olga (Lippoutou)', 'Aldo (Mackogneur)', 'Aldo (Onix)',
  'Agatha (Ectoplasma)', 'Agatha (Arbok)', 'Peter (Dracolosse)', 'Peter (Léviator)',
  'Maître Blue (Roucarnage)', 'Maître Blue (Florizarre)',
];

async function demarrer(page: Page, badges: number) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install({ time: instant });
  await page.clock.pauseAt(instant);
  await page.addInitScript(() => { Math.random = () => 0.1; });
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.addInitScript(({ nombre, vaincus }) => {
    if (sessionStorage.getItem('ligue-prepare')) return;
    sessionStorage.setItem('ligue-prepare', '1');
    const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'))!;
    const enveloppe = JSON.parse(localStorage.getItem(cle)!);
    const region = enveloppe.donnees;
    region.equipe = [3, 6, 9, 65, 94, 149].map(numero => ({
      uid: `ligue-${numero}`, numero, niveau: 100, xp: 0, shiny: false,
      bonheur: 0, pierreEternelle: false, calcium: 0, sexe: 'male', favori: false,
    }));
    region.zoneId = 'kanto.route-victoire';
    region.etape = 1;
    region.bossVaincus = vaincus;
    region.badges = ['roche', 'cascade', 'foudre', 'prisme', 'ame', 'marais', 'volcan', 'terre'].slice(0, nombre);
    region.starterId = 7;
    region.ligueGagnee = 0;
    enveloppe.revision += 1;
    localStorage.setItem(cle, JSON.stringify(enveloppe));
  }, { nombre: badges, vaincus: bossAvantLigue });
  await page.reload();
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  // Garder le contrôle des dix combats, y compris après le rechargement.
  const arret = page.getByRole('button', { name: 'Arrêt auto', exact: true });
  if (await arret.getAttribute('aria-pressed') === 'true') await arret.click();
  const auto = page.getByRole('button', { name: 'Auto-attaque', exact: true });
  if (await auto.getAttribute('aria-pressed') !== 'true') await auto.click();
  await page.getByRole('button', { name: 'Carte', exact: true }).click();
  await page.locator('[data-forme="Ligue Pokémon"]').first().focus();
  await page.keyboard.press('Enter');
}

async function regionSauvee(page: Page) {
  return page.evaluate(() => {
    const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'))!;
    return JSON.parse(localStorage.getItem(cle)!).donnees;
  });
}

async function reprendreA(page: Page, etape: number) {
  await page.evaluate(numero => {
    const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'))!;
    const enveloppe = JSON.parse(localStorage.getItem(cle)!);
    enveloppe.donnees.etape = numero;
    enveloppe.revision += 1;
    localStorage.setItem(cle, JSON.stringify(enveloppe));
  }, etape);
  await page.reload();
}

test('Ligue fermée avec sept badges : raison du badge Terre sur la carte', async ({ page }) => {
  await demarrer(page, 7);
  const fiche = page.getByRole('region', { name: 'Zone sélectionnée' });
  await expect(fiche).toContainText('Bloquée');
  await expect(fiche).toContainText('Il te faut le badge Terre.');
  await expect(page.getByRole('button', { name: 'Y aller' })).toHaveCount(0);
  expect((await regionSauvee(page)).zoneId).toBe('kanto.route-victoire');
});

test('Huit badges : dix adversaires dans l’ordre de la V1, avec le counter de Carapuce, repris à leur étape', async ({ page }) => {
  test.setTimeout(120_000);
  await demarrer(page, 8);
  await page.getByRole('button', { name: 'Y aller' }).click();
  await page.clock.runFor(400);
  await expect(page.getByRole('heading', { name: 'Ligue Pokémon', exact: true })).toBeVisible();
  expect((await regionSauvee(page)).zoneId).toBe('kanto.ligue-pokemon');
  // Les dix adversaires, dans l'ordre de la V1, chacun repris à son étape sauvegardée (un combat réel dure plus de 30 s de jeu).
  for (const [index, nom] of noms.entries()) {
    const etape = index + 1;
    if (etape > 1) await reprendreA(page, etape);
    await expect(page.getByText(`Étape ${etape} sur 10`, { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: nom, exact: true })).toBeVisible();
    expect((await regionSauvee(page)).etape).toBe(etape);
  }
  expect((await regionSauvee(page)).ligueGagnee).toBe(0);
});
