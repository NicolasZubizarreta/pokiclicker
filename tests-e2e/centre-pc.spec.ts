import { readFile } from 'node:fs/promises';
import { expect } from '@playwright/test';
import { test } from './aide-etats-pc';

test.beforeEach(({}, info) => { test.skip(info.project.name !== 'pc', 'Centre commercial : projet PC seulement'); });

for (const [width, height, colonnes] of [[1280, 800, 3], [1440, 900, 4], [1920, 1080, 5], [2560, 1440, 5], [1280, 720, 3]] as const) {
  test(`Centre commercial à ${width} × ${height}`, async ({ page }) => {
    const kanto = JSON.parse(await readFile('data/regions/kanto/zones.json', 'utf8')) as { zones: { ancienId: number; id: string }[] };
    const boss = kanto.zones.filter(z => z.ancienId > 0 && z.ancienId <= 10).map(z => z.id);
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
    await page.addInitScript(bossVaincus => {
      const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'));
      if (!cle || sessionStorage.getItem('centre-pc-prepare')) return;
      sessionStorage.setItem('centre-pc-prepare', '1');
      const enveloppe = JSON.parse(localStorage.getItem(cle)!);
      Object.assign(enveloppe.donnees, { bossVaincus, argent: 250_000, zoneId: 'kanto.tour-pokemon', etape: 1 });
      enveloppe.revision += 1;
      localStorage.setItem(cle, JSON.stringify(enveloppe));
    }, boss);
    await page.reload();
    await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
    await page.locator('body').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('5');
    await page.getByRole('button', { name: /Céladopole/ }).last().click();
    await page.getByRole('dialog', { name: 'Céladopole', exact: true }).getByRole('button', { name: 'Centre commercial' }).click();

    const centre = page.locator('.commercial-pc');
    await expect(centre.getByRole('heading', { name: 'Centre commercial', exact: true })).toBeVisible();
    await expect(centre.getByText('Ton achat', { exact: true })).toBeVisible();
    await expect(centre.getByRole('button', { name: 'Retour à la carte' })).toBeVisible();
    await expect(centre.locator('.produit')).toHaveCount(0);
    const grille = centre.getByRole('group', { name: 'Choisis un objet' });
    const nombre = await grille.evaluate(e => getComputedStyle(e).gridTemplateColumns.split(' ').length);
    if (colonnes) expect(nombre).toBe(colonnes);
    else expect([3, 4]).toContain(nombre);
    expect(await grille.evaluate(e => [e, ...e.querySelectorAll('[data-objet]')].every(c => c.scrollWidth <= c.clientWidth))).toBe(true);

    const mesures = await centre.evaluate(e => {
      const main = document.querySelector<HTMLElement>('main#contenu')!;
      const zone = main.getBoundingClientRect();
      const decor = e.querySelector('img[src="img/decors/centre-commercial.webp"]')!.getBoundingClientRect();
      const achat = e.querySelector('.commercial-achat')!.getBoundingClientRect();
      const entete = e.querySelector('header')!.getBoundingClientRect();
      // La navigation latérale est le frère de la colonne contenant main.
      const laterale = main.parentElement!.previousElementSibling!.getBoundingClientRect();
      return {
        page: document.scrollingElement!.scrollHeight <= innerHeight,
        main: main.scrollHeight <= main.clientHeight,
        decor: (['left', 'top', 'right', 'bottom'] as const).every(cote => Math.abs(decor[cote] - zone[cote]) <= 2),
        droite: decor.left >= laterale.right - 2,
        achatVisible: achat.top >= zone.top && achat.bottom <= zone.bottom,
        enteteVisible: entete.top >= zone.top && entete.bottom <= zone.bottom,
        defilement: getComputedStyle(e.querySelector('.commercial-grille')!).overflowY,
      };
    });
    expect(mesures).toEqual({ page: true, main: true, decor: true, droite: true, achatVisible: true, enteteVisible: true, defilement: 'auto' });

    const carte = grille.locator('[data-objet="calcium"]');
    await carte.click();
    await expect(carte).toHaveAttribute('aria-pressed', 'true');
    const stock = carte.locator('[aria-label^="En sac :"]');
    const avant = Number((await stock.textContent())!.replace('×', ''));
    await centre.getByRole('spinbutton', { name: 'Quantité' }).fill('2');
    await centre.getByRole('button', { name: /^Acheter ×2/ }).click();
    await expect(stock).toHaveText(`×${avant + 2}`);
  });
}
