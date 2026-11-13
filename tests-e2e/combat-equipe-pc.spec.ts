import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { telephone } from './aide-carte';

// Ticket I, lot I2 : combat et équipe sur PC (1024 px et plus).
const TAILLES: [number, number][] = [[1280, 800], [1440, 900], [1920, 1080], [2560, 1440]];

async function demarrer(page: Page, largeur: number, hauteur: number) {
  await page.setViewportSize({ width: largeur, height: hauteur });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  // Équipe de six, avec les easter eggs (photos Daran et Gabriel, surnoms spéciaux), posée une seule fois.
  await page.addInitScript(() => {
    const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'))!;
    if (sessionStorage.getItem('i2-prepare')) return;
    sessionStorage.setItem('i2-prepare', '1');
    const enveloppe = JSON.parse(localStorage.getItem(cle)!);
    const pokemon = (numero: number, surnom?: string) => ({ uid: `i2-${numero}`, numero, surnom,
      niveau: 16, xp: 0, shiny: false, bonheur: 0, pierreEternelle: false, calcium: 0, sexe: 'male', favori: false });
    enveloppe.donnees.equipe = [pokemon(1, 'Daran'), pokemon(4, 'Gabriel'), pokemon(7, 'DinnerBone'),
      pokemon(10, 'jeb_'), pokemon(13, 'caca'), pokemon(16)];
    enveloppe.revision += 1;
    localStorage.setItem(cle, JSON.stringify(enveloppe));
  });
  await page.reload();
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.locator('body').click({ position: { x: 5, y: 5 } });
}

const pasDeDefilement = async (page: Page) => {
  const m = await page.evaluate(() => {
    const contenu = document.getElementById('contenu')!;
    return { h: document.documentElement.scrollHeight, vh: innerHeight, w: document.documentElement.scrollWidth, vw: innerWidth,
      ch: contenu.scrollHeight, cc: contenu.clientHeight, cw: contenu.scrollWidth, ccw: contenu.clientWidth };
  });
  expect(m.h).toBeLessThanOrEqual(m.vh);
  expect(m.w).toBeLessThanOrEqual(m.vw);
  expect(m.ch).toBeLessThanOrEqual(m.cc + 1);
  expect(m.cw).toBeLessThanOrEqual(m.ccw + 1);
};

async function spritesDansCadres(zone: Locator, cadre: string) {
  const images = zone.locator('img[src*="/sprites/"], img[src*="/easter-eggs/"]');
  let nombre = 0;
  for (const image of await images.all()) {
    if (!await image.isVisible()) continue;
    nombre++;
    await image.evaluate((img: HTMLImageElement) => img.decode());
    const mesure = await image.evaluate((img: HTMLImageElement, selecteur: string) => {
      const c = img.closest(selecteur) ?? img.parentElement!;
      const a = img.getBoundingClientRect(), b = c.getBoundingClientRect();
      return { fit: getComputedStyle(img).objectFit, fond: getComputedStyle(img).backgroundColor,
        ratio: (a.width / a.height) / (img.naturalWidth / img.naturalHeight),
        contenu: a.left >= b.left - 1 && a.top >= b.top - 1 && a.right <= b.right + 1 && a.bottom <= b.bottom + 1 };
    }, cadre);
    expect(mesure.contenu).toBe(true);
    expect(mesure.fit).toBe('contain');
    expect(mesure.fond).toBe('rgba(0, 0, 0, 0)');
    expect(Math.abs(mesure.ratio - 1)).toBeLessThanOrEqual(0.02);
  }
  expect(nombre).toBeGreaterThan(0);
}

test.beforeEach(({ page }) => { test.skip(telephone(page), 'Combat et équipe PC : 1024 px et plus'); });

test('combat PC : scène à gauche, équipe et effets à droite, quatre boutons, aucun défilement (1280 à 2560)', async ({ page }) => {
  await demarrer(page, 1280, 800);
  for (const [largeur, hauteur] of TAILLES) {
    await page.setViewportSize({ width: largeur, height: hauteur });
    const attaque = await page.getByRole('button', { name: /^Attaquer / }).boundingBox();
    const equipe = await page.getByRole('region', { name: 'Ton équipe' }).boundingBox();
    expect(attaque && equipe && equipe.x >= attaque.x + attaque.width).toBe(true);
    expect(attaque!.width).toBeGreaterThan(equipe!.width);
    await expect(page.getByRole('region', { name: 'Effets actifs' })).toBeVisible();
    const boutons = await Promise.all([/^Attaque auto/, /^Arrêt auto/, /^Réglage/, /^Sac/]
      .map(nom => page.getByRole('button', { name: nom }).first().boundingBox()));
    expect(new Set(boutons.map(b => Math.round(b!.y))).size).toBe(largeur >= 1400 ? 1 : 2);
    if (largeur < 1400) expect(new Set(boutons.map(b => Math.round(b!.x))).size).toBe(2);
    for (const b of boutons) expect(b!.height).toBeGreaterThanOrEqual(44);
    await pasDeDefilement(page);
    await spritesDansCadres(page.getByRole('region', { name: 'Ton équipe' }), '.rang-equipe');
  }
});

test('combat PC : la scène s’attaque à la souris et à l’espace, le clic sur un Pokémon ouvre sa fiche', async ({ page }) => {
  await demarrer(page, 1440, 900);
  const pv = page.getByRole('progressbar', { name: /^PV de / });
  const avant = Number(await pv.getAttribute('aria-valuenow'));
  await page.getByRole('button', { name: /^Attaquer / }).click();
  await page.keyboard.press('Space');
  await expect.poll(async () => Number(await pv.getAttribute('aria-valuenow').catch(() => avant))).not.toBe(avant);
  await page.getByRole('region', { name: 'Ton équipe' }).getByRole('button', { name: 'Ouvrir la fiche de Daran' }).click();
  await expect(page.locator('dialog[open]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
});

test('équipe PC : toujours 3 colonnes sur 2 lignes, sans défilement, sprites dans leur carte (1280 à 2560)', async ({ page }) => {
  await demarrer(page, 1280, 800);
  await page.keyboard.press('2');
  await expect(page.getByRole('heading', { name: 'Ton équipe' })).toBeVisible();
  for (const [largeur, hauteur] of TAILLES) {
    await page.setViewportSize({ width: largeur, height: hauteur });
    const cartes = await page.locator('.equipe-pc .grille-equipe > li').evaluateAll(lis => lis.map(li => {
      const r = li.getBoundingClientRect();
      return { x: Math.round(r.left), y: Math.round(r.top), h: r.height, bas: r.bottom };
    }));
    expect(cartes).toHaveLength(6);
    expect(new Set(cartes.map(c => c.x)).size).toBe(3);
    expect(new Set(cartes.map(c => c.y)).size).toBe(2);
    for (const c of cartes) { expect(c.h).toBeGreaterThan(100); expect(c.bas).toBeLessThanOrEqual(hauteur); }
    await pasDeDefilement(page);
    await spritesDansCadres(page.locator('.equipe-pc .grille-equipe'), 'li');
  }
});

test('équipe PC : le dessin du sprite (sans ses lignes vides) reste dans le cadre du portrait, même sur un écran bas', async ({ page }) => {
  await demarrer(page, 1280, 800);
  await page.keyboard.press('2');
  await expect(page.getByRole('heading', { name: 'Ton équipe' })).toBeVisible();
  for (const [largeur, hauteur] of [[1100, 700], [1366, 768], ...TAILLES]) {
    await page.setViewportSize({ width: largeur, height: hauteur });
    const hors = await page.locator('.equipe-pc .portrait').evaluateAll(portraits => portraits.map(p => {
      const cadre = p.getBoundingClientRect(), image = p.querySelector('img')!.getBoundingClientRect();
      const pieds = parseFloat(getComputedStyle(p).getPropertyValue('--pieds')) / 100;
      return image.bottom - pieds * image.height - cadre.bottom;
    }).filter(depassement => depassement > 0.5));
    expect(hors, `${largeur}×${hauteur}`).toEqual([]);
  }
});

test('équipe PC : le clic ouvre la fiche en fenêtre, le tri d’affichage garde six cartes', async ({ page }) => {
  await demarrer(page, 1440, 900);
  await page.keyboard.press('2');
  await page.getByRole('button', { name: /^Daran, niveau/ }).click();
  const fenetre = page.locator('dialog[open]');
  await expect(fenetre).toBeVisible();
  const f = await fenetre.boundingBox();
  expect(f!.x).toBeGreaterThan(0);
  expect(f!.x + f!.width).toBeLessThan(1440);
  await spritesDansCadres(fenetre, 'dialog');
  await page.keyboard.press('Escape');
  await page.getByRole('combobox', { name: "Trier l'équipe" }).selectOption({ index: 1 });
  expect(await page.locator('.equipe-pc .grille-equipe > li').count()).toBe(6);
});
