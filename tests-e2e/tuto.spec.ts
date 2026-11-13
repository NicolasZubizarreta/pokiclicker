import { readFileSync } from 'node:fs';
import { test as base, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

// Ticket E : tutoriel de la Route 1 (8 bulles), mini-tutos de déblocage, rejeu depuis le Guide, persistance, placement de la carte, voile sur le reste de l’écran.
type Etape = { cible: string | null; texte: string; action: string };
type Tuto = { id: string; ecran: string; titre: string; etapes: Etape[] };
type Rect = { x: number; y: number; w: number; h: number };
const tutos = (JSON.parse(readFileSync('data/tutoriels.json', 'utf8')) as { tutoriels: Tuto[] }).tutoriels;
const minis = tutos.filter(t => t.id !== 'route-1');
const zones = (JSON.parse(readFileSync('data/regions/kanto/zones.json', 'utf8')) as { zones: { id: string }[] }).zones.map(z => z.id);
const annoncesVues = ['sac', 'pc', 'pension', 'centre-commercial', 'casino', 'poke-radar-au-shop', 'poke-radar',
  'fauchage-au-shop', 'fauchage', 'auto-clic-au-shop', 'auto-clic'];
const equipe = [3, 6, 9].map(numero => ({
  uid: `tuto-${numero}`, numero, niveau: 5, xp: 0, shiny: false,
  bonheur: 0, pierreEternelle: false, calcium: 0, sexe: 'male', favori: false,
}));

const test = base.extend<{ surveillance: void }>({
  surveillance: [async ({ page }, utiliser) => {
    const erreurs: string[] = [];
    page.on('console', message => { if (message.type() === 'error') erreurs.push(message.text()); });
    page.on('pageerror', erreur => erreurs.push(erreur.message));
    await utiliser();
    expect.soft(erreurs, 'Erreurs de console ou de page').toEqual([]);
  }, { auto: true }],
});

/** Charge le jeu, remplace une fois les champs de la région sauvegardée, arme le tutoriel (clé de développement), puis recharge. */
async function demarrer(page: Page, region: Record<string, unknown>) {
  await page.addInitScript(() => localStorage.setItem('pokiclicker-dev:tuto', '1'));
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.addInitScript(champs => {
    if (sessionStorage.getItem('tuto-prepare')) return;
    sessionStorage.setItem('tuto-prepare', '1');
    const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'))!;
    const enveloppe = JSON.parse(localStorage.getItem(cle)!);
    Object.assign(enveloppe.donnees, champs);
    delete enveloppe.donnees.evenementEnCours;
    enveloppe.revision += 1;
    localStorage.setItem(cle, JSON.stringify(enveloppe));
  }, region);
  await page.reload();
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
}

/** Début de partie : intro jouée, starter choisi, 5 Poké Balls, aucun tutoriel vu. */
const debutDePartie = (page: Page) => demarrer(page, {
  zoneId: 'kanto.route-1', etape: 1, starterId: 25, drapeaux: ['sac-ouvert'], evenementsJoues: ['kanto.intro'],
  inventaire: { pokeball: 5 }, tutosVus: [],
});
/** Partie avancée où tout est débloqué ; les tutoriels listés (par défaut tous) restent à voir. */
const partieAvancee = (page: Page, restants: string[]) => demarrer(page, {
  zoneId: 'kanto.route-1', etape: 1, starterId: 1, equipe, drapeaux: ['sac-ouvert'], evenementsJoues: ['kanto.intro'],
  bossVaincus: zones, ameliorations: ['pokeradar', 'falseSwipe', 'leftovers'], argent: 50000, jetons: 0, casinoVu: true,
  annoncesVues, tutosVus: tutos.map(t => t.id).filter(id => !restants.includes(id)),
});

const carte = (page: Page) => page.getByRole('region', { name: /^Tutoriel / });
const navigation = (page: Page) => page.getByRole('navigation', { name: 'Navigation principale' });
const cibler = (page: Page, id: string) => page.locator(`[data-tuto="${id}"]:visible`).first();
const vus = (page: Page) => page.evaluate(() => {
  const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'))!;
  return (JSON.parse(localStorage.getItem(cle)!).donnees.tutosVus ?? []) as string[];
});
const recouvrement = (a: Rect, b: Rect) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

/** La carte reste dans l'écran, au-dessus de la barre du bas, et ne couvre pas la cible ; le reste de l'écran est voilé. */
async function verifierPlacement(page: Page, cible: string | null) {
  const m = await page.evaluate(id => {
    const rect = (e: Element | null) => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; };
    const visible = id ? [...document.querySelectorAll(`[data-tuto="${id}"]`)].find(e => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; }) ?? null : null;
    const repere = document.querySelector('.tuto-couche .repere:not([hidden])'), voile = document.querySelector('.tuto-couche .voile:not([hidden])');
    return { carte: rect(document.querySelector('.tuto-couche .tuto')), avatar: document.querySelector('.tuto-couche .avatar') !== null,
      cible: rect(visible ?? null), nav: rect(document.querySelector('nav[aria-label="Navigation principale"]')), l: innerWidth, h: innerHeight,
      bordureCarte: getComputedStyle(document.querySelector('.tuto-couche .tuto')!).borderTopWidth,
      bordureRepere: repere ? getComputedStyle(repere).borderTopWidth : null,
      ombreRepere: repere ? getComputedStyle(repere).boxShadow : null,
      fondVoile: voile ? getComputedStyle(voile).backgroundColor : null };
  }, cible);
  expect(m.carte).not.toBeNull();
  expect(m.avatar, 'plus de sprite du professeur').toBe(false);
  expect(m.bordureCarte, 'la carte a un contour').not.toBe('0px');
  if (m.bordureRepere !== null) expect(m.bordureRepere, 'le repère a un contour').not.toBe('0px');
  // Le reste de l'écran est grisé : l'ombre étalée du repère (cible) ou le voile plein écran (sans cible) est teinté, pas transparent.
  const teinte = (couleur: string | null) => couleur !== null && !/rgba?(0, 0, 0, 0)|transparent|^none$/.test(couleur);
  expect(m.ombreRepere !== null ? teinte(m.ombreRepere) : teinte(m.fondVoile), 'le reste de l’écran est voilé').toBe(true);
  const c = m.carte!;
  expect(c.x).toBeGreaterThanOrEqual(-1);
  expect(c.y).toBeGreaterThanOrEqual(-1);
  expect(c.x + c.w).toBeLessThanOrEqual(m.l + 1);
  expect(c.y + c.h).toBeLessThanOrEqual(m.h + 1);
  if (m.nav && m.nav.y > m.h / 2) expect(c.y + c.h).toBeLessThanOrEqual(m.nav.y + 1);
  if (m.cible && m.nav && m.nav.y > m.h / 2 && m.cible.h < m.h / 2 && m.cible.y < m.nav.y - 1) expect(m.cible.y + m.cible.h, 'la cible n’est pas cachée par la barre du bas').toBeLessThanOrEqual(m.nav.y + 1);
  if (m.cible) {
    // Une cible qui occupe plus du quart de l'écran (la scène de combat) ne peut pas toujours rester entièrement libre.
    const grande = m.cible.w * m.cible.h > 0.25 * m.l * m.h;
    expect(recouvrement(c, m.cible) / (m.cible.w * m.cible.h), 'la carte couvre peu la cible').toBeLessThanOrEqual(grande ? 0.2 : 0);
  }
}

/** Déroule les étapes d'un mini-tuto (toutes validées par « Suivant » puis « Compris »). */
async function parcourir(page: Page, tuto: Tuto) {
  const n = tuto.etapes.length;
  for (const [i, etape] of tuto.etapes.entries()) {
    const nom = n > 1 ? `Tutoriel ${tuto.titre}, étape ${i + 1}/${n}` : `Tutoriel ${tuto.titre}`;
    await expect(page.getByRole('region', { name: nom })).toBeVisible();
    await expect(page.locator('.tuto-texte')).toHaveText(etape.texte);
    if (etape.cible) await expect(cibler(page, etape.cible)).toBeVisible();
    await verifierPlacement(page, etape.cible);
    await page.getByRole('button', { name: i === n - 1 ? 'Compris' : 'Suivant', exact: true }).click();
  }
  await expect(carte(page)).toHaveCount(0);
  await expect.poll(() => vus(page)).toContain(tuto.id);
}

/** Sur PC, la liste des tutoriels est une section de la navigation du Guide. */
async function ouvrirTutoriels(page: Page) {
  await ouvrirMenu(page, /^Guide du jeu/);
  const nav = page.getByRole('navigation', { name: 'Sections du guide' });
  if (await nav.isVisible()) await nav.getByRole('button', { name: 'Tutoriels', exact: true }).click();
}

async function ouvrirMenu(page: Page, ligne: RegExp) {
  await navigation(page).getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('button', { name: ligne }).first().click();
}

const route1 = tutos.find(t => t.id === 'route-1')!;

test('Route 1 : les 8 bulles se valident par l’action du joueur, puis le tuto ne revient pas', async ({ page }) => {
  await debutDePartie(page);
  const texte = page.locator('.tuto-texte');
  const etape = async (i: number) => {
    await expect(texte).toHaveText(route1.etapes[i]!.texte);
    await expect(page.getByRole('region', { name: `Tutoriel ${route1.titre}, étape ${i + 1}/8` })).toBeVisible();
    await verifierPlacement(page, route1.etapes[i]!.cible);
  };
  expect(route1.etapes.every(e => e.texte.split(/\s+/).length <= 12)).toBe(true);
  await etape(0);
  await cibler(page, 'ennemi').click();
  await etape(1);
  // Vaincre le Pokémon : des clics en rafale sur l'ennemi.
  for (let i = 0; i < 80 && (await texte.textContent()) !== route1.etapes[2]!.texte; i++) {
    await page.evaluate(() => { const b = document.querySelector<HTMLElement>('[data-tuto="ennemi"]'); for (let k = 0; k < 150; k++) b?.click(); });
    await page.waitForTimeout(150);
  }
  await etape(2);
  await cibler(page, 'capturer').click({ timeout: 20_000 });
  await etape(3);
  await cibler(page, 'auto').click();
  await etape(4);
  await cibler(page, 'arret').click();
  await etape(5);
  await cibler(page, 'onglet-equipe').click();
  await etape(6);
  await cibler(page, 'sac').click();
  await page.keyboard.press('Escape');
  await etape(7);
  await expect(page.getByRole('button', { name: 'Passer le tuto' })).toBeVisible();
  await page.getByRole('button', { name: 'Compris' }).click();
  await expect(carte(page)).toHaveCount(0);
  await expect.poll(() => vus(page)).toContain('route-1');
  await page.reload();
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.waitForTimeout(800);
  await expect(carte(page)).toHaveCount(0);
});

test('« Passer le tuto » ferme sans pénalité et ne revient pas au rechargement', async ({ page }) => {
  await debutDePartie(page);
  await expect(carte(page)).toBeVisible();
  const avant = await page.locator('[data-tuto="ennemi"]:visible').first().isVisible();
  await page.getByRole('button', { name: 'Passer le tuto' }).click();
  await expect(carte(page)).toHaveCount(0);
  expect(avant).toBe(true);
  await expect.poll(() => vus(page)).toContain('route-1');
  await page.reload();
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.waitForTimeout(800);
  await expect(carte(page)).toHaveCount(0);
});

/** Luminance moyenne (0 à 255) d'une capture PNG, calculée dans la page. */
const luminance = (page: Page, png: Buffer) => page.evaluate(async base64 => {
  const image = await createImageBitmap(await (await fetch(`data:image/png;base64,${base64}`)).blob());
  const toile = document.createElement('canvas');
  toile.width = image.width; toile.height = image.height;
  const contexte = toile.getContext('2d')!;
  contexte.drawImage(image, 0, 0);
  const { data } = contexte.getImageData(0, 0, image.width, image.height);
  let somme = 0;
  for (let i = 0; i < data.length; i += 4) somme += 0.2126 * data[i]! + 0.7152 * data[i + 1]! + 0.0722 * data[i + 2]!;
  return somme / (data.length / 4);
}, png.toString('base64'));

test('le reste de l’écran est grisé, la cible et la carte restent nettes', async ({ page }) => {
  await debutDePartie(page);
  await expect(page.locator('.tuto-couche .repere')).toBeVisible();
  const zone = (await navigation(page).boundingBox())!;
  const avec = await page.screenshot({ clip: zone });
  // La cible (l'ennemi) reste cliquable à travers le voile : il n'intercepte aucun appui.
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('.tuto-couche .repere')!).pointerEvents)).toBe('none');
  await page.getByRole('button', { name: 'Passer le tuto' }).click();
  await expect(page.locator('.tuto-couche')).toHaveCount(0);
  const sans = await page.screenshot({ clip: zone });
  expect(await luminance(page, avec), 'la navigation voilée est plus sombre').toBeLessThan(await luminance(page, sans) * 0.9);
});

test('le jeu reste jouable pendant le tuto : l’ennemi se touche sans voile', async ({ page }) => {
  await debutDePartie(page);
  await expect(carte(page)).toBeVisible();
  const avant = await page.getByText(/PV \d+ \/ \d+/).first().textContent();
  await cibler(page, 'ennemi').click();
  await expect.poll(async () => (await page.getByText(/PV \d+ \/ \d+/).first().textContent()) !== avant).toBe(true);
});

for (const tuto of minis) {
  test(`mini-tuto « ${tuto.titre} » : rejoué depuis le Guide`, async ({ page }) => {
    await partieAvancee(page, []);
    await ouvrirTutoriels(page);
    await page.locator('.ligne-tuto', { hasText: tuto.titre }).getByRole('button', { name: 'Rejouer le tuto' }).click();
    await parcourir(page, tuto);
  });
}

for (const tuto of minis.filter(t => ['poke-radar', 'fauchage', 'auto-clic', 'pc', 'pension', 'casino'].includes(t.id))) {
  test(`mini-tuto « ${tuto.titre} » : s’arme à la première visite, une seule fois`, async ({ page }) => {
    await partieAvancee(page, [tuto.id]);
    if (tuto.ecran !== 'Combat') {
      await page.waitForTimeout(600);
      await expect(carte(page)).toHaveCount(0);
    }
    if (tuto.ecran === 'PC') await ouvrirMenu(page, /^PC/);
    if (tuto.ecran === 'Pension') await ouvrirMenu(page, /^Pension/);
    if (tuto.ecran === 'Casino') await ouvrirMenu(page, /^Casino/);
    await parcourir(page, tuto);
    await page.reload();
    await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
    if (tuto.ecran === 'PC') await ouvrirMenu(page, /^PC/);
    if (tuto.ecran === 'Pension') await ouvrirMenu(page, /^Pension/);
    if (tuto.ecran === 'Casino') await ouvrirMenu(page, /^Casino/);
    await page.waitForTimeout(800);
    await expect(carte(page)).toHaveCount(0);
  });
}

test('Guide : chaque tutoriel est listé avec son état et peut être rejoué', async ({ page }) => {
  await debutDePartie(page);
  await page.getByRole('button', { name: 'Passer le tuto' }).click();
  await ouvrirTutoriels(page);
  const section: Locator = page.getByRole('region', { name: 'Tutoriels' });
  for (const tuto of tutos) await expect(section.locator('.ligne-tuto', { hasText: tuto.titre })).toBeVisible();
  await expect(section.locator('.ligne-tuto', { hasText: route1.titre })).toContainText('Vu');
  await expect(section.locator('.ligne-tuto', { hasText: 'Le PC' })).toContainText('Pas encore vu');
});
