import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Ticket M : contrôle automatique d'accessibilité (axe, règles WCAG 2 A et AA) sur chaque page, au téléphone et sur PC ;
// clavier : tout contrôle est atteignable par Tab, dans l'ordre du document, avec un focus visible ; lecteur d'écran :
// peu de régions d'état à la fois. Le projet « pc » couvre la mise en page PC, « mobile » celle du téléphone.
test.beforeEach(({}, info) => { test.skip(!['pc', 'mobile'].includes(info.project.name), 'Projets « pc » et « mobile » seulement'); });

const attaquer = (page: Page) => page.getByRole('button', { name: /^Attaquer / });

async function demarrer(page: Page, bourg = false) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(attaquer(page)).toBeVisible();
  const zones = (await readFile('data/regions/kanto/zones.json', 'utf8'));
  const boss = (JSON.parse(zones) as { zones: { ancienId: number; id: string }[] }).zones.filter(z => z.ancienId > 0 && z.ancienId <= 10).map(z => z.id);
  // Partie bien remplie : un PC de 28 Pokémon (tous les types ou presque, un shiny), de l'argent ; au besoin à Bourg Palette (pension ouverte).
  await page.addInitScript(({ bourg, boss }) => {
    const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'));
    if (!cle || sessionStorage.getItem('axe-prepare')) return;
    sessionStorage.setItem('axe-prepare', '1');
    const enveloppe = JSON.parse(localStorage.getItem(cle)!);
    if (bourg) Object.assign(enveloppe.donnees, { bossVaincus: boss, zoneId: 'kanto.bourg-palette', etape: 1 });
    const especes = [1, 4, 7, 16, 19, 25, 35, 39, 52, 54, 58, 60, 63, 66, 74, 77, 79, 92, 95, 96, 104, 109, 111, 116, 129, 133, 143, 147];
    enveloppe.donnees.pc = especes.map((numero, i) => ({ uid: `pc-${i}`, numero, niveau: 1 + (i * 7) % 60, xp: 0, shiny: i === 3,
      bonheur: 0, pierreEternelle: false, calcium: 0, sexe: 'male', favori: i % 5 === 0 }));
    enveloppe.donnees.argent = 250_000;
    enveloppe.revision += 1;
    localStorage.setItem(cle, JSON.stringify(enveloppe));
  }, { bourg, boss });
  await page.reload();
  await expect(bourg ? page.getByRole('button', { name: 'Pension Pokémon' }) : attaquer(page)).toBeVisible();
}

const onglet = (page: Page, nom: string) => page.getByRole('navigation').first().getByRole('button', { name: new RegExp(`^${nom}`) }).first();
async function menu(page: Page, tuile: RegExp) {
  await onglet(page, 'Menu').click();
  await page.getByRole('main').locator('button, a').filter({ hasText: tuile }).first().click();
}

async function controler(page: Page, nom: string) {
  await page.waitForTimeout(250);
  const rapport = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const erreurs = rapport.violations.map(v => `${v.id} (${v.nodes.length}) ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' ; ')} : ${v.nodes[0]?.any[0]?.message ?? v.help}`);
  expect(erreurs, `Accessibilité de « ${nom} »`).toEqual([]);
  const etats = await page.locator('[role="status"]:visible').count();
  expect(etats, `Régions « status » visibles en même temps sur « ${nom} »`).toBeLessThanOrEqual(3);
}

const ECRANS: { nom: string; aller: (page: Page, projet: string) => Promise<void> }[] = [
  { nom: 'Combat', aller: async () => {} },
  { nom: 'Combat : réglage de l’arrêt', aller: async page => {
    await page.getByRole('button', { name: /^(Réglages de l'arrêt|Réglage de l'arrêt auto)$/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  } },
  { nom: 'Combat : Sac', aller: async page => {
    await page.getByRole('button', { name: /^Sac/ }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
  } },
  { nom: 'Équipe', aller: async page => { await onglet(page, 'Équipe').click(); } },
  { nom: 'Fiche d’un Pokémon', aller: async page => {
    await onglet(page, 'Équipe').click();
    await page.locator('[aria-label^="Ouvrir la fiche"], [aria-label*=", niveau "]').first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
  } },
  { nom: 'PC', aller: async (page, projet) => {
    if (projet === 'pc') await onglet(page, 'PC').click(); else await menu(page, /^PC/);
  } },
  { nom: 'Shop', aller: async page => { await onglet(page, 'Shop').click(); } },
  { nom: 'Carte', aller: async page => { await onglet(page, 'Carte').click(); } },
  { nom: 'Menu', aller: async page => { await onglet(page, 'Menu').click(); } },
  { nom: 'Monde', aller: page => menu(page, /^Monde/) },
  { nom: 'Réglages', aller: page => menu(page, /^Réglages/) },
  { nom: 'Pokédex', aller: page => menu(page, /^Pokédex/) },
  { nom: 'Badges', aller: page => menu(page, /^Badges/) },
  { nom: 'Statistiques', aller: page => menu(page, /^Statistiques/) },
  { nom: 'Guide du jeu', aller: page => menu(page, /^Guide du jeu/) },
];

test('axe : Bourg Palette et la pension n’ont aucune erreur', async ({ page }) => {
  await demarrer(page, true);
  await controler(page, 'Bourg Palette');
  await page.getByRole('button', { name: 'Pension Pokémon', exact: true }).click();
  await expect(page.getByRole('heading', { name: /^(La pension|Pension)$/ })).toBeVisible();
  await controler(page, 'Pension');
});

for (const ecran of ECRANS) {
  test(`axe : ${ecran.nom} n'a aucune erreur de contraste, de nom ni de rôle`, async ({ page }, info) => {
    await demarrer(page);
    await ecran.aller(page, info.project.name);
    await controler(page, ecran.nom);
  });
}

test('clavier : tout contrôle visible est atteignable par Tab dans l’ordre du document, avec un focus visible', async ({ page }, info) => {
  test.skip(info.project.name !== 'pc', 'Parcours au clavier : PC');
  await demarrer(page);
  await page.locator('body').click({ position: { x: 5, y: 5 } });
  const positifs = await page.locator('[tabindex]:not([tabindex="0"]):not([tabindex="-1"])').count();
  expect(positifs, 'tabindex positif : l’ordre de Tab ne suivrait plus le document').toBe(0);
  const atteints = new Set<string>();
  const sansFocusVisible: string[] = [];
  for (let appui = 0; appui < 120; appui++) {
    await page.keyboard.press('Tab');
    const etat = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const style = getComputedStyle(el);
      const visible = (style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0) || style.boxShadow !== 'none';
      const reperes = [...document.querySelectorAll('*')];
      return { cle: `${reperes.indexOf(el)}`, nom: `${el.tagName}[${el.getAttribute('aria-label') ?? el.textContent?.trim().slice(0, 30)}]`, visible };
    });
    if (!etat) continue;
    if (atteints.has(etat.cle)) break;
    atteints.add(etat.cle);
    if (!etat.visible) sansFocusVisible.push(etat.nom);
  }
  expect(sansFocusVisible, 'Éléments focalisés sans contour ni ombre de focus').toEqual([]);
  const manques = await page.evaluate(atteint => {
    const tous = [...document.querySelectorAll('*')];
    return [...document.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex="0"]')]
      .filter(el => !(el as HTMLButtonElement).disabled && !el.closest('[inert], [hidden], dialog:not([open])') && el.getAttribute('aria-hidden') !== 'true')
      .filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; })
      .filter(el => !atteint.includes(`${tous.indexOf(el)}`))
      .map(el => `${el.tagName}[${el.getAttribute('aria-label') ?? el.textContent?.trim().slice(0, 30)}]`);
  }, [...atteints]);
  expect(manques, 'Contrôles visibles jamais atteints par Tab').toEqual([]);
  expect(atteints.size).toBeGreaterThan(10);
});
